import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, getDoc, arrayUnion } from 'firebase/firestore'; // Import arrayUnion
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Send, FileText } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { PatientDocument } from '@/types/database';
import { addNotification } from '@/utils/notificationUtils'; // Corrected import for addNotification

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionData {
  reportId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medicines: Medicine[];
  instructions: string;
  diagnosis: string;
  createdAt: Date;
  status: 'draft' | 'sent';
}

interface PrescriptionProps {
  reportId: string;
  patientId: string; // This is the patient's document ID from 'patients' collection
  patientName: string;
  diagnosis?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Prescription = ({ reportId, patientId, patientName, diagnosis, isOpen, onClose }: PrescriptionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed useNotifications hook as addNotification is now a utility
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [currentMedicine, setCurrentMedicine] = useState<Medicine>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
  });
  const [instructions, setInstructions] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMedicines([]);
      setCurrentMedicine({ name: '', dosage: '', frequency: '', duration: '' });
      setInstructions('');
      setShowPreview(false);
    }
  }, [isOpen]);

  const handleAddMedicine = () => {
    if (currentMedicine.name && currentMedicine.dosage) {
      setMedicines([...medicines, currentMedicine]);
      setCurrentMedicine({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
      });
    }
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSendPrescription = async () => {
    console.log("Attempting to send prescription...");
    console.log("User:", user);
    console.log("Medicines count:", medicines.length);
    console.log("Firestore DB available:", !!db);

    if (!user || !medicines.length || !db) {
      toast({
        title: 'Error',
        description: 'Cannot send prescription. Ensure you are logged in and have added medicines.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch patient's userId (Firebase UID) to send notification
      let patientUserId: string | undefined;
      const patientDocRef = doc(db, 'patients', patientId);
      const patientDocSnap = await getDoc(patientDocRef);
      if (patientDocSnap.exists()) {
        const patientData = patientDocSnap.data() as PatientDocument;
        patientUserId = patientData.userId;
        console.log("Patient userId for notification:", patientUserId);
      } else {
        console.warn(`Patient document with ID ${patientId} not found. Cannot send patient notification.`);
      }

      const prescriptionData: Omit<PrescriptionData, 'createdAt'> = {
        reportId,
        patientId,
        patientName,
        doctorId: user.id,
        doctorName: user.name,
        medicines,
        instructions,
        diagnosis: diagnosis || '',
        status: 'sent',
      };

      const prescriptionsRef = collection(db, 'prescriptions');
      const newPrescriptionDoc = await addDoc(prescriptionsRef, {
        ...prescriptionData,
        createdAt: serverTimestamp(),
      });
      console.log("Prescription added to Firestore with ID:", newPrescriptionDoc.id);

      // Update the XRayRecord with the new prescriptionId
      const xrayRef = doc(db, 'xrays', reportId);
      await updateDoc(xrayRef, {
        prescriptionId: newPrescriptionDoc.id,
        // Optionally update doctorReview status or add a note
        'doctorReview.prescriptionId': newPrescriptionDoc.id,
        'doctorReview.reviewedAt': new Date().toISOString(),
        'status': 'reviewed', // Mark X-ray as reviewed after prescription
      });
      console.log("X-ray record updated with prescription ID and status 'reviewed'.");

      // Update the patient document with the doctor's ID
      const patientDocToUpdateRef = doc(db, 'patients', patientId);
      await updateDoc(patientDocToUpdateRef, {
        assignedDoctorIds: arrayUnion(user.id)
      });
      console.log(`Prescription: Patient ${patientId} updated with assignedDoctorId ${user.id}.`);


      toast({
        title: 'Prescription Sent',
        description: 'The prescription has been sent to the patient and linked to the report.',
      });

      // Send notification to the patient
      if (patientUserId) {
        await addNotification(
          patientUserId, // Use the patient's Firebase UID for notification
          'New Prescription Available',
          `Dr. ${user.name} has sent you a new prescription for patient ID ${patientId}.`,
          'success',
          { type: 'view_prescription', payload: newPrescriptionDoc.id },
          user.id,
          user.name
        );
        console.log("Notification sent to patient.");
      }

      // Send notification to the doctor (self-notification)
      await addNotification(
        user.id,
        'Prescription Sent',
        `You have sent a prescription to patient ${patientName}.`,
        'info',
        { type: 'view_prescription', payload: newPrescriptionDoc.id },
        user.id,
        user.name
      );
      console.log("Notification sent to doctor (self).");

      onClose();
    } catch (error) {
      console.error('Error sending prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to send prescription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every morning',
    'Every night',
    'As needed',
  ];

  const durationOptions = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    '2 months',
    'Continuous',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Write Prescription</DialogTitle>
          <DialogDescription>
            Create a prescription for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showPreview ? (
            // Prescription Form
            <>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Medicine Name</Label>
                    <Input
                      value={currentMedicine.name}
                      onChange={(e) => setCurrentMedicine({
                        ...currentMedicine,
                        name: e.target.value,
                      })}
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      value={currentMedicine.dosage}
                      onChange={(e) => setCurrentMedicine({
                        ...currentMedicine,
                        dosage: e.target.value,
                      })}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={currentMedicine.frequency}
                      onValueChange={(value) => setCurrentMedicine({
                        ...currentMedicine,
                        frequency: value,
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={currentMedicine.duration}
                      onValueChange={(value) => setCurrentMedicine({
                        ...currentMedicine,
                        duration: value,
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMedicine}
                  disabled={!currentMedicine.name || !currentMedicine.dosage}
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  Add Medicine
                </Button>
              </div>

              {medicines.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Medicines</Label>
                  <div className="space-y-2">
                    {medicines.map((medicine, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicine(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter any additional instructions or notes..."
                  rows={4}
                />
              </div>
            </>
          ) : (
            // Prescription Preview
            <div className="space-y-6 p-6 border rounded-lg">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Prescription Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Patient Name</p>
                    <p className="font-medium">{patientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                </div>
              </div>

              {diagnosis && (
                <div className="space-y-1">
                  <p className="font-medium">Diagnosis</p>
                  <p className="text-sm">{diagnosis}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium">Prescribed Medicines</p>
                <div className="space-y-2">
                  {medicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                          <p className="font-medium">{index + 1}. {medicine.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              {instructions && (
                <div className="space-y-1">
                  <p className="font-medium">Additional Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{instructions}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSendPrescription}
              disabled={!user || !medicines.length}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Prescription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};