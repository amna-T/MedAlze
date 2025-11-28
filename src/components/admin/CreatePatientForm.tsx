import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, User, Mail, Phone, Stethoscope } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, serverTimestamp, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserDocument } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { addNotification } from '@/utils/notificationUtils';

interface CreatePatientFormProps {
  onPatientCreated: () => void;
  radiologistOptions: UserDocument[];
}

const CreatePatientForm = ({ onPatientCreated, radiologistOptions }: CreatePatientFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
  });

  // Determine if the current user is a radiologist creating a patient
  const isRadiologistCreating = user?.role === 'radiologist';

  // State for assigned radiologist, only relevant if an admin is using the form
  const [selectedAssignedRadiologistId, setSelectedAssignedRadiologistId] = useState<string | undefined>(
    isRadiologistCreating ? user.id : undefined // Default to current radiologist if applicable
  );
  const [generatedPatientId, setGeneratedPatientId] = useState<string | null>(null);

  // Effect to set the radiologist ID if the user is a radiologist
  useEffect(() => {
    if (isRadiologistCreating && user?.id) {
      setSelectedAssignedRadiologistId(user.id);
    } else if (!isRadiologistCreating) {
      // If not a radiologist, ensure it's undefined initially for admin to select
      setSelectedAssignedRadiologistId(undefined);
    }
  }, [user, isRadiologistCreating]);

  // Effect to ensure the selected radiologist is valid if options change (for admin)
  useEffect(() => {
    if (!isRadiologistCreating && selectedAssignedRadiologistId && !radiologistOptions.some(r => r.id === selectedAssignedRadiologistId)) {
      setSelectedAssignedRadiologistId(undefined);
    }
  }, [radiologistOptions, selectedAssignedRadiologistId, isRadiologistCreating]);


  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) {
      toast({
        title: 'Error',
        description: 'Database or authentication not available.',
        variant: 'destructive'
      });
      return;
    }

    if (!newPatientData.name || !newPatientData.email) {
      toast({
        title: 'Missing Information',
        description: 'Name and Email are required.',
        variant: 'destructive'
      });
      return;
    }

    let finalAssignedRadiologistId: string | undefined;
    let finalAssignedRadiologistName: string | undefined;

    if (isRadiologistCreating) {
      // Automatically assign to the current radiologist
      finalAssignedRadiologistId = user.id;
      finalAssignedRadiologistName = user.name;
    } else {
      // Admin is creating, so use the selected value from the dropdown
      if (!selectedAssignedRadiologistId) {
        toast({
          title: 'Missing Information',
          description: 'Please assign a radiologist to the new patient.',
          variant: 'destructive'
        });
        return;
      }
      const assignedRadiologist = radiologistOptions.find(r => r.id === selectedAssignedRadiologistId);
      if (!assignedRadiologist) {
        throw new Error('Selected radiologist not found in options. Please re-select.');
      }
      finalAssignedRadiologistId = assignedRadiologist.id;
      finalAssignedRadiologistName = assignedRadiologist.name;
    }

    setIsCreatingPatient(true);
    try {
      const existingPatientQuery = query(collection(db, 'patients'), where('email', '==', newPatientData.email));
      const existingPatientSnapshot = await getDocs(existingPatientQuery);

      if (!existingPatientSnapshot.empty) {
        toast({
          title: 'Patient Already Exists',
          description: `A patient record with the email '${newPatientData.email}' already exists. Please edit the existing record or use a different email.`,
          variant: 'destructive'
        });
        setIsCreatingPatient(false);
        return;
      }

      const newId = `P-${uuidv4().split('-')[0].toUpperCase()}`;
      
      const patientDocRef = doc(db, 'patients', newId);
      const patientDocSnap = await getDoc(patientDocRef);
      
      if (patientDocSnap.exists()) {
        throw new Error('Generated Patient ID already exists. Please try again.');
      }

      await setDoc(patientDocRef, {
        userId: null,
        name: newPatientData.name,
        email: newPatientData.email,
        phone: newPatientData.phone || null,
        age: newPatientData.age ? parseInt(newPatientData.age) : null,
        gender: newPatientData.gender || null,
        createdAt: serverTimestamp(),
        status: 'unclaimed',
        assignedRadiologistId: finalAssignedRadiologistId,
        assignedRadiologistName: finalAssignedRadiologistName,
        assignedDoctorIds: [], // Initialize assignedDoctorIds as an empty array
      });

      setGeneratedPatientId(newId);
      toast({
        title: 'Patient Record Created',
        description: `Patient ID ${newId} created. Please provide this ID to the patient for registration.`,
      });

      // Send notification to the assigned radiologist
      if (finalAssignedRadiologistId && finalAssignedRadiologistName) {
        await addNotification(
          finalAssignedRadiologistId,
          'New Patient Record Created',
          `A new patient record for ${newPatientData.name} (ID: ${newId}) has been created and assigned to you.`,
          'info',
          { type: 'update_profile', payload: newId },
          user.id,
          user.name
        );
      }

      setNewPatientData({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
      });
      // Reset selected radiologist state for the next creation (if admin)
      setSelectedAssignedRadiologistId(isRadiologistCreating ? user.id : undefined); 
      onPatientCreated();
    } catch (error) {
      console.error('Error creating patient record:', error);
      toast({
        title: 'Error',
        description: 'Failed to create patient record. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingPatient(false);
    }
  };

  return (
    <Card className="glass-card lg:col-span-1">
      <CardHeader>
        <CardTitle>Create New Patient ID</CardTitle>
        <CardDescription>Assign a unique ID for a new patient.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-patient-name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-patient-name"
                placeholder="Patient's full name"
                value={newPatientData.name}
                onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                className="pl-10"
                required
                disabled={isCreatingPatient}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-patient-email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-patient-email"
                type="email"
                placeholder="patient@example.com"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                className="pl-10"
                required
                disabled={isCreatingPatient}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-patient-phone">Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-patient-phone"
                type="tel"
                placeholder="e.g., +1234567890"
                value={newPatientData.phone}
                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                className="pl-10"
                disabled={isCreatingPatient}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-patient-age">Age (Optional)</Label>
              <Input
                id="new-patient-age"
                type="number"
                placeholder="e.g., 35"
                value={newPatientData.age}
                onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                disabled={isCreatingPatient}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-patient-gender">Gender (Optional)</Label>
              <Input
                id="new-patient-gender"
                placeholder="e.g., Male, Female"
                value={newPatientData.gender}
                onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                disabled={isCreatingPatient}
              />
            </div>
          </div>

          {!isRadiologistCreating && ( // Conditionally render the Select for admin
            <div className="space-y-2">
              <Label htmlFor="assigned-radiologist">Assign Radiologist</Label>
              <Select
                value={selectedAssignedRadiologistId ?? "unassigned-option"} // Use "unassigned-option" if undefined for display
                onValueChange={(value) => setSelectedAssignedRadiologistId(value === "unassigned-option" ? undefined : value)}
                disabled={isCreatingPatient || (radiologistOptions?.length === 0)}
              >
                <SelectTrigger id="assigned-radiologist">
                  <SelectValue placeholder="Select a radiologist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned-option">Unassigned</SelectItem> {/* Use a distinct string value */}
                  {(radiologistOptions?.length === 0) ? (
                    <SelectItem value="no-radiologists" disabled>No radiologists found</SelectItem>
                  ) : (
                    radiologistOptions?.map((radiologist) => (
                      <SelectItem key={radiologist.id} value={radiologist.id}>
                        {radiologist.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {(radiologistOptions?.length === 0) && (
                <p className="text-xs text-destructive">No radiologists available. Please create a radiologist user first.</p>
              )}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isCreatingPatient || !newPatientData.name || !newPatientData.email || (!isRadiologistCreating && !selectedAssignedRadiologistId)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {isCreatingPatient ? 'Creating...' : 'Create Patient Record'}
          </Button>
        </form>
        {generatedPatientId && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-md border border-secondary text-sm">
            <p className="font-medium">New Patient ID Generated:</p>
            <p className="text-lg font-bold text-primary">{generatedPatientId}</p>
            <p className="text-muted-foreground">Please provide this ID to the patient for their registration.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatePatientForm;