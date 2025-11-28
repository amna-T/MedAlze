import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Import useSearchParams
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
import { Card, CardContent } from '@/components/ui/card';
// Removed Layout and Navigation imports
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import { Prescription as PrescriptionType, UserDocument, PatientDocument } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Calendar, User, Pill } from 'lucide-react';

interface DisplayPrescription extends PrescriptionType {
  date: string;
}

const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<DisplayPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<DisplayPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize useSearchParams

  useEffect(() => {
    const fetchPrescriptions = async () => {
      console.log("--- fetchPrescriptions started ---");
      console.log("Current user:", user);
      console.log("Firestore DB available:", !!db);
      console.log("Prescriptions: User ID for query:", user?.id); // NEW LOG HERE
      console.log("Prescriptions: User role for query:", user?.role); // NEW LOG HERE

      if (!db) {
        console.warn("Firestore not available. Cannot fetch prescriptions.");
        setLoading(false);
        console.log("--- fetchPrescriptions finished (DB not available) ---");
        return;
      }

      setLoading(true);
      try {
        let q = query(collection(db, "prescriptions"), orderBy("createdAt", "desc"));
        console.log("Initial query constructed.");

        if (user?.role === 'patient') {
          const patientIdForQuery = user.patientId;
          if (!patientIdForQuery) {
            console.warn("Patient ID not found for current user. Cannot fetch prescriptions.");
            setLoading(false);
            console.log("--- fetchPrescriptions finished (Patient ID missing) ---");
            return;
          }
          q = query(q, where("patientId", "==", patientIdForQuery));
          console.log(`Query filtered for patientId: ${patientIdForQuery}`);
        } else if (user?.role === 'doctor') {
          q = query(q, where("doctorId", "==", user.id));
          console.log(`Query filtered for doctorId: ${user.id}`);
        }
        // Radiologists and Admins will see all prescriptions with the initial query

        const querySnapshot = await getDocs(q);
        console.log(`Fetched ${querySnapshot.size} prescription documents.`);
        const fetchedPrescriptions: DisplayPrescription[] = [];

        const userNamesMap = new Map<string, string>();
        const patientNamesMap = new Map<string, string>();
        const userIdsToFetch: Set<string> = new Set();
        const patientIdsToFetch: Set<string> = new Set();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as PrescriptionType;
          userIdsToFetch.add(data.doctorId);
          patientIdsToFetch.add(data.patientId);
        });
        console.log("User IDs to fetch:", Array.from(userIdsToFetch));
        console.log("Patient IDs to fetch:", Array.from(patientIdsToFetch));

        if (userIdsToFetch.size > 0) {
          const usersQuery = query(collection(db, "users"), where('__name__', 'in', Array.from(userIdsToFetch)));
          const usersSnapshot = await getDocs(usersQuery);
          usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data() as UserDocument;
            userNamesMap.set(userDoc.id, userData.name);
          });
          console.log("Doctor names map:", Object.fromEntries(userNamesMap));
        }

        if (patientIdsToFetch.size > 0) {
          const patientsCollectionRef = collection(db, 'patients');
          const patientsQuery = query(patientsCollectionRef, where('__name__', 'in', Array.from(patientIdsToFetch)));
          const patientsSnapshot = await getDocs(patientsQuery);
          patientsSnapshot.forEach(patientDoc => {
            const patientData = patientDoc.data();
            patientNamesMap.set(patientDoc.id, patientData.name);
          });
          console.log("Patient names map:", Object.fromEntries(patientNamesMap));
        }


        querySnapshot.forEach((doc) => {
          const data = doc.data() as PrescriptionType;
          const prescriptionDate = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
          const prescription = {
            ...data,
            id: doc.id,
            date: prescriptionDate,
            patientName: patientNamesMap.get(data.patientId) || data.patientName || 'Unknown Patient',
            doctorName: userNamesMap.get(data.doctorId) || data.doctorName || 'Unknown Doctor',
          };
          fetchedPrescriptions.push(prescription);
          console.log("Processed prescription:", prescription);
        });
        setPrescriptions(fetchedPrescriptions);
        console.log("Final fetched prescriptions:", fetchedPrescriptions);

      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        setLoading(false);
        console.log("--- fetchPrescriptions finished ---");
      }
    };

    fetchPrescriptions();
  }, [db, user]);

  // Effect to open dialog if prescriptionId is in URL
  useEffect(() => {
    if (!loading && prescriptions.length > 0) {
      const prescriptionIdFromUrl = searchParams.get('prescriptionId');
      if (prescriptionIdFromUrl) {
        const prescriptionToOpen = prescriptions.find(p => p.id === prescriptionIdFromUrl);
        if (prescriptionToOpen) {
          setSelectedPrescription(prescriptionToOpen);
          // Clear the prescriptionId from the URL after opening the dialog
          setSearchParams({}, { replace: true });
        }
      }
    }
  }, [loading, prescriptions, searchParams, setSearchParams]);

  const handleViewPrescription = (prescription: DisplayPrescription) => {
    setSelectedPrescription(prescription);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {prescriptions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No prescriptions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Doctor Name</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>{prescription.date}</TableCell>
                    <TableCell className="font-medium">{prescription.patientName}</TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>{prescription.diagnosis || 'N/A'}</TableCell>
                    <TableCell>{prescription.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPrescription(prescription)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedPrescription !== null} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Prescription for {selectedPrescription?.patientName} from {selectedPrescription?.doctorName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedPrescription.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diagnosis</p>
                  <p className="font-medium">{selectedPrescription.diagnosis || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" /> Prescribed Medicines
                </h3>
                {selectedPrescription.medicines.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No medicines prescribed.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-secondary/50"
                      >
                        <p className="font-medium">{index + 1}. {medicine.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPrescription.instructions && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Additional Instructions
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedPrescription.instructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;