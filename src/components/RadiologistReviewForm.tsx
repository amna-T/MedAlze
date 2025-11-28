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
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, Save } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { XRayRecord, PatientDocument, UserDocument } from '@/types/database';
import { generateReport, GeneratedReport } from '@/utils/reportGeneration'; // Import generateReport
import { AnalysisResult, Condition } from '@/utils/xrayAnalysis'; // Import AnalysisResult and Condition
import { CONDITIONS_METADATA } from '@/utils/conditionsMetadata'; // Import CONDITIONS_METADATA

interface RadiologistReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  patientId: string;
  patientName: string;
  currentRadiologistNotes?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  aiAnalysisResults: AnalysisResult | undefined; // Pass AI analysis results
  onReviewComplete: () => void;
}

const OTHER_PREDICTIONS_DISPLAY_THRESHOLD = 0.1; // Re-use threshold from UploadXray

const RadiologistReviewForm = ({
  isOpen,
  onClose,
  reportId,
  patientId,
  patientName,
  currentRadiologistNotes = '',
  assignedDoctorId,
  assignedDoctorName,
  aiAnalysisResults, // Destructure AI analysis results
  onReviewComplete,
}: RadiologistReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [radiologistNotes, setRadiologistNotes] = useState(currentRadiologistNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRadiologistNotes(currentRadiologistNotes);
  }, [currentRadiologistNotes, isOpen]);

  const handleSubmitReview = async () => {
    if (!user || !db || !aiAnalysisResults) {
      toast({
        title: 'Error',
        description: 'Authentication, database, or AI analysis results not available.',
        variant: 'destructive',
      });
      return;
    }

    if (!radiologistNotes.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please add your review notes.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const xrayRef = doc(db, 'xrays', reportId);

      // 1. Update X-ray record with radiologist notes and new status
      await updateDoc(xrayRef, {
        status: 'ai_analysis_complete', // Mark as complete after manual review
        radiologistNotes: radiologistNotes,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Manual Review Complete',
        description: 'The X-ray has been manually reviewed. Now generating the full medical report...',
      });

      // 2. Fetch patient details for report generation and patient's userId for notification
      let patientDetailsForReport: { id: string; age?: number; gender?: string; medicalHistory?: string; } | null = null;
      let patientUserId: string | undefined; // To store the patient's Firebase UID
      
      const patientDocRef = doc(db, 'patients', patientId);
      const patientDocSnap = await getDoc(patientDocRef);
      if (patientDocSnap.exists()) {
        const patientData = patientDocSnap.data() as PatientDocument;
        patientDetailsForReport = {
          id: patientDocSnap.id,
          age: patientData.age,
          gender: patientData.gender,
          medicalHistory: patientData.medicalHistory,
        };
        patientUserId = patientData.userId || undefined; // Get userId from patient document
      } else {
        console.warn(`Patient document with ID ${patientId} not found for report generation.`);
        toast({
          title: 'Warning',
          description: 'Patient details not found for report generation. Report might be less detailed.',
          variant: 'warning',
        });
      }

      // 3. Generate the full medical report using Gemini AI
      let generatedReport: GeneratedReport | null = null;
      if (patientDetailsForReport) {
        const relevantPredictions = aiAnalysisResults.allPredictions.filter(
          p => p.probability >= OTHER_PREDICTIONS_DISPLAY_THRESHOLD && p.condition !== aiAnalysisResults.condition
        );

        generatedReport = await generateReport(
          {
            condition: aiAnalysisResults.condition,
            confidence: aiAnalysisResults.confidence,
            additionalContext: relevantPredictions.length > 0 
              ? `Additional detected conditions:\n${
                  relevantPredictions
                    .map(p => `- ${CONDITIONS_METADATA[p.condition as Condition]?.label || p.condition}: ${(p.probability * 100).toFixed(1)}%`)
                    .join('\n')
                }`
              : undefined,
            noSignificantFinding: aiAnalysisResults.noSignificantFinding,
          }, 
          patientDetailsForReport
        );
      } else {
        // Fallback if patient details couldn't be fetched
        generatedReport = await generateReport(
          {
            condition: aiAnalysisResults.condition,
            confidence: aiAnalysisResults.confidence,
            noSignificantFinding: aiAnalysisResults.noSignificantFinding,
          },
          { id: patientId } // Minimal patient info
        );
      }

      // 4. Update X-ray record with the generated report and final status
      await updateDoc(xrayRef, {
        report: generatedReport,
        status: 'analyzed', // Final status after report generation
      });

      toast({
        title: 'Report Generated!',
        description: 'The full medical report has been successfully generated and saved.',
      });

      // 5. Send notifications
      // Send notification to the radiologist (self-notification)
      await addNotification(
        user.id,
        'X-ray Report Generated',
        `You have manually reviewed and generated the report for patient ${patientName} (ID: ${patientId}).`,
        'info',
        { type: 'view_report', payload: reportId },
        user.id,
        user.name
      );

      // Send notification to the assigned doctor if available
      if (assignedDoctorId && assignedDoctorName) {
        await addNotification(
          assignedDoctorId,
          'New X-ray Report for Review',
          `A new X-ray report for patient ${patientName} (ID: ${patientId}) has been generated and is awaiting your review.`,
          'info',
          { type: 'view_report', payload: reportId },
          user.id,
          user.name
        );
      }

      // Send notification to the patient if their userId is available
      if (patientUserId) {
        await addNotification(
          patientUserId, // Patient's Firebase UID
          'New X-ray Report Available',
          `Your X-ray report for patient ID ${patientId} is ready.`,
          'success',
          { type: 'view_report', payload: reportId },
          user.id,
          user.name
        );
      }


      onReviewComplete();
      onClose();
    } catch (error) {
      console.error('Error submitting radiologist review or generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete review or generate report. Please try again.',
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
          <DialogTitle>Radiologist Manual Review for {patientName}</DialogTitle>
          <DialogDescription>
            Add your expert notes and confirm the manual review for this X-ray.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="radiologist-notes">Radiologist Notes</Label>
            <Textarea
              id="radiologist-notes"
              placeholder="Enter your manual review notes, observations, and conclusions..."
              value={radiologistNotes}
              onChange={(e) => setRadiologistNotes(e.target.value)}
              rows={8}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReview} disabled={isSubmitting || !radiologistNotes.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Confirm Manual Review & Generate Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RadiologistReviewForm;