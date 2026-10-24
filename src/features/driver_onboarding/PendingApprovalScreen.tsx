import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { useDocumentStore } from '../../providers/documentProvider';
import { AdminNotificationRepository } from '../../repositories/adminNotification.repository';
import { Card } from '../../widgets/Card';
import { Button } from '../../widgets/Button';
import {
  Clock,
  AlertCircle,
  RefreshCw,
  LogOut,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';

export default function PendingApprovalScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { profile, subscribeToProfile, fetchProfile, approveForDemo } = useDriverStore();
  const { documents, subscribeToDocuments, fetchDocuments } = useDocumentStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  // Admin Message state
  const [showAdminMsg, setShowAdminMsg] = useState(false);
  const [adminMsgText, setAdminMsgText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubDriver = subscribeToProfile(user.uid);
    const unsubDocs = subscribeToDocuments(user.uid);
    return () => {
      unsubDriver();
      unsubDocs();
    };
  }, [user, subscribeToProfile, subscribeToDocuments]);

  // Handle live state transitions to Dashboard
  useEffect(() => {
    if (profile?.isApproved && profile?.approvalStatus === 'approved') {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    await Promise.all([fetchProfile(user.uid), fetchDocuments(user.uid)]);
    setIsRefreshing(false);
  };

  const handleDemoAutoApprove = async () => {
    if (!user) return;
    setIsApproving(true);
    await approveForDemo(user.uid);
    setIsApproving(false);
    navigate('/dashboard', { replace: true });
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !adminMsgText.trim()) return;

    setIsSendingMsg(true);
    const success = await AdminNotificationRepository.sendNotification(
      user.uid,
      profile?.name || 'Driver',
      profile?.phone || 'N/A',
      adminMsgText.trim(),
      'missing_details'
    );
    setIsSendingMsg(false);

    if (success) {
      setMsgSentSuccess(true);
      setAdminMsgText('');
      setTimeout(() => setMsgSentSuccess(false), 3000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isRejected = profile?.approvalStatus === 'rejected';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full my-auto">
        <Card elevated className="p-6 text-center flex flex-col items-center">
          {isRejected ? (
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={40} className="text-red-500" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-4 animate-pulse">
              <Clock size={40} className="text-amber-500" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isRejected ? 'Verification Requires Attention' : 'Verification Pending'}
          </h1>

          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {isRejected
              ? profile?.approvalReason || 'Your submitted verification requires updates. Please check the details below.'
              : 'Your documents have been submitted and are currently under review by our team.'}
          </p>

          {/* Submitted Application Summary Card */}
          <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 text-left mb-6 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Submitted Application Summary
            </h3>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Driver Name:</span>
              <span className="font-semibold text-slate-800">{profile?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-800">{profile?.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Vehicle Category:</span>
              <span className="font-semibold text-sky-700 uppercase">
                {profile?.vehicleType?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Registration Number:</span>
              <span className="font-bold text-slate-900">{profile?.vehicleNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500">Documents Status:</span>
              <span className="font-semibold text-amber-600 flex items-center">
                <FileCheck size={14} className="mr-1" /> Submitted
              </span>
            </div>
          </div>

          {/* Send Message / Notify Admin Section */}
          <div className="w-full mb-6 text-left">
            <button
              type="button"
              onClick={() => setShowAdminMsg(!showAdminMsg)}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-slate-700 text-xs font-semibold transition-colors"
            >
              <span className="flex items-center">
                <MessageSquare size={16} className="mr-2 text-sky-600" />
                Notify Admin About Missing Details
              </span>
              <span className="text-slate-400 font-extrabold">{showAdminMsg ? '▲' : '▼'}</span>
            </button>

            {showAdminMsg && (
              <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                {msgSentSuccess ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center">
                    <CheckCircle2 size={16} className="mr-2 text-emerald-600" />
                    Message sent to Admin successfully!
                  </div>
                ) : (
                  <form onSubmit={handleSendAdminMessage} className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder="Write a message to Admin regarding missing details..."
                      value={adminMsgText}
                      onChange={(e) => setAdminMsgText(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      required
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={isSendingMsg}
                        disabled={!adminMsgText.trim()}
                        className="bg-sky-600 text-white text-xs"
                      >
                        <Send size={12} className="mr-1" /> Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {isRejected ? (
            <div className="w-full space-y-3">
              <Button
                className="w-full"
                size="md"
                onClick={() => navigate('/profile')}
              >
                Update Details <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="md"
                onClick={() => navigate('/review')}
              >
                Resubmit Application
              </Button>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                size="md"
                isLoading={isRefreshing}
                onClick={handleRefresh}
              >
                <RefreshCw size={16} className="mr-2" /> Refresh Status
              </Button>
              <button
                type="button"
                onClick={handleDemoAutoApprove}
                disabled={isApproving}
                className="text-xs text-sky-600 font-medium hover:underline flex items-center justify-center mx-auto pt-1"
              >
                <Sparkles size={12} className="mr-1 text-amber-500" />
                {isApproving ? 'Approving...' : 'Demo Mode: Bypass & Open Dashboard'}
              </button>
            </div>
          )}

          <Button
            variant="ghost"
            className="mt-6 text-slate-500 text-xs w-full"
            onClick={handleLogout}
          >
            <LogOut size={14} className="mr-1.5" /> Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
}
