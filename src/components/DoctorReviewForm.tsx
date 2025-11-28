import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, arrayUnion } from 'firebase/firestore'; // Import arrayUnion
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, Save } from 'lucide-react';
import { addNotification } from '@/utils/notificationUtils'; // Corrected import for addNotification
import { XRayRecord, PatientDocument } from '@/types/database';

interface DoctorReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  patientId: string; // This is the patient's document ID from 'patients' collection
  patientName: string;
  currentDiagnosis?: string;
  currentRecommendations?: string;
  onReviewComplete: () => void;
}

const DoctorReviewForm = ({
  isOpen,
  onClose,
  reportId,
  patientId,
  patientName,
  currentDiagnosis = '',
  currentRecommendations = '',
  onReviewComplete,
}: DoctorReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState(currentDiagnosis);
  const [recommendations, setRecommendations] = useState(currentRecommendations);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDiagnosis(currentDiagnosis);
    setRecommendations(currentRecommendations);
  }, [currentDiagnosis, currentRecommendations, isOpen]);

  const handleSubmitReview = async () => {
    if (!user || !db) {
      toast({
        title: 'Error',
        description: 'Authentication or database not available.',
        variant: 'destructive',
      });
      return;
    }

    if (!diagnosis.trim() || !recommendations.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both diagnosis and recommendations.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const xrayRef = doc(db, 'xrays', reportId);
      await updateDoc(xrayRef, {
        status: 'reviewed',
        doctorReview: {
          doctorId: user.id,
          doctorName: user.name, // Save doctor's name
          reviewedAt: new Date().toISOString(),
          diagnosis,
          recommendations,
        },
      });

      // Update the patient document with the doctor's ID
      const patientDocToUpdateRef = doc(db, 'patients', patientId);
      await updateDoc(patientDocToUpdateRef, {
        assignedDoctorIds: arrayUnion(user.id)
      });
      console.log(`DoctorReviewForm: Patient ${patientId} updated with assignedDoctorId ${user.id}.`);


      toast({
        title: 'Report Reviewed',
        description: 'The X-ray report has been successfully reviewed.',
      });

      // Fetch patient's userId (Firebase UID) to send notification
      let patientUserId: string | undefined;
      const patientDocRef = doc(db, 'patients', patientId);
      const patientDocSnap = await getDoc(patientDocRef);
      if (patientDocSnap.exists()) {
        const patientData = patientDocSnap.data() as PatientDocument;
        patientUserId = patientData.userId;
      } else {
        console.warn(`Patient document with ID ${patientId} not found.`);
      }

      // Send notification to the patient
      if (patientUserId) {
        await addNotification(
          patientUserId, // Use the patient's Firebase UID for notification
          'X-ray Report Reviewed',
          `Dr. ${user.name} has reviewed your X-ray report for patient ID ${patientId}.`,
          'info',
          { type: 'view_report', payload: reportId },
          user.id,
          user.name
        );
      }

      // Send notification to the doctor (self-notification)
      await addNotification(
        user.id,
        'Report Reviewed',
        `You have reviewed the X-ray report for patient ${patientName}.`,
        'info',
        { type: 'view_report', payload: reportId },
        user.id,
        user.name
      );

      onReviewComplete();
      onClose();
    } catch (error) {
      console.error('Error submitting doctor review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Doctor Review for {patientName}</DialogTitle>
          <DialogDescription>
            Add your diagnosis and recommendations for this X-ray report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              placeholder="Enter your diagnosis..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={5}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              placeholder="Enter your recommendations for the patient..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={5}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReview} disabled={isSubmitting || !diagnosis.trim() || !recommendations.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorReviewForm;