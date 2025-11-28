import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/Layout';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import PatientDashboard from '@/pages/PatientDashboard';
import RadiologistDashboard from '@/components/dashboards/RadiologistDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import AdminPatientManagement from '@/pages/AdminPatientManagement';
import PatientDetails from '@/pages/PatientDetails';
import ProtectedRoute from '@/components/ProtectedRoute';
import UploadXray from '@/pages/UploadXray';
import Reports from '@/pages/Reports';
import Patients from '@/pages/Patients';
import UploadRequest from '@/pages/UploadRequest';
import Prescriptions from '@/pages/Prescriptions';
import Profile from '@/pages/Profile';
import RoleBasedDashboardRedirect from '@/components/RoleBasedDashboardRedirect';
import AppointmentManagement from '@/pages/AppointmentManagement';
import CompleteProfile from '@/pages/CompleteProfile';
import VerifyEmail from '@/pages/VerifyEmail'; // Temporary import for debugging

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <RoleBasedDashboardRedirect />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <RoleBasedDashboardRedirect />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctor-dashboard',
        element: (
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patient-dashboard',
        element: (
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/radiologist-dashboard',
        element: (
          <ProtectedRoute allowedRoles={['radiologist']}>
            <RadiologistDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin-dashboard',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patient-management',
        element: (
          <ProtectedRoute allowedRoles={['radiologist', 'admin']}>
            <AdminPatientManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patients/:patientId',
        element: (
          <ProtectedRoute allowedRoles={['doctor', 'radiologist', 'admin']}>
            <PatientDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/upload-xray',
        element: (
          <ProtectedRoute allowedRoles={['radiologist']}>
            <UploadXray />
          </ProtectedRoute>
        ),
      },
      {
        path: '/upload-request',
        element: (
          <ProtectedRoute allowedRoles={['doctor', 'patient']}>
            <UploadRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patients',
        element: (
          <ProtectedRoute allowedRoles={['doctor', 'radiologist', 'admin']}>
            <Patients />
          </ProtectedRoute>
        ),
      },
      {
        path: '/prescriptions',
        element: (
          <ProtectedRoute allowedRoles={['doctor', 'patient']}>
            <Prescriptions />
          </ProtectedRoute>
        ),
      },
      {
        path: '/appointments',
        element: (
          <ProtectedRoute allowedRoles={['radiologist', 'admin']}>
            <AppointmentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/complete-profile',
        element: (
          <ProtectedRoute allowedRoles={['pending_role_selection']}>
            <CompleteProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/verify-email', // Temporary route for debugging
    element: <VerifyEmail />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;