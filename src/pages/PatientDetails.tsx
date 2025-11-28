import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Removed Layout and Navigation imports
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Calendar, FileText, Activity, ArrowLeft, Stethoscope } from 'lucide-react'; // Added Stethoscope
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { PatientDocument, XRayRecord } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { CONDITIONS_METADATA } from '@/utils/conditionsMetadata';
import { Condition } from '@/utils/xrayAnalysis'; // Import Condition
import { useAuth } from '@/contexts/AuthContext';

interface DisplayPatient extends PatientDocument {
  id: string;
  displayCreatedAt: string;
}

interface DisplayXRay extends XRayRecord {
  id: string;
  displayDate: string;
}

const PatientDetails = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [patient, setPatient] = useState<DisplayPatient | null>(null);
  const [xrays, setXrays] = useState<DisplayXRay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      console.log("PatientDetails: Attempting to fetch data for patientId:", patientId);
      console.log("PatientDetails: Current authenticated user role:", user?.role); // NEW LOG
      console.log("PatientDetails: Current authenticated user ID:", user?.id);   // NEW LOG

      if (!db) {
        setError("Database not available.");
        setLoading(false);
        return;
      }
      if (!patientId) { // Check if patientId is actually missing
        setError("Patient ID is missing from the URL.");
        setLoading(false);
        return;
      }
      if (!user) { // Ensure user is loaded before making role-based queries
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch patient document
        const patientDocRef = doc(db, 'patients', patientId);
        const patientDocSnap = await getDoc(patientDocRef);

        if (!patientDocSnap.exists()) {
          setError("Patient not found.");
          setLoading(false);
          return;
        }

        const patientData = patientDocSnap.data() as PatientDocument;
        setPatient({
          ...patientData,
          id: patientDocSnap.id,
          displayCreatedAt: patientData.createdAt?.toDate().toLocaleDateString() || 'N/A',
        });

        // Fetch patient's X-ray records
        let xraysQuery = query(
          collection(db, 'xrays'),
          where('patientId', '==', patientId),
          orderBy('uploadedAt', 'desc')
        );

        // IMPORTANT: Add a filter for doctors to only see X-rays assigned to them
        if (user.role === 'doctor' && user.id) {
          xraysQuery = query(xraysQuery, where('assignedDoctorId', '==', user.id));
          console.log(`PatientDetails: Doctor user. Filtering X-rays for assignedDoctorId: ${user.id}`);
        }
        // Radiologists and Admins can see all X-rays for the patient, so no additional filter needed for them.

        const xraysSnapshot = await getDocs(xraysQuery);
        const fetchedXrays: DisplayXRay[] = xraysSnapshot.docs.map(doc => {
          const data = doc.data() as XRayRecord;
          return {
            ...data,
            id: doc.id,
            displayDate: data.uploadedAt?.toDate().toLocaleDateString() || 'N/A',
          };
        });
        setXrays(fetchedXrays);

      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError("Failed to load patient data. Please try again.");
        toast({
          title: 'Error',
          description: 'Failed to load patient data.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [db, patientId, toast, user]); // Added user to dependency array

  const getStatusBadgeClass = (status: PatientDocument["status"]) => {
    switch (status) {
      case 'active':
        return 'bg-primary/20 text-primary';
      case 'monitoring':
        return 'bg-accent/20 text-accent';
      case 'treatment':
        return 'bg-destructive/20 text-destructive';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'unclaimed':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-secondary';
    }
  };

  const getInitials = (nameString: string) => {
    return nameString
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <p className="text-lg">{error}</p>
        <Button onClick={() => window.history.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">Patient data could not be loaded.</p>
        <Button onClick={() => window.history.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Details</h2>
          <p className="text-muted-foreground">Comprehensive overview of {patient.name}'s record.</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>Basic and medical details of the patient.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {getInitials(patient.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold">{patient.name}</h3>
              <p className="text-muted-foreground">Patient ID: {patient.id}</p>
              <Badge className={getStatusBadgeClass(patient.status)}>{patient.status.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.age || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.gender || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Registered On</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.displayCreatedAt}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Assigned Radiologist</p>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">{patient.assignedRadiologistName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {patient.medicalHistory && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Medical History</p>
              <p className="text-sm bg-muted p-3 rounded-md">{patient.medicalHistory}</p>
            </div>
          )}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="secondary">{allergy}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>X-Ray Reports</CardTitle>
          <CardDescription>All X-ray reports associated with {patient.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {xrays.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No X-ray reports found for this patient.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Condition</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {xrays.map((xray) => (
                    <tr key={xray.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="py-3">{xray.displayDate}</td>
                      <td className="py-3">{xray.examType ? xray.examType.replace(/_/g, ' ') : 'N/A'}</td>
                      <td className="py-3">
                        <Badge 
                          variant={
                            xray.status === 'reviewed' ? 'default' :
                            xray.status === 'analyzed' ? 'secondary' :
                            'outline'
                          }
                        >
                          {xray.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {xray.aiAnalysis?.condition ? (
                          <Badge 
                            variant={
                              CONDITIONS_METADATA[xray.aiAnalysis.condition as Condition].severity === 'high' 
                                ? 'destructive' 
                                : CONDITIONS_METADATA[xray.aiAnalysis.condition as Condition].severity === 'medium'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {CONDITIONS_METADATA[xray.aiAnalysis.condition as Condition].label}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" asChild disabled={!xray.report}>
                          <Link to={`/reports?reportId=${xray.id}`}>View Report</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetails;