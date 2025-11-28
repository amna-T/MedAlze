import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Activity, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { XRayRecord } from '@/types/database';
import { CONDITIONS_METADATA } from '@/utils/conditionsMetadata';

interface PatientDashboardStats {
  totalReports: number;
  upcomingAppointments: number; // Placeholder for now, as appointments aren't fully implemented
  latestResult: string;
  pendingRequests: number;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatientDashboardStats>({
    totalReports: 0,
    upcomingAppointments: 0,
    latestResult: 'N/A',
    pendingRequests: 0,
  });
  const [recentXrays, setRecentXrays] = useState<XRayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user || !user.id || !db) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // For patients, their `patientId` in AuthContext is the document ID in the 'patients' collection.
        const patientIdForQuery = user.patientId; 

        if (!patientIdForQuery) {
          console.warn("Patient ID not found for current user. Cannot fetch X-rays.");
          setLoading(false);
          return;
        }

        const xraysQuery = query(
          collection(db, 'xrays'),
          where('patientId', '==', patientIdForQuery),
          orderBy('uploadedAt', 'desc')
        );
        const xraysSnapshot = await getDocs(xraysQuery);
        const patientXrays: XRayRecord[] = xraysSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as XRayRecord[];

        // Calculate stats
        const totalReports = patientXrays.length;
        const pendingRequests = patientXrays.filter(xray => xray.status === 'pending').length;
        
        const latestAnalyzedXray = patientXrays.find(xray => xray.status === 'analyzed' || xray.status === 'reviewed');
        const latestResult = latestAnalyzedXray?.aiAnalysis?.condition 
          ? CONDITIONS_METADATA[latestAnalyzedXray.aiAnalysis.condition].label 
          : 'N/A';

        setStats({
          totalReports,
          upcomingAppointments: 0, // Still a placeholder
          latestResult,
          pendingRequests,
        });

        // Set recent X-rays (limit to 3 for display, showing analyzed or reviewed)
        setRecentXrays(patientXrays.filter(xray => xray.status === 'analyzed' || xray.status === 'reviewed').slice(0, 3));

      } catch (error) {
        console.error('Error fetching patient dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [user, db]);

  const dashboardStats = [
    { title: 'Total Reports', value: stats.totalReports.toString(), icon: FileText, change: 'All time' },
    { title: 'Upcoming Appointments', value: stats.upcomingAppointments.toString(), icon: Calendar, change: 'Next 30 days' },
    { title: 'Latest Result', value: stats.latestResult, icon: Activity, change: 'Recently analyzed' },
    { title: 'Pending Requests', value: stats.pendingRequests.toString(), icon: Clock, change: 'In progress' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patient Dashboard</h2>
        <p className="text-muted-foreground">View your medical reports and request new scans</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
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
            <CardTitle>Recent X-ray Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentXrays.length === 0 ? (
              <p className="text-muted-foreground text-center">No recent X-ray results found.</p>
            ) : (
              <div className="space-y-3">
                {recentXrays.map((record) => (
                  <Link to={`/reports?reportId=${record.id}`} key={record.id} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div>
                        <p className="font-medium">
                          {record.aiAnalysis?.condition ? CONDITIONS_METADATA[record.aiAnalysis.condition].label : 'X-ray Scan'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(record.uploadedAt as Timestamp)?.toDate().toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.aiAnalysis?.condition && CONDITIONS_METADATA[record.aiAnalysis.condition].severity === 'high' ? 'bg-destructive/20 text-destructive' :
                        record.aiAnalysis?.condition && CONDITIONS_METADATA[record.aiAnalysis.condition].severity === 'medium' ? 'bg-accent/20 text-accent' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {record.aiAnalysis?.condition ? CONDITIONS_METADATA[record.aiAnalysis.condition].label : 'N/A'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/upload-request" className="block">
                <button className="w-full p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left">
                  <p className="font-medium">Request New X-ray</p>
                  <p className="text-sm text-muted-foreground">Schedule a new scan</p>
                </button>
              </Link>
              <Link to="/reports" className="block">
                <button className="w-full p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left">
                  <p className="font-medium">View All Reports</p>
                  <p className="text-sm text-muted-foreground">Access your medical history</p>
                </button>
              </Link>
              <button className="w-full p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left">
                <p className="font-medium">Contact Doctor</p>
                <p className="text-sm text-muted-foreground">Get medical consultation</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;