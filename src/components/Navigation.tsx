import { useAuth, UserRole } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Users,
  ClipboardList,
  FileSearch,
  Shield,
  UserCog,
  CalendarCheck // Added CalendarCheck icon for Appointment Management
} from 'lucide-react';

const Navigation = () => {
  const { user } = useAuth();

  const commonTabs = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      roles: ['radiologist', 'doctor', 'patient', 'admin'] as UserRole[]
    },
    {
      to: '/upload-xray',
      icon: Upload,
      label: 'Upload X-ray',
      roles: ['radiologist'] as UserRole[]
    },
    {
      to: '/upload-request',
      icon: ClipboardList,
      label: 'Upload Request',
      roles: ['doctor', 'patient'] as UserRole[]
    },
    {
      to: '/reports',
      icon: FileText,
      label: 'Reports',
      roles: ['radiologist', 'doctor', 'patient', 'admin'] as UserRole[]
    },
    {
      to: '/patients',
      icon: Users,
      label: 'Patients',
      roles: ['doctor', 'radiologist', 'admin'] as UserRole[]
    },
    {
      to: '/patient-management',
      icon: UserCog,
      label: 'Patient Management',
      roles: ['radiologist', 'admin'] as UserRole[]
    },
    {
      to: '/appointments', // New navigation link
      icon: CalendarCheck,
      label: 'Appointments',
      roles: ['radiologist', 'admin'] as UserRole[]
    },
    {
      to: '/prescriptions',
      icon: FileSearch,
      label: 'Prescriptions',
      roles: ['doctor', 'patient'] as UserRole[]
    },
    {
      to: '/admin-dashboard',
      icon: Shield,
      label: 'Admin',
      roles: ['admin'] as UserRole[]
    }
  ];

  const tabs = user
    ? commonTabs.filter(tab => tab.roles.includes(user.role))
    : [];

  return (
    <nav className="mb-6">
      <div className="glass-card rounded-lg p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;