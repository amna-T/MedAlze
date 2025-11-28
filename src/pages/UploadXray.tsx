import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { analyzeXRay, AnalysisResult, Condition, CONDITIONS } from "@/utils/xrayAnalysis";
import { generateReport, GeneratedReport } from "@/utils/reportGeneration";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // Corrected import path for AuthContext
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, getDocs, where, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore"; // Import arrayUnion
import { XRayRecord, PatientDocument, UserDocument, Appointment } from "@/types/database";
import { addNotification } from "@/utils/notificationUtils"; // Corrected import path for addNotification
import { CONDITIONS_METADATA } from "@/utils/conditionsMetadata";
import { FileText, Image as ImageIcon, Brain, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type UploadStep = 'initial' | 'uploading' | 'analyzing' | 'analysis_complete' | 'generating_report' | 'report_generated' | 'review_required';

interface PatientOption {
  id: string; // This is the patientId (document ID in 'patients' collection)
  name: string;
  userId: string; // The Firebase UID of the patient
  age?: number;
  gender?: string;
  medicalHistory?: string;
}

interface DoctorOption {
  id: string; // This is the doctor's Firebase UID
  name: string;
}

const PRIMARY_CONDITION_DISPLAY_THRESHOLD = 0.4;
const OTHER_PREDICTIONS_DISPLAY_THRESHOLD = 0.1;

export default function UploadXray() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  // Removed useNotifications hook as addNotification is now a utility

  const [file, setFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);

  const [currentStep, setCurrentStep] = useState<UploadStep>('initial');
  const [aiAnalysisResults, setAiAnalysisResults] = useState<AnalysisResult | null>(null);
  const [generatedReportData, setGeneratedReportData] = useState<GeneratedReport | null>(null);
  const [xrayRecordId, setXrayRecordId] = useState<string | null>(null);
  const [patientDetailsForReport, setPatientDetailsForReport] = useState<Omit<PatientOption, 'userId'> | null>(null);
  const [appointmentIdFromUrl, setAppointmentIdFromUrl] = useState<string | null>(null);

  const isLoading = useMemo(() => currentStep === 'uploading' || currentStep === 'analyzing' || currentStep === 'generating_report', [currentStep]);

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      if (!db) {
        console.warn("UploadXray: Firestore not available. Cannot fetch patient/doctor lists.");
        return;
      }
      try {
        const patientsCollectionRef = collection(db, 'patients');
        const patientsSnapshot = await getDocs(query(patientsCollectionRef));
        const fetchedPatients: PatientOption[] = patientsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: (doc.data() as PatientDocument).name,
          userId: (doc.data() as PatientDocument).userId || '',
          age: (doc.data() as PatientDocument).age,
          gender: (doc.data() as PatientDocument).gender,
          medicalHistory: (doc.data() as PatientDocument).medicalHistory,
        }));
        setPatientOptions(fetchedPatients);

        const usersCollectionRef = collection(db, 'users');
        const doctorsSnapshot = await getDocs(query(usersCollectionRef, where('role', '==', 'doctor')));
        const fetchedDoctors: DoctorOption[] = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: (doc.data() as UserDocument).name,
        }));
        setDoctorOptions(fetchedDoctors);

      } catch (error) {
        console.error("UploadXray: Error fetching dropdown options:", error);
        toast({
          title: "Error",
          description: "Failed to load patient and doctor lists. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchDropdownOptions();
  }, [db, toast]);

  useEffect(() => {
    const idFromUrl = searchParams.get('appointmentId');
    setAppointmentIdFromUrl(idFromUrl);

    const loadAppointmentDetails = async (appId: string) => {
      if (!db) return;
      try {
        const appDocRef = doc(db, 'appointments', appId);
        const appSnap = await getDoc(appDocRef);
        if (appSnap.exists()) {
          const appData = appSnap.data() as Appointment;
          setSelectedPatientId(appData.patientId);
          setSelectedDoctorId(appData.assignedDoctorId || '');
          toast({
            title: "Appointment Pre-selected",
            description: `Uploading X-ray for patient ${appData.patientName} from appointment ${appId.substring(0, 8)}.`,
          });
        } else {
          toast({
            title: "Appointment Not Found",
            description: "The specified appointment ID from the URL does not exist.",
            variant: "destructive",
          });
          setAppointmentIdFromUrl(null);
        }
      } catch (error) {
        console.error("Error loading appointment details:", error);
        toast({
          title: "Error",
          description: "Failed to load appointment details.",
          variant: "destructive",
        });
        setAppointmentIdFromUrl(null);
      }
    };

    if (idFromUrl) {
      loadAppointmentDetails(idFromUrl);
    } else {
      setSelectedPatientId('');
      setSelectedDoctorId('');
    }
  }, [searchParams, db, toast]);

  useEffect(() => {
    console.log("UploadXray: currentStep changed to", currentStep);
    console.log("UploadXray: aiAnalysisResults", aiAnalysisResults);
    if (aiAnalysisResults) {
      const filtered = aiAnalysisResults.allPredictions.filter(
        p => p.probability >= OTHER_PREDICTIONS_DISPLAY_THRESHOLD
      );
      console.log("UploadXray: filteredPredictions (should render if > 0)", filtered);
    }
  }, [currentStep, aiAnalysisResults]);

  const generateAndSaveReport = useCallback(async (
    analysisResults: AnalysisResult,
    currentXrayRecordId: string,
    patientDetails: Omit<PatientOption, 'userId'>,
    selectedPatientFirebaseId: string,
    selectedDoctorFirebaseId: string
  ) => {
    if (!user || !db) {
      toast({
        title: "Error",
        description: "Authentication or database not available. Cannot generate report.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('generating_report');
    try {
      const relevantPredictions = analysisResults.allPredictions.filter(
        p => p.probability >= OTHER_PREDICTIONS_DISPLAY_THRESHOLD && p.condition !== analysisResults.condition
      );

      const generatedReport = await generateReport(
        {
          condition: analysisResults.condition,
          confidence: analysisResults.confidence,
          additionalContext: relevantPredictions.length > 0 
            ? `Additional detected conditions:\n${
                relevantPredictions
                  .map(p => `- ${CONDITIONS_METADATA[p.condition as Condition]?.label || p.condition}: ${(p.probability * 100).toFixed(1)}%`)
                  .join('\n')
              }`
            : undefined,
          noSignificantFinding: analysisResults.noSignificantFinding,
        }, 
        { 
          id: patientDetails.id,
          age: patientDetails.age,
          gender: patientDetails.gender,
          clinicalHistory: patientDetails.medicalHistory,
        }
      );
      setGeneratedReportData(generatedReport);

      await updateDoc(doc(db, 'xrays', currentXrayRecordId), {
        report: generatedReport,
        status: 'analyzed',
      });

      toast({
        title: "Report Generated!",
        description: "Medical report created and saved.",
      });
      setCurrentStep('report_generated');

      const selectedPatient = patientOptions.find(p => p.id === selectedPatientFirebaseId);
      const assignedDoctor = doctorOptions.find(d => d.id === selectedDoctorFirebaseId);

      if (selectedPatient?.userId) {
        await addNotification(
          selectedPatient.userId,
          'New X-ray Report Available',
          `Your X-ray report for patient ID ${selectedPatient.id} is ready.`,
          'success',
          { type: 'view_report', payload: currentXrayRecordId },
          user.id,
          user.name
        );
      }

      if (assignedDoctor?.id) {
        await addNotification(
          assignedDoctor.id,
          'New X-ray Report for Review',
          `A new X-ray report for patient ${selectedPatient?.name} (ID: ${selectedPatient?.id}) has been uploaded and is awaiting your review.`,
          'info',
          { type: 'view_report', payload: currentXrayRecordId },
          user.id,
          user.name
        );
      }

      await addNotification(
        user.id,
        'X-ray Report Generated',
        `You have generated the report for patient ID ${selectedPatient?.id}.`,
        'info',
        { type: 'view_report', payload: currentXrayRecordId },
        user.id,
        user.name
      );

    } catch (error: any) {
      console.error("UploadXray: Error generating report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
      setCurrentStep('analysis_complete'); // Revert to analysis_complete if generation fails
    }
  }, [user, db, toast, addNotification, patientOptions, doctorOptions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedImageUrl(URL.createObjectURL(selectedFile));
      setAiAnalysisResults(null);
      setGeneratedReportData(null);
      setCurrentStep('initial');
      setXrayRecordId(null);
    }
  };

  const handleUploadAndAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !selectedPatientId || !selectedDoctorId) {
      toast({
        title: "Missing Information",
        description: "Please select an X-ray image, choose a patient, and assign a doctor.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to upload X-rays.",
        variant: "destructive",
      });
      return;
    }
    if (!db) {
      toast({
        title: "Database Not Available",
        description: "Firestore is not configured. Cannot save report.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCurrentStep('uploading');
      
      const selectedPatient = patientOptions.find(p => p.id === selectedPatientId);
      const assignedDoctor = doctorOptions.find(d => d.id === selectedDoctorId);

      if (!selectedPatient) {
        toast({
          title: "Invalid Patient",
          description: "Selected patient not found in the system.",
          variant: "destructive",
        });
        setCurrentStep('initial');
        return;
      }
      if (!assignedDoctor) {
        toast({
          title: "Invalid Doctor",
          description: "Assigned doctor not found in the system.",
          variant: "destructive",
        });
        setCurrentStep('initial');
        return;
      }

      const patientDetailsForReportData = {
        id: selectedPatient.id,
        name: selectedPatient.name,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        medicalHistory: selectedPatient.medicalHistory,
      };
      setPatientDetailsForReport(patientDetailsForReportData);

      const uploadResult = await uploadToCloudinary(file);

      const xraysCollectionRef = collection(db, 'xrays');
      const newXRayRecord: Omit<XRayRecord, 'id' | 'aiAnalysis' | 'report'> = {
        patientId: selectedPatient.id,
        uploadedBy: user.id,
        uploadedAt: serverTimestamp() as any,
        imageUrl: uploadResult.url,
        status: 'pending_ai_analysis',
        assignedDoctorId: assignedDoctor.id,
        assignedDoctorName: assignedDoctor.name,
        ...(appointmentIdFromUrl && { appointmentId: appointmentIdFromUrl }),
      };
      const docRef = await addDoc(xraysCollectionRef, newXRayRecord);
      setXrayRecordId(docRef.id);
      console.log("UploadXray: New X-ray record created in Firestore with ID:", docRef.id);

      // Update the patient document with the assigned doctor
      const patientRef = doc(db, 'patients', selectedPatient.id);
      await updateDoc(patientRef, {
        assignedDoctorIds: arrayUnion(assignedDoctor.id)
      });
      console.log(`UploadXray: Patient ${selectedPatient.id} updated with assignedDoctorId ${assignedDoctor.id}.`);


      if (appointmentIdFromUrl) {
        const appointmentRef = doc(db, 'appointments', appointmentIdFromUrl);
        await updateDoc(appointmentRef, {
          xrayId: docRef.id,
          status: 'completed',
          updatedAt: serverTimestamp(),
        });
        console.log(`UploadXray: Appointment ${appointmentIdFromUrl} updated with xrayId ${docRef.id} and status 'completed'.`);
      }

      setCurrentStep('analyzing');

      const analysisResults = await analyzeXRay(file);
      setAiAnalysisResults(analysisResults);

      const nextStatus: XRayRecord['status'] = analysisResults.noSignificantFinding 
        ? 'requires_radiologist_review' 
        : 'ai_analysis_complete';

      await updateDoc(doc(db, 'xrays', docRef.id), {
        aiAnalysis: {
          condition: analysisResults.condition,
          confidence: analysisResults.confidence,
          detectedAt: new Date().toISOString(),
          allPredictions: analysisResults.allPredictions,
          noSignificantFinding: analysisResults.noSignificantFinding,
        },
        status: nextStatus,
      });

      if (analysisResults.noSignificantFinding) {
        toast({
          title: "AI Analysis Uncertain",
          description: "The AI model is uncertain about findings. Manual radiologist review is required.",
          variant: "warning",
        });
        setCurrentStep('review_required');
      } else {
        toast({
          title: "AI Analysis Complete",
          description: "X-ray analyzed. You can now generate the medical report.",
        });
        setCurrentStep('analysis_complete'); // Set to analysis_complete, do not auto-generate
      }

    } catch (error: any) {
      console.error("UploadXray: Error processing X-ray:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process X-ray. Please try again.",
        variant: "destructive",
      });
      setCurrentStep('initial');
    }
  };

  const handleGenerateReportClick = async () => {
    if (!aiAnalysisResults || !xrayRecordId || !patientDetailsForReport) {
      toast({
        title: "Missing Data",
        description: "AI analysis results or patient info missing. Cannot generate report.",
        variant: "destructive",
      });
      return;
    }
    await generateAndSaveReport(
      aiAnalysisResults,
      xrayRecordId,
      patientDetailsForReport,
      selectedPatientId,
      selectedDoctorId
    );
  };

  const getProgressValue = () => {
    switch (currentStep) {
      case 'uploading': return 25;
      case 'analyzing': return 50;
      case 'analysis_complete': return 60; // Slightly higher to show progress
      case 'review_required': return 60;
      case 'generating_report': return 85;
      case 'report_generated': return 100;
      default: return 0;
    }
  };

  const getProgressMessage = () => {
    switch (currentStep) {
      case 'uploading': return "Uploading X-ray image to Cloudinary...";
      case 'analyzing': return "Sending image to Flask backend for AI analysis...";
      case 'analysis_complete': return "AI analysis complete. Ready to generate report.";
      case 'review_required': return "AI analysis uncertain. Radiologist review required.";
      case 'generating_report': return "Generating detailed medical report with Gemini AI...";
      case 'report_generated': return "Report generated and saved!";
      default: return "Ready to upload.";
    }
  };

  const filteredPredictions = aiAnalysisResults?.allPredictions.filter(
    p => p.probability >= OTHER_PREDICTIONS_DISPLAY_THRESHOLD
  ) || [];

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto glass-card">
        <CardHeader>
          <CardTitle>Upload X-Ray</CardTitle>
          <CardDescription>
            Follow the steps to upload an X-ray, analyze it with AI, and generate a medical report.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUploadAndAnalyze}>
          <CardContent className="space-y-6">
            {/* Step 1: File and Patient/Doctor Selection */}
            {currentStep === 'initial' && (
              <div className="space-y-4">
                {appointmentIdFromUrl && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary text-primary flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Pre-filling details for appointment ID: {appointmentIdFromUrl.substring(0, 8)}...</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="patient-select">Select Patient</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={isLoading || !!appointmentIdFromUrl}>
                    <SelectTrigger id="patient-select">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptions.length === 0 ? (
                        <SelectItem value="no-patients" disabled>No patients found</SelectItem>
                      ) : (
                        patientOptions.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} (ID: {patient.id})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor-select">Assign Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} disabled={isLoading || !!appointmentIdFromUrl}>
                    <SelectTrigger id="doctor-select">
                      <SelectValue placeholder="Assign a doctor" />
                    </SelectTrigger>
                    <SelectContent>
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

                <div className="space-y-2">
                  <Label htmlFor="x-ray">X-Ray Image</Label>
                  <Input
                    id="x-ray"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Display Uploaded Image */}
            {uploadedImageUrl && (currentStep === 'initial' || currentStep === 'uploading' || currentStep === 'analyzing' || currentStep === 'analysis_complete' || currentStep === 'generating_report' || currentStep === 'report_generated' || currentStep === 'review_required') && (
              <div className="space-y-2">
                <Label>Uploaded Image Preview</Label>
                <div className="w-full h-64 border rounded-md flex items-center justify-center bg-muted overflow-hidden">
                  <img src={uploadedImageUrl} alt="X-Ray Preview" className="max-w-full max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* Display AI Analysis Results */}
            {(currentStep === 'analysis_complete' || currentStep === 'generating_report' || currentStep === 'report_generated' || currentStep === 'review_required') && aiAnalysisResults && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" /> AI Analysis Findings
                  </CardTitle>
                  <CardDescription>Initial findings from the AI model.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiAnalysisResults.noSignificantFinding && (
                    <div className="p-3 rounded-lg bg-medical-warning/20 border border-medical-warning text-medical-warning flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <p className="text-sm font-medium">AI is uncertain about findings. Manual radiologist review is strongly recommended.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-medium">Primary Detection</h4>
                    {aiAnalysisResults.condition && aiAnalysisResults.confidence >= PRIMARY_CONDITION_DISPLAY_THRESHOLD ? (
                      <>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={
                              CONDITIONS_METADATA[aiAnalysisResults.condition as Condition]?.severity === 'high' 
                                ? 'destructive' 
                                : CONDITIONS_METADATA[aiAnalysisResults.condition as Condition]?.severity === 'medium'
                                ? 'secondary'
                                : 'default'
                          }
                            className="text-lg py-1.5"
                          >
                            {CONDITIONS_METADATA[aiAnalysisResults.condition as Condition]?.label || aiAnalysisResults.condition}
                          </Badge>
                          <span className="text-lg font-medium">
                            {(aiAnalysisResults.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {CONDITIONS_METADATA[aiAnalysisResults.condition as Condition]?.description || 'Description not available.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-medium text-muted-foreground">
                        {aiAnalysisResults.condition ? `Primary condition detected: ${aiAnalysisResults.condition}, but metadata is missing or confidence is too low.` : 'No significant primary findings detected with high confidence.'}
                      </p>
                    )}
                  </div>                  
                  {filteredPredictions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Other Detected Conditions (Confidence &ge; {Math.round(OTHER_PREDICTIONS_DISPLAY_THRESHOLD * 100)}%)</h4>
                      <div className="grid gap-2">
                        {filteredPredictions.map(({ condition, probability }) => (
                          <div key={condition} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {CONDITIONS_METADATA[condition as Condition]?.label || `Unknown: ${condition}`}
                            </span>
                            <span className="text-sm tabular-nums">
                              {(probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Display Generated Report */}
            {(currentStep === 'report_generated') && generatedReportData && (
              <Card className="glass-card border-l-4 border-medical-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-medical-info" /> Generated Medical Report
                  </CardTitle>
                  <CardDescription>Comprehensive report generated by Gemini AI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Executive Summary</h4>
                    <p className="text-sm text-muted-foreground">{generatedReportData.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Findings</h4>
                    <p className="text-sm text-muted-foreground">{generatedReportData.findings}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Impression</h4>
                    <p className="text-sm text-muted-foreground">{generatedReportData.impression}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <p className="text-sm text-muted-foreground">{generatedReportData.recommendations}</p>
                  </div>
                </CardContent>
              </Card>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 pt-0">
            {(currentStep !== 'initial' && currentStep !== 'report_generated') && (
              <div className="w-full">
                <Progress value={getProgressValue()} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {getProgressMessage()}
                </p>
              </div>
            )}
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/reports")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              {currentStep === 'initial' && (
                <Button type="submit" disabled={isLoading || !file || !selectedPatientId || !selectedDoctorId}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Upload & Analyze"}
                </Button>
              )}
              {(currentStep === 'analysis_complete') && (
                <Button 
                  type="button" 
                  onClick={handleGenerateReportClick} 
                  disabled={isLoading || !aiAnalysisResults}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : "Generate Report"}
                </Button>
              )}
              {currentStep === 'report_generated' && (
                <Button type="button" onClick={() => navigate(`/reports?reportId=${xrayRecordId}`)}>
                  View Full Report
                </Button>
              )}
            </div>
            {currentStep === 'review_required' && (
              <p className="text-sm text-medical-warning text-center mt-4">
                This X-ray requires manual radiologist review. Please go to the{' '}
                <Link to="/reports" className="underline font-medium">Reports page</Link> to review it.
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}