import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Phone, Calendar, Fingerprint, Edit, Save, Stethoscope } from 'lucide-react'; // Added Stethoscope
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, serverTimestamp, doc, updateDoc, setDoc, getDoc, where, Timestamp, arrayUnion } from 'firebase/firestore'; // Import arrayUnion
import { PatientDocument, UserDocument } from '@/types/database'; // Import UserDocument
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreatePatientForm from '@/components/admin/CreatePatientForm'; // Import the new component

interface DisplayPatient extends PatientDocument {
  id: string; // Firestore document ID
  displayCreatedAt: string;
  assignedDoctorNames: string[]; // New field for display
}

const AdminPatientManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<DisplayPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<DisplayPatient | null>(null);
  const [editedPatientData, setEditedPatientData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    status: 'active' as PatientDocument['status'],
    assignedRadiologistId: '' as string | undefined,
    assignedDoctorIds: [] as string[], // Initialize as empty array
  });
  const [radiologistOptions, setRadiologistOptions] = useState<UserDocument[]>([]); // State for radiologist options
  const [doctorOptions, setDoctorOptions] = useState<UserDocument[]>([]); // State for doctor options
  const [selectedDoctorToAdd, setSelectedDoctorToAdd] = useState<string>(''); // State for adding a new doctor
  const [isSaving, setIsSaving] = useState(false);

  const fetchPatientsAndUsers = async () => {
    if (!db) {
      console.warn("Firestore not available. Cannot fetch patients.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch radiologists for the dropdown and for lookup
      const radiologistsQuery = query(collection(db, "users"), where('role', '==', 'radiologist'));
      const radiologistsSnapshot = await getDocs(radiologistsQuery);
      const fetchedRadiologists: UserDocument[] = radiologistsSnapshot.docs.map(doc => ({
        ...doc.data() as UserDocument,
        id: doc.id,
      }));
      setRadiologistOptions(fetchedRadiologists);

      const radiologistNamesMap = new Map<string, string>();
      fetchedRadiologists.forEach(r => radiologistNamesMap.set(r.id, r.name));

      // Fetch doctors for the dropdown and for lookup
      const doctorsQuery = query(collection(db, "users"), where('role', '==', 'doctor'));
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const fetchedDoctors: UserDocument[] = doctorsSnapshot.docs.map(doc => ({
        ...doc.data() as UserDocument,
        id: doc.id,
      }));
      setDoctorOptions(fetchedDoctors);

      const doctorNamesMap = new Map<string, string>();
      fetchedDoctors.forEach(d => doctorNamesMap.set(d.id, d.name));

      // Fetch patients
      const patientsQuery = query(collection(db, "patients"), orderBy("createdAt", "desc"));
      const patientsSnapshot = await getDocs(patientsQuery);
      const fetchedPatients: DisplayPatient[] = patientsSnapshot.docs.map(doc => {
        const data = doc.data() as PatientDocument;
        // Safely convert createdAt to Date if it's a Timestamp, otherwise handle as string or null
        const createdAtDate = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : null);

        const assignedRadiologistName = data.assignedRadiologistId
          ? radiologistNamesMap.get(data.assignedRadiologistId) || data.assignedRadiologistName || 'N/A'
          : 'N/A';
        
        const assignedDoctorNames = (data.assignedDoctorIds || [])
          .map(docId => doctorNamesMap.get(docId))
          .filter(Boolean) as string[]; // Filter out undefined names

        return {
          ...data,
          id: doc.id,
          displayCreatedAt: createdAtDate?.toLocaleDateString() || 'N/A',
          assignedRadiologistName: assignedRadiologistName, // Ensure this is set
          assignedDoctorNames: assignedDoctorNames, // Set assigned doctor names
        };
      });
      setPatients(fetchedPatients);
    } catch (error) {
      console.error("Error fetching patients or radiologists:", error);
      toast({
        title: 'Error',
        description: 'Failed to load patient list or radiologists.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsAndUsers();
  }, [db, toast]);

  const handleEditClick = (patient: DisplayPatient) => {
    setEditingPatient(patient);
    setEditedPatientData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone || '',
      age: patient.age?.toString() || '',
      gender: patient.gender || '',
      status: patient.status,
      assignedRadiologistId: patient.assignedRadiologistId,
      assignedDoctorIds: patient.assignedDoctorIds || [], // Load existing assigned doctors
    });
    setSelectedDoctorToAdd(''); // Reset add doctor select
    setIsEditDialogOpen(true);
  };

  const handleSavePatient = async () => {
    if (!editingPatient || !db) {
      toast({
        title: 'Error',
        description: 'No patient selected for editing or database not available.',
        variant: 'destructive',
      });
      return;
    }

    if (!editedPatientData.name.trim() || !editedPatientData.email.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Patient name and email cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const patientRef = doc(db, 'patients', editingPatient.id);
      const assignedRadiologist = radiologistOptions.find(r => r.id === editedPatientData.assignedRadiologistId);

      let updatedAssignedDoctorIds = [...editedPatientData.assignedDoctorIds];
      if (selectedDoctorToAdd && !updatedAssignedDoctorIds.includes(selectedDoctorToAdd)) {
        updatedAssignedDoctorIds.push(selectedDoctorToAdd);
      }

      await updateDoc(patientRef, {
        name: editedPatientData.name,
        email: editedPatientData.email,
        phone: editedPatientData.phone || null,
        age: editedPatientData.age ? parseInt(editedPatientData.age) : null,
        gender: editedPatientData.gender || null,
        status: editedPatientData.status,
        assignedRadiologistId: editedPatientData.assignedRadiologistId || null,
        assignedRadiologistName: assignedRadiologist?.name || null,
        assignedDoctorIds: updatedAssignedDoctorIds, // Update assigned doctors array
      });

      toast({
        title: 'Patient Updated',
        description: `Patient ${editedPatientData.name}'s record has been updated.`,
      });
      fetchPatientsAndUsers(); // Refresh the list
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update patient record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAssignedDoctor = async (doctorIdToRemove: string) => {
    if (!editingPatient || !db || !user) {
      toast({
        title: 'Error',
        description: 'No patient selected for editing or database/authentication not available.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      const patientRef = doc(db, 'patients', editingPatient.id);
      const updatedAssignedDoctorIds = editedPatientData.assignedDoctorIds.filter(id => id !== doctorIdToRemove);
      
      await updateDoc(patientRef, {
        assignedDoctorIds: updatedAssignedDoctorIds,
      });

      setEditedPatientData(prev => ({
        ...prev,
        assignedDoctorIds: updatedAssignedDoctorIds,
      }));

      toast({
        title: 'Doctor Removed',
        description: 'Assigned doctor has been removed from the patient.',
      });
    } catch (error) {
      console.error('Error removing assigned doctor:', error);
      toast({
        title: 'Removal Failed',
        description: 'Could not remove doctor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.assignedRadiologistName && patient.assignedRadiologistName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      patient.assignedDoctorNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        return 'bg-gray-500/20 text-gray-500'; // Using defined gray colors
      default:
        return 'bg-secondary';
    }
  };

  const canManagePatients = user?.role === 'admin' || user?.role === 'radiologist';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
        <p className="text-muted-foreground">Create and manage patient records and IDs.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManagePatients && (
          <CreatePatientForm 
            onPatientCreated={fetchPatientsAndUsers} 
            radiologistOptions={radiologistOptions} // Pass the prop here
          />
        )}

        <Card className={`glass-card ${canManagePatients ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <CardHeader>
            <CardTitle>Existing Patient Records</CardTitle>
            <CardDescription>Overview of all patient records in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name, ID, email, status, radiologist, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No patient records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Radiologist</TableHead>
                      <TableHead>Doctors</TableHead> {/* New column */}
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.id}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(patient.status)}>
                            {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{patient.assignedRadiologistName || 'N/A'}</TableCell>
                        <TableCell>
                          {patient.assignedDoctorNames && patient.assignedDoctorNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {patient.assignedDoctorNames.map((doctorName, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-medical-info/20 text-medical-info">
                                  {doctorName}
                                </Badge>
                              ))}
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{patient.displayCreatedAt}</TableCell>
                        <TableCell>
                          {canManagePatients && (
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(patient)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patient Record</DialogTitle>
            <DialogDescription>
              Make changes to {editingPatient?.name}'s record here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-patient-name">Full Name</Label>
              <Input
                id="edit-patient-name"
                value={editedPatientData.name}
                onChange={(e) => setEditedPatientData({ ...editedPatientData, name: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patient-email">Email</Label>
              <Input
                id="edit-patient-email"
                type="email"
                value={editedPatientData.email}
                onChange={(e) => setEditedPatientData({ ...editedPatientData, email: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patient-phone">Phone</Label>
              <Input
                id="edit-patient-phone"
                type="tel"
                value={editedPatientData.phone}
                onChange={(e) => setEditedPatientData({ ...editedPatientData, phone: e.target.value })}
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient-age">Age</Label>
                <Input
                  id="edit-patient-age"
                  type="number"
                  placeholder="e.g., 35"
                  value={editedPatientData.age}
                  onChange={(e) => setEditedPatientData({ ...editedPatientData, age: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-patient-gender">Gender</Label>
                <Input
                  id="edit-patient-gender"
                  placeholder="e.g., Male, Female"
                  value={editedPatientData.gender}
                  onChange={(e) => setEditedPatientData({ ...editedPatientData, gender: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patient-status">Status</Label>
              <Select value={editedPatientData.status} onValueChange={(value: PatientDocument['status']) => setEditedPatientData({ ...editedPatientData, status: value })} disabled={isSaving}>
                <SelectTrigger id="edit-patient-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assigned-radiologist">Assigned Radiologist</Label>
              <Select
                value={editedPatientData.assignedRadiologistId || ''}
                onValueChange={(value) => setEditedPatientData({ ...editedPatientData, assignedRadiologistId: value || undefined })}
                disabled={isSaving}
              >
                <SelectTrigger id="edit-assigned-radiologist">
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
              <Label htmlFor="add-doctor">Assigned Doctors</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedPatientData.assignedDoctorIds.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No doctors assigned.</span>
                ) : (
                  editedPatientData.assignedDoctorIds.map(doctorId => {
                    const doctor = doctorOptions.find(d => d.id === doctorId);
                    return (
                      <Badge key={doctorId} variant="secondary" className="bg-medical-info/20 text-medical-info">
                        {doctor?.name || 'Unknown Doctor'}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 text-medical-info hover:bg-medical-info/30"
                          onClick={() => handleRemoveAssignedDoctor(doctorId)}
                          disabled={isSaving}
                        >
                          &times;
                        </Button>
                      </Badge>
                    );
                  })
                )}
              </div>
              <Select value={selectedDoctorToAdd} onValueChange={setSelectedDoctorToAdd} disabled={isSaving || doctorOptions.length === 0}>
                <SelectTrigger id="add-doctor">
                  <SelectValue placeholder="Add a doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>Select a doctor to add</SelectItem>
                  {doctorOptions.length === 0 ? (
                    <SelectItem value="no-doctors" disabled>No doctors found</SelectItem>
                  ) : (
                    doctorOptions
                      .filter(d => !editedPatientData.assignedDoctorIds.includes(d.id)) // Only show unassigned doctors
                      .map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePatient} disabled={isSaving || !editedPatientData.name.trim() || !editedPatientData.email.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPatientManagement;