import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp, where, documentId } from 'firebase/firestore'; // Import documentId
import { XRayRecord, PatientDocument } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { CONDITIONS_METADATA } from '@/utils/conditionsMetadata';
import { Condition } from '@/utils/xrayAnalysis';

// Extend XRayRecord to include patientName for display
interface DisplayReport extends XRayRecord {
  patientName: string;
  date: string;
}

interface PatientOverviewData {
  id: string;
  name: string;
  status: string;
  lastVisit: string;
}

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState<DisplayReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [stats, setStats] = useState({
    activePatients: '0',
    newReports: '0',
    requiresReview: '0',
    reviewed: '0',
  });
  const [patientStatusData, setPatientStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [patientOverview, setPatientOverview] = useState<PatientOverviewData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("DoctorDashboard: Starting fetchData...");
      console.log("DoctorDashboard: Current user ID:", user?.id);
      if (!db || !user?.id) {
        console.warn("DoctorDashboard: Firestore not available or user not logged in. Cannot fetch data for Doctor Dashboard.");
        setLoadingReports(false);
        setLoadingStats(false);
        return;
      }
      console.log("DoctorDashboard: Firestore DB is available. User ID:", user.id);

      setLoadingReports(true);
      setLoadingStats(true);
      try {
        // 1. Fetch all patients assigned to the current doctor
        const assignedPatientsQuery = query(
          collection(db, "patients"),
          where('assignedDoctorIds', 'array-contains', user.id)
        );
        const assignedPatientsSnapshot = await getDocs(assignedPatientsQuery);
        const allPatients: PatientDocument[] = assignedPatientsSnapshot.docs.map(doc => ({ ...doc.data() as PatientDocument, id: doc.id }));
        console.log(`DoctorDashboard: Fetched ${allPatients.length} patients assigned to doctor ${user.id}.`);
        if (allPatients.length > 0) console.log("DoctorDashboard: First assigned patient:", allPatients[0]);

        // Extract unique patient IDs from these patients
        const relevantPatientIds = new Set(allPatients.map(p => p.id));
        console.log(`DoctorDashboard: Found ${relevantPatientIds.size} relevant patient IDs from assigned patients.`);

        let allXrays: XRayRecord[] = [];
        if (relevantPatientIds.size > 0) {
          // 2. Fetch X-ray records for these specific patients
          const patientIdsArray = Array.from(relevantPatientIds);
          const xrayBatches: string[][] = [];
          // Firestore 'in' query has a limit of 10, so we batch the patient IDs
          for (let i = 0; i < patientIdsArray.length; i += 10) {
            xrayBatches.push(patientIdsArray.slice(i, i + 10));
          }

          for (const batch of xrayBatches) {
            const batchXraysQuery = query(collection(db, "xrays"), where('patientId', 'in', batch), orderBy("uploadedAt", "desc"));
            const batchXraysSnapshot = await getDocs(batchXraysQuery);
            allXrays.push(...batchXraysSnapshot.docs.map(doc => ({ ...doc.data() as XRayRecord, id: doc.id })));
          }
        }
        console.log(`DoctorDashboard: Total X-ray records fetched for relevant patients: ${allXrays.length}.`);
        if (allXrays.length > 0) console.log("DoctorDashboard: First X-ray record:", allXrays[0]);


        // Map for patient names
        const patientNamesMap = new Map<string, string>();
        allPatients.forEach(p => patientNamesMap.set(p.id, p.name));

        // Calculate Stats
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        let activePatientsCount = 0;
        const statusCounts: { [key: string]: number } = { active: 0, monitoring: 0, treatment: 0, inactive: 0, unclaimed: 0 }; // Include unclaimed
        const patientOverviewList: PatientOverviewData[] = [];

        allPatients.forEach(patient => {
          if (patient.status === 'active') {
            activePatientsCount++;
          }
          if (statusCounts[patient.status] !== undefined) {
            statusCounts[patient.status]++;
          }

          // Determine last visit from latest X-ray or mock if no X-ray
          const patientXrays = allXrays.filter(xray => xray.patientId === patient.id);
          const latestXray = patientXrays.sort((a, b) => {
            const dateA = a.uploadedAt?.toDate() || new Date(0);
            const dateB = b.uploadedAt?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          })[0];

          const lastVisitDate = latestXray ? latestXray.uploadedAt?.toDate().toLocaleDateString() : 'N/A';

          patientOverviewList.push({
            id: patient.id,
            name: patient.name,
            status: patient.status,
            lastVisit: lastVisitDate,
          });
        });

        const newReportsCount = allXrays.filter(xray => xray.uploadedAt?.toDate() > sevenDaysAgo).length;
        const requiresReviewCount = allXrays.filter(xray => xray.status === 'analyzed').length;
        const reviewedCount = allXrays.filter(xray => xray.status === 'reviewed').length;

        setStats({
          activePatients: activePatientsCount.toString(),
          newReports: newReportsCount.toString(),
          requiresReview: requiresReviewCount.toString(),
          reviewed: reviewedCount.toString(),
        });
        console.log("DoctorDashboard: Stats calculated:", { activePatientsCount, newReportsCount, requiresReviewCount, reviewedCount });


        setPatientStatusData([
          { name: 'Active', value: statusCounts.active, color: 'hsl(var(--primary))' },
          { name: 'Monitoring', value: statusCounts.monitoring, color: 'hsl(var(--accent))' },
          { name: 'Treatment', value: statusCounts.treatment, color: 'hsl(var(--destructive))' },
          { name: 'Inactive', value: statusCounts.inactive, color: 'hsl(var(--muted-foreground))' },
          { name: 'Unclaimed', value: statusCounts.unclaimed, color: 'hsl(var(--gray-500))' },
        ]);
        console.log("DoctorDashboard: Patient Status Data:", patientStatusData);


        setPatientOverview(patientOverviewList);
        console.log("DoctorDashboard: Patient Overview List:", patientOverviewList);


        // Set Recent Reports (limit to 5, showing analyzed or reviewed)
        const recentReportsData: DisplayReport[] = allXrays
          .filter(xray => xray.status === 'analyzed' || xray.status === 'reviewed')
          .slice(0, 5)
          .map(xray => ({
            ...xray,
            date: xray.uploadedAt?.toDate().toLocaleDateString() || 'N/A',
            patientName: patientNamesMap.get(xray.patientId) || `Patient ${xray.patientId}`,
          }));
        setRecentReports(recentReportsData);
        console.log(`DoctorDashboard: Recent Reports (first 5 analyzed/reviewed): ${recentReportsData.length} items.`, recentReportsData);


      } catch (error) {
        console.error("DoctorDashboard: Error fetching data for Doctor Dashboard:", error);
      } finally {
        setLoadingReports(false);
        setLoadingStats(false);
        console.log("DoctorDashboard: Finished fetchData.");
      }
    };

    fetchData();
  }, [db, user]);

  const dashboardStats = [
    { title: 'Total X-rays', value: stats.activePatients, icon: Users, change: '' },
    { title: 'New Reports', value: stats.newReports, icon: FileText, change: 'Last 7 days' },
    { title: 'Requires Review', value: stats.requiresReview, icon: AlertCircle, change: 'Urgent attention' },
    { title: 'Reviewed', value: stats.reviewed, icon: CheckCircle, change: 'All time' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h2>
        <p className="text-muted-foreground">Monitor patient reports and analysis results</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
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
            <CardTitle>Patient Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center items-center h-[250px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={patientStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // Removed the label prop to prevent overlapping text
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patientStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentReports.length === 0 ? (
              <p className="text-muted-foreground text-center">No recent reports found.</p>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <Link to={`/reports?reportId=${report.id}`} key={report.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div>
                        <p className="font-medium">{report.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.aiAnalysis?.condition ? CONDITIONS_METADATA[report.aiAnalysis.condition as Condition].label : 'N/A'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.aiAnalysis?.condition && CONDITIONS_METADATA[report.aiAnalysis.condition as Condition].severity === 'high' ? 'bg-destructive/20 text-destructive' :
                        report.aiAnalysis?.condition && CONDITIONS_METADATA[report.aiAnalysis.condition as Condition].severity === 'medium' ? 'bg-accent/20 text-accent' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {report.aiAnalysis?.condition && CONDITIONS_METADATA[report.aiAnalysis.condition as Condition].severity === 'high' ? 'Urgent' :
                         report.aiAnalysis?.condition && CONDITIONS_METADATA[report.aiAnalysis.condition as Condition].severity === 'medium' ? 'Review' : 'Normal'}
                      </span>
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
          <CardTitle>Patient Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : patientOverview.length === 0 ? (
            <p className="text-muted-foreground text-center">No patients found.</p>
          ) : (
            <div className="space-y-3">
              {patientOverview.map((patient) => (
                <Link to={`/patients/${patient.id}`} key={patient.id} className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{patient.status}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Last visit: {patient.lastVisit}
                    </span>
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

export default DoctorDashboard;