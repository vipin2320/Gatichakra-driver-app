import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { useDocumentStore } from '../../providers/documentProvider';
import { computeOnboardingState } from '../../providers/onboardingState';
import { motion } from 'motion/react';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { profile, fetchProfile, isLoading: profileLoading } = useDriverStore();
  const { documents, fetchDocuments, isLoading: docsLoading } = useDocumentStore();

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
        setTimeout(() => navigate('/login', { replace: true }), 1500);
        return;
      }

      await Promise.all([
        fetchProfile(user.uid),
        fetchDocuments(user.uid),
      ]);
    };
    init();
  }, [authLoading, isAuthenticated, user, fetchProfile, fetchDocuments, navigate]);

  useEffect(() => {
    if (authLoading || profileLoading || docsLoading || !isAuthenticated) return;

    const state = computeOnboardingState(profile, documents);

    switch (state) {
      case 'profileIncomplete':
        navigate('/profile', { replace: true });
        break;
      case 'vehicleIncomplete':
        navigate('/vehicle', { replace: true });
        break;
      case 'documentsIncomplete':
        navigate('/documents', { replace: true });
        break;
      case 'readyForSubmission':
        navigate('/review', { replace: true });
        break;
      case 'pendingVerification':
      case 'rejected':
        navigate('/pending-approval', { replace: true });
        break;
      case 'approved':
        navigate('/dashboard', { replace: true });
        break;
    }
  }, [profile, documents, authLoading, profileLoading, docsLoading, isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl">
          <span className="text-sky-500 font-bold text-4xl">G</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wide">GatiChakra Driver</h1>
        <p className="text-sky-100 text-sm mt-2 font-medium">Driver Portal</p>
      </motion.div>
    </div>
  );
}
