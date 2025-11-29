import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Prescription } from '@/components/Prescription';
import DoctorReviewForm from '@/components/DoctorReviewForm';
import RadiologistReviewForm from '@/components/RadiologistReviewForm'; // Import the new component

import { Condition } from "@/utils/xrayAnalysis";
import { CONDITIONS_METADATA } from "@/utils/conditionsMetadata";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, Timestamp, where, CollectionReference, Query, DocumentData } from "firebase/firestore"; // Import CollectionReference, Query, DocumentData
import { XRayRecord, UserDocument, PatientDocument } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { FilePenLine, Stethoscope, FileText, AlertTriangle, Eye, Brain } from "lucide-react"; // Added Brain icon

// Extend XRayRecord to include patientName and assignedDoctorName for display
interface DisplayReport extends XRayRecord {
  patientName: string;
  date: string; // Add date to DisplayReport interface
  assignedDoctorDisplayName?: string; // Add assigned doctor's name
}

const CONFIDENCE_THRESHOLD = 0.5; // Only show predictions with confidence >= 50%
const PRIMARY_CONDITION_DISPLAY_THRESHOLD = 0.4; // Defined PRIMARY_CONDITION_DISPLAY_THRESHOLD

const getStatusClass = (status: XRayRecord["status"]): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-600";
    case "pending_ai_analysis":
      return "bg-orange-500/20 text-orange-600"; // New status color
    case "ai_analysis_complete":
      return "bg-blue-500/20 text-blue-600"; // New status color
    case "analyzed":
      return "bg-green-500/20 text-green-600";
    case "reviewed":
      return "bg-purple-500/20 text-purple-600"; // Changed reviewed color for distinction
    case "requires_radiologist_review":
      return "bg-medical-warning/20 text-medical-warning"; // New status color for review required
    default:
      return "bg-gray-500/20 text-gray-600";
  }
};

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DisplayReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DisplayReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showDoctorReviewDialog, setShowDoctorReviewDialog] = useState(false);
  const [showRadiologistReviewDialog, setShowRadiologistReviewDialog] = useState(false); // New state for radiologist review
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchReports = async () => {
    console.log("Reports: Starting fetchReports...");
    console.log("Reports: Current user role:", user?.role);
    console.log("Reports: Current user ID:", user?.id);
    console.log("Reports: Current user patientId:", user?.patientId);

    if (!db || !user) {
      console.warn("Reports: Firestore not available or user not logged in. Cannot fetch reports.");
      setLoading(false);
      return;
    }
    console.log("Reports: Firestore DB is available.");

    setLoading(true);
    try {
      let q: CollectionReference<DocumentData> | Query<DocumentData> = collection(db, "xrays");
      console.log("Reports: Initial query created.");

      // Filter reports based on user role
      if (user.role === 'patient') {
        const patientIdForQuery = user.patientId;
        if (!patientIdForQuery) {
          console.warn("Reports: Patient ID not found for current user. Cannot fetch reports.");
          setLoading(false);
          return;
        }
        q = query(q, where('patientId', '==', patientIdForQuery));
        console.log(`Reports: Filtering for patientId: ${patientIdForQuery}`);
      } else if (user.role === 'doctor') {
        if (!user.id) {
          console.warn("Reports: Doctor user ID not found. Cannot fetch assigned reports.");
          setLoading(false);
          return;
        }
        // Doctors must filter by assignedDoctorId to match security rules
        q = query(q, where('assignedDoctorId', '==', user.id));
        console.log(`Reports: Filtering for assignedDoctorId: ${user.id}`);
      } else if (user.role === 'radiologist') {
        // Radiologists can only see X-rays for patients assigned to them
        const patientsQuery = query(collection(db, "patients"), where('assignedRadiologistId', '==', user.id));
        const patientsSnapshot = await getDocs(patientsQuery);
        const assignedPatientIds = patientsSnapshot.docs.map(doc => doc.id);

        if (assignedPatientIds.length === 0) {
          console.log("Reports: Radiologist has no assigned patients, thus no X-rays to display.");
          setReports([]);
          setLoading(false);
          return;
        }
        // Radiologists must query individually by patientId to match security rules
        // Build queries for each patient and combine results
        const radiologistQueries = assignedPatientIds.map(patientId =>
          query(collection(db, "xrays"), where('patientId', '==', patientId))
        );
        
        const allRadiologistReports: any[] = [];
        for (const radiologistQuery of radiologistQueries) {
          const snapshot = await getDocs(radiologistQuery);
          allRadiologistReports.push(...snapshot.docs);
        }
        
        console.log(`Reports: Radiologist user. Fetched X-rays for ${assignedPatientIds.length} patients. Total X-rays: ${allRadiologistReports.length}`);
        
        // Skip the normal query and process radiologist reports directly
        const docs = allRadiologistReports.sort((a, b) => {
          const aTime = (a.data() as XRayRecord).uploadedAt?.toMillis?.() || 0;
          const bTime = (b.data() as XRayRecord).uploadedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        let fetchedReports: DisplayReport[] = [];

        // Fetch patient names for each report
        const patientNamesMap = new Map<string, string>();
        const patientIdsToFetch: Set<string> = new Set();
        const doctorIdsToFetch: Set<string> = new Set();

        docs.forEach((doc) => {
          const data = doc.data() as XRayRecord;
          patientIdsToFetch.add(data.patientId);
          if (data.assignedDoctorId) {
            doctorIdsToFetch.add(data.assignedDoctorId);
          }
        });

        if (patientIdsToFetch.size > 0) {
          const patientsCollectionRef = collection(db, "patients");
          const patientsSnapshot = await getDocs(query(patientsCollectionRef, where('__name__', 'in', Array.from(patientIdsToFetch))));
          patientsSnapshot.forEach(patientDoc => {
            const patientData = patientDoc.data() as PatientDocument;
            patientNamesMap.set(patientDoc.id, patientData.name);
          });
        }

        const doctorNamesMap = new Map<string, string>();
        if (doctorIdsToFetch.size > 0) {
          const doctorsCollectionRef = collection(db, "users");
          const doctorsSnapshot = await getDocs(query(doctorsCollectionRef, where('__name__', 'in', Array.from(doctorIdsToFetch))));
          doctorsSnapshot.forEach(doctorDoc => {
            const doctorData = doctorDoc.data() as UserDocument;
            doctorNamesMap.set(doctorDoc.id, doctorData.name);
          });
        }

        docs.forEach((doc) => {
          const data = doc.data() as XRayRecord;
          const reportDate = data.uploadedAt?.toDate().toLocaleDateString() || 'N/A';
          
          fetchedReports.push({
            ...data,
            id: doc.id,
            date: reportDate,
            patientName: patientNamesMap.get(data.patientId) || `Patient ${data.patientId}`,
            assignedDoctorDisplayName: data.assignedDoctorId ? doctorNamesMap.get(data.assignedDoctorId) : 'N/A',
          });
        });

        setReports(fetchedReports);
        console.log(`Reports: Final fetched reports count for radiologist: ${fetchedReports.length}`);
        setLoading(false);
        return;
      } else if (user.role === 'admin') {
        console.log(`Reports: Admin user. Fetching all reports.`);
      }

      // Apply patientId filter from URL if present (for doctors viewing specific patient reports)
      const patientIdFromUrl = searchParams.get('patientId');
      if (patientIdFromUrl) {
        // Ensure this filter is only applied if the user is allowed to see other patients' reports
        if (user.role === 'doctor' || user.role === 'admin') {
          // For doctors, this will be a client-side filter as the Firestore query is already constrained by assignedDoctorId
          if (user.role === 'doctor') {
            // We will fetch all X-rays for the assigned doctor, then filter by patientIdFromUrl client-side
            // No change to the Firestore query here for doctors.
          } else {
            q = query(q, where('patientId', '==', patientIdFromUrl));
            console.log(`Reports: Applying URL filter for patientId: ${patientIdFromUrl}`);
          }
        }
      }

      const querySnapshot = await getDocs(q);
      console.log(`Reports: Fetched ${querySnapshot.size} X-ray documents.`);
      
      // Sort in-memory by uploadedAt descending to avoid permission issues with rule evaluation
      const docs = querySnapshot.docs.sort((a, b) => {
        const aTime = (a.data() as XRayRecord).uploadedAt?.toMillis?.() || 0;
        const bTime = (b.data() as XRayRecord).uploadedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      let fetchedReports: DisplayReport[] = [];

      // Fetch patient names for each report
      const patientNamesMap = new Map<string, string>();
      const patientIdsToFetch: Set<string> = new Set();
      const doctorIdsToFetch: Set<string> = new Set(); // Collect doctor IDs

      docs.forEach((doc) => {
        const data = doc.data() as XRayRecord;
        patientIdsToFetch.add(data.patientId);
        if (data.assignedDoctorId) {
          doctorIdsToFetch.add(data.assignedDoctorId);
        }
      });
      console.log(`Reports: Patient IDs to fetch names for: ${Array.from(patientIdsToFetch).join(', ')}`);
      console.log(`Reports: Doctor IDs to fetch names for: ${Array.from(doctorIdsToFetch).join(', ')}`);


      if (patientIdsToFetch.size > 0) {
        console.log(`Reports: Attempting to fetch patient details for IDs: ${Array.from(patientIdsToFetch).join(', ')}`); // NEW LOG
        const patientsCollectionRef = collection(db, "patients");
        const patientsSnapshot = await getDocs(query(patientsCollectionRef, where('__name__', 'in', Array.from(patientIdsToFetch))));
        patientsSnapshot.forEach(patientDoc => {
          const patientData = patientDoc.data() as PatientDocument;
          patientNamesMap.set(patientDoc.id, patientData.name);
        });
        console.log("Reports: Patient names map:", Object.fromEntries(patientNamesMap));
      }

      // Fetch doctor names
      const doctorNamesMap = new Map<string, string>();
      if (doctorIdsToFetch.size > 0) {
        const doctorsCollectionRef = collection(db, "users");
        const doctorsSnapshot = await getDocs(query(doctorsCollectionRef, where('__name__', 'in', Array.from(doctorIdsToFetch))));
        doctorsSnapshot.forEach(doctorDoc => {
          const doctorData = doctorDoc.data() as UserDocument;
          doctorNamesMap.set(doctorDoc.id, doctorData.name);
        });
        console.log("Reports: Doctor names map:", Object.fromEntries(doctorNamesMap));
      }

      docs.forEach((doc) => {
        const data = doc.data() as XRayRecord;
        const reportDate = data.uploadedAt?.toDate().toLocaleDateString() || 'N/A';
        
        fetchedReports.push({
          ...data,
          id: doc.id,
          date: reportDate,
          patientName: patientNamesMap.get(data.patientId) || `Patient ${data.patientId}`,
          assignedDoctorDisplayName: data.assignedDoctorId ? doctorNamesMap.get(data.assignedDoctorId) : 'N/A',
        });
      });

      // Client-side filter for doctors if patientIdFromUrl is present
      if (user.role === 'doctor' && patientIdFromUrl) {
        fetchedReports = fetchedReports.filter(report => report.patientId === patientIdFromUrl);
        console.log(`Reports: Doctor user. Client-side filtered reports for patientId: ${patientIdFromUrl}. Count: ${fetchedReports.length}`);
      }

      setReports(fetchedReports);
      console.log(`Reports: Final fetched reports count: ${fetchedReports.length}`);
      if (fetchedReports.length > 0) console.log("Reports: First final report:", fetchedReports[0]);

    } catch (error) {
      console.error("Reports: Error fetching reports:", error);
    } finally {
      setLoading(false);
      console.log("Reports: Finished fetchReports.");
    }
  };

  useEffect(() => {
    fetchReports();
  }, [db, user, searchParams]);


  useEffect(() => {
    if (!loading && reports.length > 0) {
      const reportIdFromUrl = searchParams.get('reportId');
      if (reportIdFromUrl) {
        const reportToOpen = reports.find(report => report.id === reportIdFromUrl);
        if (reportToOpen) {
          setSelectedReport(reportToOpen);
          setSearchParams({}, { replace: true });
        }
      }
    }
  }, [loading, reports, searchParams, setSearchParams]);


  const handleViewReport = (report: DisplayReport) => {
    setSelectedReport(report);
  };

  const handleWritePrescription = () => {
    setShowPrescriptionDialog(true);
  };

  const handleClosePrescription = () => {
    setShowPrescriptionDialog(false);
    fetchReports();
  };

  const handleDoctorReviewReport = () => {
    setShowDoctorReviewDialog(true);
  };

  const handleCloseDoctorReview = () => {
    setShowDoctorReviewDialog(false);
    fetchReports();
  };

  const handleRadiologistReviewReport = () => { // New handler for radiologist review
    setShowRadiologistReviewDialog(true);
  };

  const handleCloseRadiologistReview = () => { // New handler for closing radiologist review
    setShowRadiologistReviewDialog(false);
    fetchReports();
  };

  const filteredPredictionsForDisplay = selectedReport?.aiAnalysis?.allPredictions.filter(
    p => p.probability >= CONFIDENCE_THRESHOLD
  ) || [];

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
        <h1 className="text-3xl font-bold tracking-tight">X-Ray Reports</h1>
        {user?.role === 'radiologist' && (
          <Button asChild>
            <Link to="/upload-xray">Upload New X-Ray</Link>
          </Button>
        )}
        {(user?.role === 'doctor' || user?.role === 'patient') && (
          <Button asChild>
            <Link to="/upload-request">Request New X-Ray</Link>
          </Button>
        )}
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No X-ray reports found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Assigned Doctor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.patientId}</TableCell>
                    <TableCell className="font-medium">{report.patientName}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.examType ? report.examType.replace(/_/g, ' ') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusClass(report.status)}>
                        {report.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.aiAnalysis?.condition ? (
                        <Badge 
                          variant={
                            CONDITIONS_METADATA[report.aiAnalysis.condition as Condition]?.severity === 'high' 
                              ? 'destructive' 
                              : CONDITIONS_METADATA[report.aiAnalysis.condition as Condition]?.severity === 'medium'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {CONDITIONS_METADATA[report.aiAnalysis.condition as Condition]?.label || report.aiAnalysis.condition}
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {report.aiAnalysis?.confidence
                        ? `${(report.aiAnalysis.confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{report.assignedDoctorDisplayName || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report)}
                        disabled={!report.report && report.status !== 'ai_analysis_complete' && report.status !== 'requires_radiologist_review'}
                      >
                        View Report
                      </Button>
                      {user?.role === 'radiologist' && report.status === 'requires_radiologist_review' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleRadiologistReviewReport()}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedReport !== null} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"> {/* Added scrolling */}
          <DialogHeader>
            <DialogTitle>X-Ray Report</DialogTitle>
            <DialogDescription>
              Patient: {selectedReport?.patientName} (ID: {selectedReport?.patientId})
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {selectedReport?.imageUrl && (
                <img
                  src={selectedReport.imageUrl}
                  alt="X-Ray"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="grid gap-4">
              {selectedReport?.aiAnalysis && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" /> AI Analysis Findings
                    </CardTitle>
                    <CardDescription>Initial findings from the AI model.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {selectedReport.aiAnalysis.noSignificantFinding && (
                        <div className="p-3 rounded-lg bg-medical-warning/20 border border-medical-warning text-medical-warning flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <p className="text-sm font-medium">AI is uncertain about findings. Manual radiologist review is strongly recommended.</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <h4 className="font-medium">Primary Detection</h4>
                        {selectedReport?.aiAnalysis?.condition && selectedReport.aiAnalysis.confidence >= PRIMARY_CONDITION_DISPLAY_THRESHOLD ? (
                          <>
                            <div className="flex items-center gap-4">
                              <Badge 
                                variant={
                                  CONDITIONS_METADATA[selectedReport.aiAnalysis.condition as Condition]?.severity === 'high' 
                                    ? 'destructive' 
                                    : CONDITIONS_METADATA[selectedReport.aiAnalysis.condition as Condition]?.severity === 'medium'
                                    ? 'secondary'
                                    : 'default'
                              }
                                className="text-lg py-1.5"
                              >
                                {CONDITIONS_METADATA[selectedReport.aiAnalysis.condition as Condition]?.label || selectedReport.aiAnalysis.condition}
                              </Badge>
                              <span className="text-lg font-medium">
                                {selectedReport.aiAnalysis.confidence 
                                  ? `${(selectedReport.aiAnalysis.confidence * 100).toFixed(1)}%` 
                                  : 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {CONDITIONS_METADATA[selectedReport.aiAnalysis.condition as Condition]?.description || 'Description not available.'}
                            </p>
                          </>
                        ) : (
                          <p className="text-lg font-medium text-muted-foreground">No significant primary findings detected with high confidence.</p>
                        )}
                      </div>                  
                      {filteredPredictionsForDisplay.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Other Detected Conditions (Confidence &ge; {CONFIDENCE_THRESHOLD * 100}%)</h4>
                        <div className="grid gap-2">
                          {filteredPredictionsForDisplay.map(({ condition, probability }) => (
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

              {selectedReport?.radiologistNotes && (
                <Card className="glass-card border-l-4 border-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FilePenLine className="h-5 w-5 text-accent" /> Radiologist's Manual Review
                    </CardTitle>
                    <CardDescription>
                      Notes from manual review by a radiologist.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.radiologistNotes}</p>
                  </CardContent>
                </Card>
              )}

              {selectedReport?.report ? (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Medical Report</CardTitle>
                    <CardDescription>Generated by Gemini AI based on the analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Executive Summary</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport?.report?.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport?.report?.findings}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Impression</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport?.report?.impression}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport?.report?.recommendations}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No full medical report generated yet for this X-ray.</p>
                    {user?.role === 'radiologist' && selectedReport?.status === 'ai_analysis_complete' && (
                      <Button className="mt-4" asChild>
                        <Link to={`/upload-xray?reportId=${selectedReport.id}`}>Generate Report</Link>
                      </Button>
                    )}
                    {user?.role === 'radiologist' && selectedReport?.status === 'requires_radiologist_review' && (
                      <p className="mt-4 text-medical-warning">
                        This report requires manual radiologist review before generation.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedReport?.doctorReview && (
                <Card className="glass-card border-l-4 border-medical-info">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-medical-info" /> Doctor's Review
                    </CardTitle>
                    <CardDescription>
                      Reviewed by Dr. {selectedReport.doctorReview.doctorName} on {new Date(selectedReport.doctorReview.reviewedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Diagnosis</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.doctorReview.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <p className="text-sm text-muted-foreground">{selectedReport.doctorReview.recommendations}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          {selectedReport && (user?.role === 'doctor' || user?.role === 'radiologist') && (
            <div className="flex justify-end gap-2 pt-4">
              {user?.role === 'radiologist' && selectedReport.status === 'requires_radiologist_review' && (
                <Button onClick={handleRadiologistReviewReport}>
                  <Eye className="mr-2 h-4 w-4" />
                  Manual Review
                </Button>
              )}
              {user?.role === 'doctor' && selectedReport.status === 'analyzed' && (
                <Button onClick={handleDoctorReviewReport}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Review Report
                </Button>
              )}
              {user?.role === 'doctor' && selectedReport.status === 'reviewed' && (
                <Button onClick={handleWritePrescription}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Write Prescription
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedReport && (
        <>
          <Prescription
            isOpen={showPrescriptionDialog}
            onClose={handleClosePrescription}
            reportId={selectedReport.id}
            patientId={selectedReport.patientId}
            patientName={selectedReport.patientName}
            diagnosis={selectedReport.aiAnalysis?.condition ? (CONDITIONS_METADATA[selectedReport.aiAnalysis.condition as Condition]?.label || selectedReport.aiAnalysis.condition) : undefined}
          />
          <DoctorReviewForm
            isOpen={showDoctorReviewDialog}
            onClose={handleCloseDoctorReview}
            reportId={selectedReport.id}
            patientId={selectedReport.patientId}
            patientName={selectedReport.patientName}
            currentDiagnosis={selectedReport.doctorReview?.diagnosis}
            currentRecommendations={selectedReport.doctorReview?.recommendations}
            onReviewComplete={handleCloseDoctorReview}
          />
          <RadiologistReviewForm // New RadiologistReviewForm dialog
            isOpen={showRadiologistReviewDialog}
            onClose={handleCloseRadiologistReview}
            reportId={selectedReport.id}
            patientId={selectedReport.patientId}
            patientName={selectedReport.patientName}
            currentRadiologistNotes={selectedReport.radiologistNotes}
            assignedDoctorId={selectedReport.assignedDoctorId}
            assignedDoctorName={selectedReport.assignedDoctorDisplayName}
            aiAnalysisResults={selectedReport.aiAnalysis} // Pass AI analysis results
            onReviewComplete={handleCloseRadiologistReview}
          />
        </>
      )}
    </div>
  );
}