import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FileText, Clock, TrendingUp, AlertTriangle, CalendarCheck, Eye, Stethoscope } from 'lucide-react';
import { LineChart, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, where } from 'firebase/firestore';
import { XRayRecord, UserDocument, PatientDocument, Appointment } from '@/types/database';
import { CONDITIONS_METADATA } from '@/utils/conditionsMetadata';
import { Condition } from '@/utils/xrayAnalysis';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth to get the current user

// Extend XRayRecord to include assignedDoctorName for display
interface DisplayXRayRecord extends XRayRecord {
  assignedDoctorDisplayName?: string;
  patientName?: string; // Added patientName for display
}

interface RadiologistStats {
  totalXrays: number;
  pendingAIProcessing: number; // New stat
  requiresRadiologistReview: number;
  reportsGenerated: number;
  reportsAwaitingDoctorReview: number; // New stat
  pendingAppointments: number;
  accuracyRate: string;
}

interface WeeklyActivityData {
  day: string;
  uploads: number;
  analyses: number;
}

interface FindingsDistributionData {
  category: string;
  count: number;
}

const RadiologistDashboard = () => {
  const { user } = useAuth(); // Get the current user from AuthContext
  const [stats, setStats] = useState<RadiologistStats>({
    totalXrays: 0,
    pendingAIProcessing: 0,
    requiresRadiologistReview: 0,
    reportsGenerated: 0,
    reportsAwaitingDoctorReview: 0,
    pendingAppointments: 0,
    accuracyRate: '98.4%', // Placeholder for now
  });
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [findingsDistribution, setFindingsDistribution] = useState<FindingsDistributionData[]>([]);
  const [recentUploads, setRecentUploads] = useState<DisplayXRayRecord[]>([]);
  const [aiProcessingQueue, setAiProcessingQueue] = useState<DisplayXRayRecord[]>([]); // Renamed from analysisQueue
  const [manualReviewQueue, setManualReviewQueue] = useState<DisplayXRayRecord[]>([]);
  const [reportsAwaitingDoctorReviewQueue, setReportsAwaitingDoctorReviewQueue] = useState<DisplayXRayRecord[]>([]); // New state for this queue
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("RadiologistDashboard: Starting fetchDashboardData...");
      if (!db || !user?.id) {
        console.warn("RadiologistDashboard: Firestore not available or user not logged in. Cannot fetch data for Radiologist Dashboard.");
        setLoading(false);
        return;
      }
      console.log("RadiologistDashboard: Current user ID:", user.id);

      setLoading(true);
      try {
        // Fetch all patients to filter by assigned radiologist
        const allPatientsQuery = query(collection(db, "patients"), where('assignedRadiologistId', '==', user.id));
        const allPatientsSnapshot = await getDocs(allPatientsQuery);
        const assignedPatients: PatientDocument[] = allPatientsSnapshot.docs.map(doc => ({ ...doc.data() as PatientDocument, id: doc.id }));
        const assignedPatientIds = new Set(assignedPatients.map(p => p.id));
        console.log(`RadiologistDashboard: Found ${assignedPatientIds.size} patients assigned to current radiologist.`);
        if (assignedPatientIds.size > 0) {
          console.log("RadiologistDashboard: Assigned Patient IDs:", Array.from(assignedPatientIds));
        }


        // Fetch X-ray records relevant to this radiologist's assigned patients
        let xraysQuery = query(collection(db, "xrays"), orderBy("uploadedAt", "desc"));
        if (assignedPatientIds.size > 0) {
          xraysQuery = query(xraysQuery, where('patientId', 'in', Array.from(assignedPatientIds)));
        } else {
          // If no patients are assigned, there are no xrays to fetch for this radiologist
          console.log("RadiologistDashboard: No patients assigned, skipping X-ray and appointment fetches.");
          setStats({
            totalXrays: 0,
            pendingAIProcessing: 0,
            requiresRadiologistReview: 0,
            reportsGenerated: 0,
            reportsAwaitingDoctorReview: 0,
            pendingAppointments: 0,
            accuracyRate: '98.4%',
          });
          setWeeklyActivity([]);
          setFindingsDistribution([]);
          setRecentUploads([]);
          setAiProcessingQueue([]);
          setManualReviewQueue([]);
          setReportsAwaitingDoctorReviewQueue([]);
          setLoading(false);
          return;
        }
        
        const xraysSnapshot = await getDocs(xraysQuery);
        const allXrays: XRayRecord[] = xraysSnapshot.docs.map(doc => ({ ...doc.data() as XRayRecord, id: doc.id }));
        console.log(`RadiologistDashboard: Fetched ${allXrays.length} X-ray records for assigned patients.`);
        if (allXrays.length > 0) console.log("RadiologistDashboard: First fetched X-ray:", allXrays[0]);


        // Fetch appointments relevant to this radiologist's assigned patients
        let appointmentsQuery = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
        if (assignedPatientIds.size > 0) {
          appointmentsQuery = query(appointmentsQuery, where('patientId', 'in', Array.from(assignedPatientIds)));
        } else {
          // Already handled above, but for safety
          const allAppointments: Appointment[] = [];
        }
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const allAppointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({ ...doc.data() as Appointment, id: doc.id }));
        console.log(`RadiologistDashboard: Fetched ${allAppointments.length} appointment records for assigned patients.`);


        // Fetch all doctor names and patient names to map IDs to names
        const doctorNamesMap = new Map<string, string>();
        const patientNamesMap = new Map<string, string>();
        
        const doctorsQuery = query(collection(db, "users"), where('role', '==', 'doctor'));
        const doctorsSnapshot = await getDocs(doctorsQuery);
        doctorsSnapshot.forEach(doc => {
          const doctorData = doc.data() as UserDocument;
          doctorNamesMap.set(doc.id, doctorData.name);
        });

        assignedPatients.forEach(p => { // Only map names for assigned patients
          patientNamesMap.set(p.id, p.name);
        });

        const xraysWithDisplayNames: DisplayXRayRecord[] = allXrays.map(xray => ({
          ...xray,
          assignedDoctorDisplayName: xray.assignedDoctorId ? doctorNamesMap.get(xray.assignedDoctorId) : 'N/A',
          patientName: patientNamesMap.get(xray.patientId) || `Patient ${xray.patientId}`,
        }));
        console.log(`RadiologistDashboard: X-rays with display names count: ${xraysWithDisplayNames.length}`);


        // Calculate Stats
        const totalXrays = xraysWithDisplayNames.length;
        const pendingAIProcessing = xraysWithDisplayNames.filter(xray => xray.status === 'pending_ai_analysis').length;
        const requiresRadiologistReview = xraysWithDisplayNames.filter(xray => xray.status === 'requires_radiologist_review').length;
        const reportsGenerated = xraysWithDisplayNames.filter(xray => xray.status === 'analyzed' || xray.status === 'reviewed').length;
        const reportsAwaitingDoctorReview = xraysWithDisplayNames.filter(xray => 
          (xray.status === 'analyzed' || xray.status === 'ai_analysis_complete') && !xray.doctorReview
        ).length;
        const pendingAppointments = allAppointments.filter(app => app.status === 'pending').length;

        setStats({
          totalXrays,
          pendingAIProcessing,
          requiresRadiologistReview,
          reportsGenerated,
          reportsAwaitingDoctorReview,
          pendingAppointments,
          accuracyRate: '98.4%', // Still a placeholder
        });
        console.log("RadiologistDashboard: Calculated Stats:", stats);


        // Weekly Activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Go back 6 days to include today
        sevenDaysAgo.setHours(0, 0, 0, 0);
        console.log("RadiologistDashboard: Weekly Activity - Starting date (7 days ago):", sevenDaysAgo.toLocaleDateString());


        const activityMap = new Map<string, { uploads: number; analyses: number }>();
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          activityMap.set(date.toISOString().split('T')[0], { uploads: 0, analyses: 0 });
        }
        console.log("RadiologistDashboard: Weekly Activity - Initialized activityMap:", Object.fromEntries(activityMap));


        xraysWithDisplayNames.forEach(xray => {
          const uploadDate = xray.uploadedAt?.toDate();
          if (uploadDate) {
            const dateKey = uploadDate.toISOString().split('T')[0];
            console.log(`RadiologistDashboard: Processing X-ray ${xray.id}. UploadedAt: ${uploadDate.toLocaleDateString()}, DateKey: ${dateKey}. Status: ${xray.status}`);
            
            if (uploadDate >= sevenDaysAgo) {
              const entry = activityMap.get(dateKey);
              if (entry) {
                entry.uploads++;
                console.log(`RadiologistDashboard: Incrementing upload for ${dateKey}. New count: ${entry.uploads}`);
                // Count as 'analyses' if it's past the initial pending stage and has AI analysis data
                if (xray.aiAnalysis && (xray.status === 'analyzed' || xray.status === 'reviewed' || xray.status === 'ai_analysis_complete' || xray.status === 'requires_radiologist_review')) {
                  entry.analyses++;
                  console.log(`RadiologistDashboard: Incrementing analysis for ${dateKey}. New count: ${entry.analyses}. X-ray status: ${xray.status}`);
                } else {
                  console.log(`RadiologistDashboard: Not incrementing analysis for ${dateKey}. X-ray status: ${xray.status}, AI Analysis: ${!!xray.aiAnalysis}`);
                }
              } else {
                console.warn(`RadiologistDashboard: No entry in activityMap for dateKey: ${dateKey}. This should not happen if activityMap is correctly initialized.`);
              }
            } else {
              console.log(`RadiologistDashboard: X-ray ${xray.id} upload date ${uploadDate.toLocaleDateString()} is older than ${sevenDaysAgo.toLocaleDateString()}. Skipping.`);
            }
          } else {
            console.warn(`RadiologistDashboard: X-ray ${xray.id} has no valid uploadedAt timestamp.`);
          }
        });
        console.log("RadiologistDashboard: Weekly Activity - Populated activityMap:", Object.fromEntries(activityMap));


        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const sortedWeeklyActivity: WeeklyActivityData[] = Array.from(activityMap.entries())
          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
          .map(([dateKey, data]) => ({
            day: daysOfWeek[new Date(dateKey).getDay()],
            uploads: data.uploads,
            analyses: data.analyses,
          }));
        setWeeklyActivity(sortedWeeklyActivity);
        console.log("RadiologistDashboard: Weekly Activity - Final sortedWeeklyActivity:", sortedWeeklyActivity);


        // Findings Distribution
        const findingsMap = new Map<string, number>();
        xraysWithDisplayNames.forEach(xray => {
          if (xray.aiAnalysis?.condition) {
            const conditionKey = xray.aiAnalysis.condition as Condition; // Cast to Condition type
            const metadata = CONDITIONS_METADATA[conditionKey];
            if (metadata) {
              const conditionLabel = metadata.label;
              findingsMap.set(conditionLabel, (findingsMap.get(conditionLabel) || 0) + 1);
            } else {
              console.warn(`RadiologistDashboard: No metadata found for condition: '${conditionKey}'. This condition might be malformed or not in CONDITIONS_METADATA.`);
            }
          }
        });

        const sortedFindingsDistribution: FindingsDistributionData[] = Array.from(findingsMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);
        setFindingsDistribution(sortedFindingsDistribution);
        console.log("RadiologistDashboard: Findings Distribution - sortedFindingsDistribution:", sortedFindingsDistribution);


        // Recent Uploads (latest 3 that are analyzed or reviewed)
        const recentUploadsData = xraysWithDisplayNames.filter(xray => 
          xray.status === 'analyzed' || xray.status === 'reviewed'
        ).slice(0, 3);
        setRecentUploads(recentUploadsData);
        console.log("RadiologistDashboard: Recent Uploads:", recentUploadsData);


        // AI Processing & Initial Review Queue (latest 3 that are pending_ai_analysis or ai_analysis_complete AND do not require manual review)
        const aiProcessingQueueData = xraysWithDisplayNames.filter(xray => 
          xray.status === 'pending_ai_analysis' || 
          (xray.status === 'ai_analysis_complete' && !xray.radiologistNotes) // AI complete but no manual review notes
        ).slice(0, 3);
        setAiProcessingQueue(aiProcessingQueueData);
        console.log("RadiologistDashboard: AI Processing Queue:", aiProcessingQueueData);


        // Manual Review Queue (latest 3 that explicitly require radiologist review)
        const manualReviewQueueData = xraysWithDisplayNames.filter(xray => 
          xray.status === 'requires_radiologist_review'
        ).slice(0, 3);
        setManualReviewQueue(manualReviewQueueData);
        console.log("RadiologistDashboard: Manual Review Queue:", manualReviewQueueData);


        // Reports Awaiting Doctor Review Queue (latest 3 that are analyzed/ai_analysis_complete but no doctor review)
        const reportsAwaitingDoctorReviewData = xraysWithDisplayNames.filter(xray => 
          (xray.status === 'analyzed' || xray.status === 'ai_analysis_complete') && !xray.doctorReview
        ).slice(0, 3);
        setReportsAwaitingDoctorReviewQueue(reportsAwaitingDoctorReviewData);
        console.log("RadiologistDashboard: Reports Awaiting Doctor Review Queue:", reportsAwaitingDoctorReviewData);


      } catch (error) {
        console.error("RadiologistDashboard: Error fetching data for Radiologist Dashboard:", error);
      } finally {
        setLoading(false);
        console.log("RadiologistDashboard: Finished fetchDashboardData.");
      }
    };

    fetchDashboardData();
  }, [db, user]); // Added 'user' to dependency array

  const dashboardStats = [
    { title: 'Total X-rays', value: stats.totalXrays.toString(), icon: Activity, change: 'All time' },
    { title: 'Pending AI Processing', value: stats.pendingAIProcessing.toString(), icon: Clock, change: 'Awaiting AI analysis' },
    { title: 'Manual Review Needed', value: stats.requiresRadiologistReview.toString(), icon: AlertTriangle, change: 'Urgent attention' },
    { title: 'Reports Awaiting Doctor Review', value: stats.reportsAwaitingDoctorReview.toString(), icon: Stethoscope, change: 'Pending doctor action' },
    { title: 'Reports Generated', value: stats.reportsGenerated.toString(), icon: FileText, change: 'All time' },
    { title: 'Pending Appointments', value: stats.pendingAppointments.toString(), icon: CalendarCheck, change: 'New requests' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Radiologist Dashboard</h2>
        <p className="text-muted-foreground">Overview of your X-ray analysis workflow</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"> {/* Adjusted grid columns */}
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded-full animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          dashboardStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[250px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="uploads" stroke="hsl(var(--primary))" strokeWidth={2} name="Uploads" />
                  <Line type="monotone" dataKey="analyses" stroke="hsl(var(--accent))" strokeWidth={2} name="Analyses" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Findings Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[250px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={findingsDistribution} margin={{ bottom: 30 }}> {/* Added bottom margin */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    angle={-45} // Rotate labels
                    textAnchor="end" // Anchor text to the end
                    interval={0} // Show all labels
                    height={60} // Give more height for rotated labels
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>X-rays Requiring Manual Review</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : manualReviewQueue.length === 0 ? (
              <p className="text-muted-foreground text-center">No X-rays currently require manual review.</p>
            ) : (
              <div className="space-y-3">
                {manualReviewQueue.map((xray) => (
                  <Link to={`/reports?reportId=${xray.id}`} key={xray.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-medical-warning/20 hover:bg-medical-warning/30 transition-colors">
                      <div>
                        <p className="font-medium">Patient: {xray.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {xray.uploadedAt?.toDate().toLocaleDateString()}
                        </p>
                        {xray.assignedDoctorDisplayName && (
                          <p className="text-xs text-muted-foreground">Assigned to: {xray.assignedDoctorDisplayName}</p>
                        )}
                      </div>
                      <Eye className="h-5 w-5 text-medical-warning" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>AI Processing & Initial Review</CardTitle> {/* Renamed card title */}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : aiProcessingQueue.length === 0 ? (
              <p className="text-muted-foreground text-center">No X-rays in AI processing or initial review queue.</p>
            ) : (
              <div className="space-y-3">
                {aiProcessingQueue.map((xray) => (
                  <Link to={`/reports?reportId=${xray.id}`} key={xray.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div>
                        <p className="font-medium">Patient: {xray.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {xray.uploadedAt?.toDate().toLocaleDateString()}
                        </p>
                        {xray.assignedDoctorDisplayName && (
                          <p className="text-xs text-muted-foreground">Assigned to: {xray.assignedDoctorDisplayName}</p>
                        )}
                      </div>
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
          <CardHeader>
            <CardTitle>Reports Awaiting Doctor Review</CardTitle> {/* New Card */}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : reportsAwaitingDoctorReviewQueue.length === 0 ? (
              <p className="text-muted-foreground text-center">No reports currently awaiting doctor review.</p>
            ) : (
              <div className="space-y-3">
                {reportsAwaitingDoctorReviewQueue.map((xray) => (
                  <Link to={`/reports?reportId=${xray.id}`} key={xray.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-medical-info/20 hover:bg-medical-info/30 transition-colors">
                      <div>
                        <p className="font-medium">Patient: {xray.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Analyzed {xray.aiAnalysis?.detectedAt ? new Date(xray.aiAnalysis.detectedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        {xray.assignedDoctorDisplayName && (
                          <p className="text-xs text-muted-foreground">Assigned to: {xray.assignedDoctorDisplayName}</p>
                        )}
                      </div>
                      <Stethoscope className="h-5 w-5 text-medical-info" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentUploads.length === 0 ? (
              <p className="text-muted-foreground text-center">No recent reports found.</p>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((xray) => (
                  <Link to={`/reports?reportId=${xray.id}`} key={xray.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div>
                        <p className="font-medium">Patient: {xray.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {xray.aiAnalysis?.detectedAt ? `Analyzed ${new Date(xray.aiAnalysis.detectedAt).toLocaleDateString()}` : 'Analysis complete'}
                        </p>
                        {xray.assignedDoctorDisplayName && (
                          <p className="text-xs text-muted-foreground">Assigned to: {xray.assignedDoctorDisplayName}</p>
                        )}
                      </div>
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default RadiologistDashboard;