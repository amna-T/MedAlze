import { useAuth } from '@/contexts/AuthContext';
// Removed Layout and Navigation imports
import RadiologistDashboard from '@/components/dashboards/RadiologistDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/components/dashboards/PatientDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard'; // Import AdminDashboard

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'radiologist':
        return <RadiologistDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'patient':
        return <PatientDashboard />;
      case 'admin': // Render AdminDashboard for admin role
        return <AdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <>
      {renderDashboard()}
    </>
  );
};

export default Dashboard;