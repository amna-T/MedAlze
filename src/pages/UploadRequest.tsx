import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, FileText, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp, documentId, arrayUnion, doc, updateDoc } from 'firebase/firestore'; // Import doc and updateDoc
import { Appointment, PatientDocument, XRayRecord } from '@/types/database'; // Import PatientDocument and XRayRecord
import { Link } from 'react-router-dom';

interface DisplayAppointment extends Appointment {
  id: string;
  displayCreatedAt: string;
}

interface PatientOption {
  id: string; // This is the patientId (document ID in 'patients' collection)
  name: string;
  email: string;
  medicalHistory?: string;
}

const UploadRequest = () => {
  const { user } = useAuth();
  const [examType, setExamType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [requests, setRequests] = useState<DisplayAppointment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  // New states for doctor's patient selection
  const [selectedPatientIdForDoctor, setSelectedPatientIdForDoctor] = useState<string>('');
  const [patientOptionsForDoctor, setPatientOptionsForDoctor] = useState<PatientOption[]>([]);

  const isDoctor = user?.role === 'doctor';

  // Effect to fetch patient options if the user is a doctor
  useEffect(() => {
    const fetchPatientOptions = async () => {
      if (!db || !isDoctor || !user?.id) return;

      try {
        // Doctors should fetch patients they are assigned to directly from the 'patients' collection
        const patientsQuery = query(
          collection(db, "patients"),
          where('assignedDoctorIds', 'array-contains', user.id)
        );
        const patientsSnapshot = await getDocs(patientsQuery);
        
        const fetchedPatients: PatientOption[] = patientsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: (doc.data() as PatientDocument).name,
          email: (doc.data() as PatientDocument).email,
          medicalHistory: (doc.data() as PatientDocument).medicalHistory,
        }));
        
        setPatientOptionsForDoctor(fetchedPatients);
        if (fetchedPatients.length > 0 && !selectedPatientIdForDoctor) {
          setSelectedPatientIdForDoctor(fetchedPatients[0].id); // Auto-select first patient
        }
      } catch (error) {
        console.error('Error fetching patient options for doctor:', error);
        toast({
          title: 'Error',
          description: 'Failed to load patient list.',
          variant: 'destructive'
        });
      }
    };

    fetchPatientOptions();
  }, [db, isDoctor, user?.id, toast, selectedPatientIdForDoctor]);


  useEffect(() => {
    const fetchRequests = async () => {
      if (!db || !user?.id) {
        setIsLoadingHistory(false);
        return;
      }

      let patientIdForQuery: string | undefined;

      if (isDoctor) {
        patientIdForQuery = selectedPatientIdForDoctor;
      } else {
        patientIdForQuery = user.patientId;
      }

      if (!patientIdForQuery) {
        console.warn("Patient ID not found for current user or no patient selected. Cannot fetch requests.");
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        // Query the 'appointments' collection
        let q = query(
          collection(db, 'appointments'),
          where('patientId', '==', patientIdForQuery),
          orderBy('createdAt', 'desc')
        );

        // If the user is a doctor, filter by assignedDoctorId to match security rules
        if (isDoctor) {
          q = query(q, where('assignedDoctorId', '==', user.id));
        }

        const querySnapshot = await getDocs(q);
        const fetchedRequests: DisplayAppointment[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as Appointment;
          return {
            ...data,
            id: doc.id,
            displayCreatedAt: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          };
        });
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load request history.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchRequests();
  }, [db, user, toast, isDoctor, selectedPatientIdForDoctor]); // Added isDoctor and selectedPatientIdForDoctor to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examType || !preferredDate || !symptoms) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    if (!user?.id || !db || !user.email || !user.name) {
      toast({
        title: 'Authentication Error',
        description: 'User data incomplete or not logged in. Cannot submit request.',
        variant: 'destructive',
      });
      return;
    }

    let patientIdForRequest: string | undefined;
    let patientNameForRequest: string | undefined;
    let patientEmailForRequest: string | undefined;
    let patientMedicalHistoryForRequest: string | undefined;

    if (isDoctor) {
      if (!selectedPatientIdForDoctor) {
        toast({
          title: 'Missing Information',
          description: 'Please select a patient for this request.',
          variant: 'destructive',
        });
        return;
      }
      const selectedPatient = patientOptionsForDoctor.find(p => p.id === selectedPatientIdForDoctor);
      if (!selectedPatient) {
        toast({
          title: 'Error',
          description: 'Selected patient not found in the system.',
          variant: 'destructive',
        });
        return;
      }
      patientIdForRequest = selectedPatient.id;
      patientNameForRequest = selectedPatient.name;
      patientEmailForRequest = selectedPatient.email;
      patientMedicalHistoryForRequest = selectedPatient.medicalHistory;
    } else {
      // For patients, use their own data
      if (!user.patientId) {
        toast({
          title: 'Authentication Error',
          description: 'Patient ID not found for your account. Cannot submit request.',
          variant: 'destructive',
        });
        return;
      }
      patientIdForRequest = user.patientId;
      patientNameForRequest = user.name;
      patientEmailForRequest = user.email;
      // For patients, medicalHistory comes from their profile, not a separate input here
      // We can fetch it if needed, but for now, use the input field for the request's specific history
    }

    if (!patientIdForRequest || !patientNameForRequest || !patientEmailForRequest) {
      toast({
        title: 'Error',
        description: 'Patient information is incomplete. Cannot submit request.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newAppointment: Omit<Appointment, 'id'> = {
        patientId: patientIdForRequest,
        patientName: patientNameForRequest,
        patientEmail: patientEmailForRequest,
        requestedByUserId: user.id,
        requestedByUserName: user.name,
        type: examType === 'consultation' || examType === 'follow_up' ? examType : 'xray_scan', // Determine type based on examType
        preferredDate,
        symptoms,
        medicalHistory: medicalHistory.trim() === '' ? null : medicalHistory || patientMedicalHistoryForRequest || null, 
        status: 'pending', // Initial status for a new request
        createdAt: serverTimestamp() as Timestamp,
      };

      // Conditionally add examType only if it's an X-ray scan
      if (newAppointment.type === 'xray_scan') {
        (newAppointment as Appointment).examType = examType;
      }

      // If a doctor is making the request, assign them as the assignedDoctorId
      if (isDoctor) {
        newAppointment.assignedDoctorId = user.id;
        newAppointment.assignedDoctorName = user.name;

        // Also update the patient document with the assigned doctor's ID
        const patientRef = doc(db, 'patients', patientIdForRequest);
        await updateDoc(patientRef, {
          assignedDoctorIds: arrayUnion(user.id)
        });
        console.log(`UploadRequest: Patient ${patientIdForRequest} updated with assignedDoctorId ${user.id}.`);
      }

      await addDoc(collection(db, 'appointments'), newAppointment);

      toast({
        title: 'Request Submitted',
        description: 'Your appointment request has been sent.',
      });

      // Refresh requests
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientIdForRequest),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const updatedRequests: DisplayAppointment[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Appointment;
        return {
          ...data,
          id: doc.id,
          displayCreatedAt: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
        };
      });
      setRequests(updatedRequests);

      // Reset form
      setExamType('');
      setPreferredDate('');
      setSymptoms('');
      setMedicalHistory('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Submission Failed',
        description: 'Could not submit your request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/20 text-primary';
      case 'scheduled':
        return 'bg-accent/20 text-accent';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      case 'rescheduled':
        return 'bg-orange-500/20 text-orange-600';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointment Request</h2>
        <p className="text-muted-foreground">Request a new X-ray examination or consultation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Fill in the details for your appointment request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isDoctor && (
                <div className="space-y-2">
                  <Label htmlFor="patient-select-for-doctor">Select Patient *</Label>
                  <Select
                    value={selectedPatientIdForDoctor}
                    onValueChange={setSelectedPatientIdForDoctor}
                    disabled={isSubmitting || patientOptionsForDoctor.length === 0}
                  >
                    <SelectTrigger id="patient-select-for-doctor">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptionsForDoctor.length === 0 ? (
                        <SelectItem value="no-patients" disabled>No patients found</SelectItem>
                      ) : (
                        patientOptionsForDoctor.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} (ID: {patient.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {patientOptionsForDoctor.length === 0 && (
                    <p className="text-xs text-destructive">No patients available. Please create a patient record first.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="examType">Examination Type *</Label>
                <Select value={examType} onValueChange={setExamType} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select examination type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chest">Chest X-ray</SelectItem>
                    <SelectItem value="abdomen">Abdominal X-ray</SelectItem>
                    <SelectItem value="spine">Spine X-ray</SelectItem>
                    <SelectItem value="extremity">Extremity X-ray</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms / Reason *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe your symptoms or reason for examination/consultation..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Relevant Medical History (Optional)</Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Any relevant medical history..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Processing Time</p>
                    <p className="text-muted-foreground">
                      Requests are typically reviewed within 24-48 hours. You'll receive a notification once your appointment is scheduled.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !examType || !preferredDate || !symptoms || (isDoctor && !selectedPatientIdForDoctor)}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>Your previous appointment requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : requests.length === 0 ? (
                <p className="text-muted-foreground text-center">No appointment requests found.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Request ID: {request.id.substring(0, 8)}...</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{request.examType ? request.examType.replace(/_/g, ' ') : request.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {request.assignedRadiologistName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Radiologist: {request.assignedRadiologistName}</span>
                          </div>
                        )}
                        {request.assignedDoctorName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Doctor: {request.assignedDoctorName}</span>
                          </div>
                        )}
                      </div>
                      {request.status === 'scheduled' && (
                        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                          <Link to={`/reports?xrayId=${request.xrayId}`}>View Related Report</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>What to Expect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">1. Request Submission</p>
                  <p className="text-muted-foreground">Your request is sent for review.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">2. Review & Schedule</p>
                  <p className="text-muted-foreground">A medical professional reviews and schedules your appointment.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">3. Appointment & Analysis</p>
                  <p className="text-muted-foreground">Attend your appointment. If an X-ray, it will be taken and analyzed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">4. Results Available</p>
                  <p className="text-muted-foreground">View your report or consultation notes in "My Reports".</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UploadRequest;