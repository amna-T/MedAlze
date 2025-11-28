import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, Edit, Save, Loader2, Upload, Search, Mail, Phone } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, doc, updateDoc, where, serverTimestamp, arrayUnion } from 'firebase/firestore'; // Import arrayUnion
import { Appointment, UserDocument, PatientDocument } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { addNotification } from '@/utils/notificationUtils'; // Import the utility function

interface DisplayAppointment extends Appointment {
  id: string;
  displayCreatedAt: string;
  displayPreferredDate: string;
  patientEmail: string; // Added patient email
  patientPhone?: string; // Added patient phone
}

const AppointmentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed addNotification from useNotifications destructuring
  const navigate = useNavigate(); // Initialize useNavigate
  const [allAppointments, setAllAppointments] = useState<DisplayAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<DisplayAppointment[]>([]);
  const [radiologistOptions, setRadiologistOptions] = useState<UserDocument[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<UserDocument[]>([]); // New state for doctor options
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<DisplayAppointment | null>(null);
  const [editedStatus, setEditedStatus] = useState<Appointment['status']>('pending');
  const [editedRadiologistId, setEditedRadiologistId] = useState<string | undefined>(undefined);
  const [editedDoctorId, setEditedDoctorId] = useState<string | undefined>(undefined); // New state for assigned doctor
  const [editedPreferredDate, setEditedPreferredDate] = useState('');
  const [editedPreferredTime, setEditedPreferredTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAppointmentsAndUsers = async () => {
    if (!db) {
      console.warn("Firestore not available. Cannot fetch appointments or users.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all users (doctors and radiologists)
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers: UserDocument[] = usersSnapshot.docs.map(doc => ({
        ...doc.data() as UserDocument,
        id: doc.id,
      }));
      setRadiologistOptions(allUsers.filter(u => u.role === 'radiologist'));
      setDoctorOptions(allUsers.filter(u => u.role === 'doctor'));

      // Fetch all patients to get their emails and phones
      const patientsQuery = query(collection(db, "patients"));
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientDetailsMap = new Map<string, { name: string; email: string; phone?: string; userId: string | null }>();
      patientsSnapshot.forEach(doc => {
        const data = doc.data() as PatientDocument;
        patientDetailsMap.set(doc.id, { name: data.name, email: data.email, phone: data.phone, userId: data.userId });
      });

      // Fetch appointments
      const appointmentsQuery = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const fetchedAppointments: DisplayAppointment[] = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data() as Appointment;
        const patientInfo = patientDetailsMap.get(data.patientId);
        
        return {
          ...data,
          id: doc.id,
          displayCreatedAt: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          displayPreferredDate: new Date(data.preferredDate).toLocaleDateString() || 'N/A',
          patientName: patientInfo?.name || data.patientName, // Use fetched name if available
          patientEmail: patientInfo?.email || data.patientEmail, // Use fetched email if available
          patientPhone: patientInfo?.phone || undefined, // Use fetched phone if available
        };
      });
      setAllAppointments(fetchedAppointments);
      setFilteredAppointments(fetchedAppointments); // Initialize filtered list
    } catch (error) {
      console.error("Error fetching appointments or users:", error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments or user lists.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentsAndUsers();
  }, [db, toast]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = allAppointments.filter(app =>
      app.patientName.toLowerCase().includes(lowerCaseSearchTerm) ||
      app.patientEmail.toLowerCase().includes(lowerCaseSearchTerm) ||
      app.type.toLowerCase().includes(lowerCaseSearchTerm) ||
      (app.examType && app.examType.toLowerCase().includes(lowerCaseSearchTerm)) ||
      app.status.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredAppointments(filtered);
  }, [searchTerm, allAppointments]);

  const getStatusBadgeClass = (status: Appointment["status"]) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-600';
      case 'completed':
        return 'bg-green-500/20 text-green-600';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      case 'rescheduled':
        return 'bg-orange-500/20 text-orange-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  const handleEditClick = (appointment: DisplayAppointment) => {
    setEditingAppointment(appointment);
    setEditedStatus(appointment.status);
    setEditedRadiologistId(appointment.assignedRadiologistId);
    setEditedDoctorId(appointment.assignedDoctorId); // Set assigned doctor
    setEditedPreferredDate(appointment.preferredDate);
    setEditedPreferredTime(appointment.preferredTime || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!editingAppointment || !db || !user) {
      toast({
        title: 'Error',
        description: 'No appointment selected for editing or database/authentication not available.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const appointmentRef = doc(db, 'appointments', editingAppointment.id);
      const assignedRadiologist = radiologistOptions.find(r => r.id === editedRadiologistId);
      const assignedDoctor = doctorOptions.find(d => d.id === editedDoctorId); // Find assigned doctor

      // Prevent setting status to 'completed' if it's an X-ray scan and no X-ray is linked yet
      if (editedStatus === 'completed' && editingAppointment.type === 'xray_scan' && !editingAppointment.xrayId) {
        toast({
          title: 'Cannot Complete X-ray Appointment',
          description: 'An X-ray scan appointment can only be marked "completed" after the X-ray has been uploaded and linked.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      await updateDoc(appointmentRef, {
        status: editedStatus,
        assignedRadiologistId: editedRadiologistId || null,
        assignedRadiologistName: assignedRadiologist?.name || null,
        assignedDoctorId: editedDoctorId || null, // Update assigned doctor ID
        assignedDoctorName: assignedDoctor?.name || null, // Update assigned doctor name
        preferredDate: editedPreferredDate,
        preferredTime: editedPreferredTime || null,
        updatedAt: serverTimestamp(),
      });

      // Update the patient document with the assigned doctor's ID if changed
      if (editedDoctorId && editedDoctorId !== editingAppointment.assignedDoctorId) {
        const patientRef = doc(db, 'patients', editingAppointment.patientId);
        await updateDoc(patientRef, {
          assignedDoctorIds: arrayUnion(editedDoctorId)
        });
        console.log(`AppointmentManagement: Patient ${editingAppointment.patientId} updated with assignedDoctorId ${editedDoctorId}.`);
      }


      toast({
        title: 'Appointment Updated',
        description: `Appointment for ${editingAppointment.patientName} has been updated.`,
      });

      // Send notification to the patient if status changed to scheduled
      if (editedStatus === 'scheduled' && editingAppointment.status !== 'scheduled') {
        // Fetch patient's userId (Firebase UID) from the patientDetailsMap
        const patientInfo = (await getDocs(query(collection(db, 'patients'), where('__name__', '==', editingAppointment.patientId)))).docs[0]?.data() as PatientDocument;
        const patientUserId = patientInfo?.userId;

        if (patientUserId) {
          await addNotification(
            patientUserId, // Patient's Firebase UID
            'Appointment Scheduled',
            `Your X-ray appointment for ${editingAppointment.examType?.replace(/_/g, ' ') || editingAppointment.type.replace(/_/g, ' ')} on ${new Date(editedPreferredDate).toLocaleDateString()} at ${editedPreferredTime || 'N/A'} has been scheduled.`,
            'success',
            { type: 'update_profile', payload: editingAppointment.id }, // Placeholder action, could be 'view_appointment'
            user.id,
            user.name
          );
        }
      }

      // Send notification to the assigned doctor if a doctor is assigned and it's a new assignment or status changed to scheduled
      if (editedDoctorId && (editedDoctorId !== editingAppointment.assignedDoctorId || (editedStatus === 'scheduled' && editingAppointment.status !== 'scheduled'))) {
        await addNotification(
          editedDoctorId, // Assigned Doctor's Firebase UID
          'New Appointment Scheduled for Your Patient',
          `An appointment for your patient ${editingAppointment.patientName} on ${new Date(editedPreferredDate).toLocaleDateString()} at ${editedPreferredTime || 'N/A'} has been scheduled.`,
          'info',
          { type: 'view_report', payload: editingAppointment.id }, // Link to reports or a specific appointment view
          user.id,
          user.name
        );
      }


      fetchAppointmentsAndUsers(); // Refresh the list
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadXrayForAppointment = (appointmentId: string) => {
    navigate(`/upload-xray?appointmentId=${appointmentId}`);
    setIsEditDialogOpen(false); // Close the dialog
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointment Management</h2>
        <p className="text-muted-foreground">Manage patient appointment requests and scheduling.</p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments by patient name, email, type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No appointment requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Preferred Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Radiologist</TableHead>
                    <TableHead>Assigned Doctor</TableHead> {/* New column */}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {appointment.patientEmail}
                      </TableCell>
                      <TableCell className="text-muted-foreground flex items-center gap-1">
                        {appointment.patientPhone ? <Phone className="h-3 w-3" /> : null} {appointment.patientPhone || 'N/A'}
                      </TableCell>
                      <TableCell>{appointment.examType ? appointment.examType.replace(/_/g, ' ') : appointment.type.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{appointment.displayCreatedAt}</TableCell>
                      <TableCell>{appointment.displayPreferredDate} {appointment.preferredTime}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(appointment.status)}>
                          {appointment.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.assignedRadiologistName || 'N/A'}</TableCell>
                      <TableCell>{appointment.assignedDoctorName || 'N/A'}</TableCell> {/* Display assigned doctor */}
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Manage the appointment details for {editingAppointment?.patientName}.
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editedStatus} onValueChange={(value: Appointment['status']) => setEditedStatus(value)} disabled={isSaving}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-radiologist">Assign Radiologist</Label>
                <Select value={editedRadiologistId || ''} onValueChange={setEditedRadiologistId} disabled={isSaving}>
                  <SelectTrigger id="edit-radiologist">
                    <SelectValue placeholder="Assign a radiologist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem> {/* Option to unassign */}
                    {radiologistOptions.length === 0 ? (
                      <SelectItem value="no-radiologists" disabled>No radiologists found</SelectItem>
                    ) : (
                      radiologistOptions.map((radiologist) => (
                        <SelectItem key={radiologist.id} value={radiologist.id}>
                          {radiologist.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doctor">Assign Doctor</Label> {/* New doctor assignment field */}
                <Select value={editedDoctorId || ''} onValueChange={setEditedDoctorId} disabled={isSaving}>
                  <SelectTrigger id="edit-doctor">
                    <SelectValue placeholder="Assign a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem> {/* Option to unassign */}
                    {doctorOptions.length === 0 ? (
                      <SelectItem value="no-doctors" disabled>No doctors found</SelectItem>
                    ) : (
                      doctorOptions.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-preferred-date">Preferred Date</Label>
                  <Input
                    id="edit-preferred-date"
                    type="date"
                    value={editedPreferredDate}
                    onChange={(e) => setEditedPreferredDate(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-preferred-time">Preferred Time (Optional)</Label>
                  <Input
                    id="edit-preferred-time"
                    type="time"
                    value={editedPreferredTime}
                    onChange={(e) => setEditedPreferredTime(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Symptoms</Label>
                <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">{editingAppointment.symptoms}</p>
              </div>
              {editingAppointment.medicalHistory && (
                <div className="space-y-2">
                  <Label>Medical History</Label>
                  <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">{editingAppointment.medicalHistory}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            {editingAppointment?.type === 'xray_scan' && editingAppointment.status === 'scheduled' && !editingAppointment.xrayId && (
              <Button onClick={() => handleUploadXrayForAppointment(editingAppointment.id)} disabled={isSaving}>
                <Upload className="mr-2 h-4 w-4" />
                Upload X-ray
              </Button>
            )}
            <Button onClick={handleSaveAppointment} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentManagement;