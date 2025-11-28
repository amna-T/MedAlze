import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, Mail, Briefcase, Image as ImageIcon, Save, Phone, Activity, HeartPulse, ShieldOff, 
  Award, Stethoscope, Hospital, PhoneCall, GraduationCap, Clock, FileText // Added FileText icon
} from 'lucide-react';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const Profile = () => {
  const { user, isLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || '');
  const [patientId, setPatientId] = useState(user?.patientId || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Radiologist-specific states
  const [license, setLicense] = useState(user?.license || '');
  const [certifications, setCertifications] = useState(user?.certifications || '');
  const [radiologistHospitalAffiliation, setRadiologistHospitalAffiliation] = useState(user?.hospitalAffiliation || '');
  const [radiologistContactPhone, setRadiologistContactPhone] = useState(user?.contactPhone || '');

  // Doctor-specific states
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [medicalSchool, setMedicalSchool] = useState(user?.medicalSchool || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience?.toString() || '');
  const [doctorHospitalAffiliation, setDoctorHospitalAffiliation] = useState(user?.hospitalAffiliation || '');
  const [doctorContactPhone, setDoctorContactPhone] = useState(user?.contactPhone || '');

  // Patient-specific states
  const [patientPhone, setPatientPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState(''); // Stored as comma-separated string for simplicity

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPatientId(user.patientId || '');
      setAvatarUrl(user.avatar || '');

      // Initialize role-specific fields
      if (user.role === 'radiologist') {
        setLicense(user.license || '');
        setCertifications(user.certifications || '');
        setRadiologistHospitalAffiliation(user.hospitalAffiliation || '');
        setRadiologistContactPhone(user.contactPhone || '');
      } else if (user.role === 'doctor') {
        setSpecialty(user.specialty || '');
        setMedicalSchool(user.medicalSchool || '');
        setYearsOfExperience(user.yearsOfExperience?.toString() || '');
        setDoctorHospitalAffiliation(user.hospitalAffiliation || '');
        setDoctorContactPhone(user.contactPhone || '');
      } else if (user.role === 'patient' && user.patientId && db) {
        const fetchPatientDetails = async () => {
          try {
            const patientDocRef = doc(db, 'patients', user.patientId!);
            const patientSnap = await getDoc(patientDocRef);
            if (patientSnap.exists()) {
              const patientData = patientSnap.data();
              setPatientPhone(patientData.phone || '');
              setAge(patientData.age?.toString() || '');
              setGender(patientData.gender || '');
              setMedicalHistory(patientData.medicalHistory || '');
              setAllergies(patientData.allergies?.join(', ') || '');
            }
          } catch (error) {
            console.error('Error fetching patient details:', error);
            toast({
              title: 'Error',
              description: 'Failed to load patient medical details.',
              variant: 'destructive',
            });
          }
        };
        fetchPatientDetails();
      }
    }
  }, [user, db, toast]);

  const getInitials = (nameString: string) => {
    return nameString
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file)); // Show local preview
    }
  };

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

    setIsSaving(true);
    let newAvatarUrl = avatarUrl;

    try {
      if (selectedAvatarFile) {
        const uploadResult = await uploadToCloudinary(selectedAvatarFile);
        newAvatarUrl = uploadResult.url;
      }

      const updates: Partial<typeof user> = {
        name,
        avatar: newAvatarUrl,
      };

      if (user.role === 'radiologist') {
        updates.license = license;
        updates.certifications = certifications;
        updates.hospitalAffiliation = radiologistHospitalAffiliation;
        updates.contactPhone = radiologistContactPhone;
      } else if (user.role === 'doctor') {
        updates.specialty = specialty;
        updates.medicalSchool = medicalSchool;
        updates.yearsOfExperience = yearsOfExperience ? parseInt(yearsOfExperience) : undefined;
        updates.hospitalAffiliation = doctorHospitalAffiliation;
        updates.contactPhone = doctorContactPhone;
      }

      // Update user document in 'users' collection
      await updateUserProfile(updates);

      // If user is a patient, update their 'patients' document as well
      if (user.role === 'patient' && user.patientId) {
        const patientDocRef = doc(db, 'patients', user.patientId);
        await updateDoc(patientDocRef, {
          phone: patientPhone || null,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          medicalHistory: medicalHistory || null,
          allergies: allergies.split(',').map(s => s.trim()).filter(Boolean), // Convert string to array
        });
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      navigate('/dashboard'); // Redirect to dashboard after saving
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Profile</h2>
        <p className="text-muted-foreground">Manage your account settings and public profile.</p>
      </div>

      <Card className="max-w-2xl mx-auto glass-card">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your name and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-2 flex-1">
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Max file size 5MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    className="pl-10 bg-muted/50 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={role.charAt(0).toUpperCase() + role.slice(1)}
                    className="pl-10 bg-muted/50 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            {patientId && (
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  className="bg-muted/50 cursor-not-allowed"
                  readOnly
                  disabled
                />
              </div>
            )}

            {/* Radiologist-specific fields */}
            {user?.role === 'radiologist' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="license">Medical License Number</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="license"
                      placeholder="e.g., R-123456"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="certifications"
                      placeholder="e.g., Board Certified in Radiology, Fellow of ACR"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      className="pl-10 min-h-[80px]"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radiologistHospitalAffiliation">Hospital Affiliation</Label>
                  <div className="relative">
                    <Hospital className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="radiologistHospitalAffiliation"
                      placeholder="e.g., City General Hospital"
                      value={radiologistHospitalAffiliation}
                      onChange={(e) => setRadiologistHospitalAffiliation(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radiologistContactPhone">Professional Contact Phone</Label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="radiologistContactPhone"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={radiologistContactPhone}
                      onChange={(e) => setRadiologistContactPhone(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Doctor-specific fields */}
            {user?.role === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="specialty"
                      placeholder="e.g., Cardiology, Pulmonology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalSchool">Medical School</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="medicalSchool"
                      placeholder="e.g., Harvard Medical School"
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      placeholder="e.g., 10"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorHospitalAffiliation">Hospital Affiliation</Label>
                  <div className="relative">
                    <Hospital className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="doctorHospitalAffiliation"
                      placeholder="e.g., St. Jude's Hospital"
                      value={doctorHospitalAffiliation}
                      onChange={(e) => setDoctorHospitalAffiliation(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorContactPhone">Professional Contact Phone</Label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="doctorContactPhone"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={doctorContactPhone}
                      onChange={(e) => setDoctorContactPhone(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Patient-specific fields */}
            {user?.role === 'patient' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="patientPhone"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="age"
                        type="number"
                        placeholder="e.g., 30"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="pl-10"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="gender"
                        placeholder="e.g., Male, Female, Other"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="pl-10"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <div className="relative">
                    <HeartPulse className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="medicalHistory"
                      placeholder="Briefly describe your medical history..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="pl-10 min-h-[100px]"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <div className="relative">
                    <ShieldOff className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="allergies"
                      placeholder="e.g., Penicillin, Dust, Peanuts"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="pl-10 min-h-[80px]"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;