import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from '../../features/splash/SplashScreen';
import LoginScreen from '../../features/authentication/LoginScreen';
import ProfileScreen from '../../features/driver_onboarding/ProfileScreen';
import VehicleScreen from '../../features/driver_onboarding/VehicleScreen';
import DocumentsScreen from '../../features/driver_onboarding/DocumentsScreen';
import ReviewScreen from '../../features/driver_onboarding/ReviewScreen';
import PendingApprovalScreen from '../../features/driver_onboarding/PendingApprovalScreen';
import DashboardScreen from '../../features/dashboard/DashboardScreen';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';

// Auth Guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Approval Guard for Dashboard access
function RequireApproval({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { profile, fetchProfile, isLoading: isDriverLoading } = useDriverStore();

  useEffect(() => {
    if (user?.uid && !profile) {
      fetchProfile(user.uid);
    }
  }, [user, profile, fetchProfile]);

  if (isAuthLoading || (isAuthenticated && isDriverLoading && !profile)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!profile?.isApproved || profile?.approvalStatus !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Protected Onboarding Routes */}
        <Route path="/profile" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
        <Route path="/vehicle" element={<RequireAuth><VehicleScreen /></RequireAuth>} />
        <Route path="/documents" element={<RequireAuth><DocumentsScreen /></RequireAuth>} />
        <Route path="/review" element={<RequireAuth><ReviewScreen /></RequireAuth>} />
        <Route path="/pending-approval" element={<RequireAuth><PendingApprovalScreen /></RequireAuth>} />

        {/* Protected Approved Driver Dashboard Route */}
        <Route path="/dashboard" element={<RequireApproval><DashboardScreen /></RequireApproval>} />

        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
