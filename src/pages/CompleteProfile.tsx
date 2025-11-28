import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Fingerprint, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Added getDoc
import { v4 as uuidv4 } from 'uuid';

const CompleteProfile = () => {
  const { user, isLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || '');

  useEffect(() => {
    if (!isLoading && user && user.role !== 'pending_role_selection') {
      // If user is already assigned a role, redirect them to dashboard
      navigate('/dashboard', { replace: true });
    }
    if (user?.name) {
      setName(user.name);
    }
  }, [user, isLoading, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) {
      toast({
        title: 'Error',
        description: 'Authentication or database not available.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPatientId: string | undefined = undefined;

      if (selectedRole === 'patient') {
        if (!patientIdInput.trim()) {
          throw new Error('Patient ID is required for patient role.');
        }
        // Attempt to link to an existing unclaimed patient record
        const patientDocRef = doc(db, 'patients', patientIdInput.trim());
        const patientSnap = await getDoc(patientDocRef);

        if (!patientSnap.exists()) {
          throw new Error(`Patient ID '${patientIdInput.trim()}' not found. Please ensure you have the correct ID.`);
        }
        const patientData = patientSnap.data() as any;
        if (patientData.userId) {
          throw new Error(`Patient ID '${patientIdInput.trim()}' is already claimed by another user.`);
        }
        finalPatientId = patientIdInput.trim();
        // The patient document will be updated via updateUserProfile
      }

      // Update the user's profile with the selected role and patientId (if applicable)
      await updateUserProfile({
        name: name,
        role: selectedRole,
        patientId: finalPatientId,
      });

      toast({
        title: 'Profile Completed',
        description: 'Your profile has been successfully set up.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Could not complete profile setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (user && user.role !== 'pending_role_selection')) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="MedAlze Logo" className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome to MedAlze! Please tell us a bit more about yourself to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select
                value={selectedRole}
                onValueChange={(value: UserRole) => setSelectedRole(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="radiologist">Radiologist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === 'patient' && (
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientId"
                    placeholder="Enter your assigned Patient ID"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You must enter a Patient ID provided by an administrator or radiologist.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !name.trim() || (selectedRole === 'patient' && !patientIdInput.trim())}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving Profile...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;