import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, User, Phone, Mail, Calendar, FileText, Stethoscope } from 'lucide-react';
import { db, auth } from '@/lib/firebase'; // Import auth
import { collection, query, getDocs, orderBy, Timestamp, where, documentId } from 'firebase/firestore'; // Import documentId
import { PatientDocument, XRayRecord } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Extend PatientDocument to include derived fields for display
interface DisplayPatient extends PatientDocument {
  id: string; // Firestore document ID
  lastVisit: string; // Derived from latest X-ray or appointment
  totalReports: number;
  recentFindings: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<DisplayPatient | null>(null);
  const [allPatients, setAllPatients] = useState<DisplayPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      console.log("Patients: Starting fetchPatients...");
      console.log("Patients: Current user object from useAuth:", user);
      console.log("Patients: Auth loading status from useAuth:", authLoading);
      console.log("Patients: Firestore DB available:", !!db);
      console.log("Patients: Firebase Auth object available:", !!auth);
      if (auth) {
        console.log("Patients: auth.currentUser:", auth.currentUser);
        console.log("Patients: auth.currentUser.uid:", auth.currentUser?.uid);
        console.log("Patients: auth.currentUser.emailVerified:", auth.currentUser?.emailVerified);
      }


      if (authLoading) {
        console.log("Patients: Auth is still loading, deferring fetch.");
        return;
      }

      if (!db) {
        console.warn("Patients: Firestore not available. Cannot fetch patients.");
        setLoading(false);
        return;
      }
      if (!user) {
        console.warn("Patients: User not authenticated (useAuth returned null). Cannot fetch patients.");
        setLoading(false);
        return;
      }
      // Double-check Firebase's internal auth state
      if (!auth?.currentUser || auth.currentUser.uid !== user.id) {
        console.warn("Patients: Discrepancy between useAuth user and Firebase auth.currentUser. Re-authenticating or refreshing might be needed.");
        setLoading(false);
        return;
      }
      console.log("Patients: Firestore DB is available and user is authenticated.");

      setLoading(true);
      try {
        let patientDocsToProcess: PatientDocument[] = [];
        let allXrays: XRayRecord[] = [];

        // 1. Determine which patients to fetch based on user role
        let patientsQuery;
        if (user.role === 'doctor' && user.id) {
          // Doctors can only see patients they are assigned to
          patientsQuery = query(collection(db, "patients"), where('assignedDoctorIds', 'array-contains', user.id));
          console.log(`Patients: Doctor user. Filtering patients for assignedDoctorIds containing: ${user.id}`);
        } else if (user.role === 'radiologist' && user.id) {
          // Radiologists can only see patients they are assigned to
          patientsQuery = query(collection(db, "patients"), where('assignedRadiologistId', '==', user.id));
          console.log(`Patients: Radiologist user. Filtering patients for assignedRadiologistId: ${user.id}`);
        } else if (user.role === 'admin') {
          // Admins can see all patients
          patientsQuery = query(collection(db, "patients"));
          console.log(`Patients: Admin user. Fetching all patients.`);
        } else {
          // Other roles (e.g., patient) should not access this page or will see no patients
          setAllPatients([]);
          setLoading(false);
          return;
        }

        const patientsSnapshot = await getDocs(patientsQuery);
        patientDocsToProcess = patientsSnapshot.docs.map(doc => ({ ...doc.data() as PatientDocument, id: doc.id }));
        console.log(`Patients: Fetched ${patientDocsToProcess.length} patient documents for current user's role.`);

        const patientIdsToFetchXraysFor = patientDocsToProcess.map(p => p.id);

        // 2. Fetch X-ray records for these patients
        if (patientIdsToFetchXraysFor.length > 0) {
          const xrayIdBatches: string[][] = [];
          // Firestore 'in' query has a limit of 10, so we batch the patient IDs
          for (let i = 0; i < patientIdsToFetchXraysFor.length; i += 10) {
            xrayIdBatches.push(patientIdsToFetchXraysFor.slice(i, i + 10));
          }

          for (const batch of xrayIdBatches) {
            const batchXraysQuery = query(collection(db, "xrays"), where('patientId', 'in', batch), orderBy("uploadedAt", "desc"));
            const batchXraysSnapshot = await getDocs(batchXraysQuery);
            allXrays.push(...batchXraysSnapshot.docs.map(doc => ({ ...doc.data() as XRayRecord, id: doc.id })));
          }
        }
        console.log(`Patients: Total X-ray records fetched for relevant patients: ${allXrays.length}.`);


        const fetchedPatients: DisplayPatient[] = [];
        for (const patientData of patientDocsToProcess) {
          const patientId = patientData.id;

          const patientXrays = allXrays.filter(xray => xray.patientId === patientId);
          const totalReports = patientXrays.length;

          let lastVisit = 'N/A';
          let recentFindings = 'No recent findings';

          if (patientXrays.length > 0) {
            const latestXray = patientXrays[0]; // Already sorted by uploadedAt desc
            lastVisit = latestXray.uploadedAt?.toDate().toLocaleDateString() || 'N/A';
            recentFindings = latestXray.aiAnalysis?.condition 
              ? `AI detected: ${latestXray.aiAnalysis.condition.replace(/_/g, ' ')}` 
              : 'Analysis pending';
          }

          fetchedPatients.push({
            ...patientData,
            id: patientId,
            age: patientData.age,
            gender: patientData.gender,
            phone: patientData.phone || 'N/A',
            lastVisit, 
            totalReports, 
            recentFindings, 
          });
        }
        setAllPatients(fetchedPatients);
        console.log(`Patients: Final processed patient records count: ${fetchedPatients.length}.`);
        if (fetchedPatients.length > 0) console.log("Patients: First final patient record:", fetchedPatients[0]);

      } catch (error) {
        console.error("Patients: Error fetching patients:", error);
        toast({
          title: 'Error',
          description: 'Failed to load patient data. Please check console for details.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        console.log("Patients: Finished fetchPatients.");
      }
    };

    fetchPatients();
  }, [db, user, authLoading, toast, auth]); // Added auth to dependency array

  const filteredPatients = allPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.assignedRadiologistName && patient.assignedRadiologistName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: PatientDocument["status"]) => {
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
        return 'bg-gray-500/20 text-gray-600';
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

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <p className="text-muted-foreground">Manage and monitor patient records</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Search Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email or assigned radiologist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="glass-card hover:bg-accent/5 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.age ? `${patient.age} years` : 'N/A'} • {patient.gender || 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(patient.status)}>
                  {patient.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last visit: {patient.lastVisit}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{patient.totalReports} reports</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  <span>Radiologist: {patient.assignedRadiologistName || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                <p className="text-sm">{patient.recentFindings}</p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No patients found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Patients;