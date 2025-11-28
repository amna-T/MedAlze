"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RoleBasedDashboardRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      let targetPath = '/login'; // Default fallback

      if (user.role === 'pending_role_selection') {
        targetPath = '/complete-profile';
      } else {
        switch (user.role) {
          case 'radiologist':
            targetPath = '/radiologist-dashboard';
            break;
          case 'doctor':
            targetPath = '/doctor-dashboard';
            break;
          case 'patient':
            targetPath = '/patient-dashboard';
            break;
          case 'admin':
            targetPath = '/admin-dashboard';
            break;
          default:
            // Should not happen if roles are well-defined
            console.warn(`RoleBasedDashboardRedirect: Unknown user role: ${user.role}. Redirecting to login.`);
            targetPath = '/login';
            break;
        }
      }
      console.log(`RoleBasedDashboardRedirect: User role: ${user.role}, Navigating to: ${targetPath}`);
      navigate(targetPath, { replace: true });
    } else if (!isLoading && !user) {
      console.log("RoleBasedDashboardRedirect: No user and not loading, navigating to /login.");
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // You can render a loading spinner here while the redirect happens
  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

export default RoleBasedDashboardRedirect;