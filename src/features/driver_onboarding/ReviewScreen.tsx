import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { useDocumentStore } from '../../providers/documentProvider';
import { DriverRepository } from '../../repositories/driver.repository';
import { DocumentRepository } from '../../repositories/document.repository';
import { Button } from '../../widgets/Button';
import { Card } from '../../widgets/Card';
import { User, Car, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ReviewScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useDriverStore();
  const { documents, fetchDocuments } = useDocumentStore();

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
      fetchDocuments(user.uid);
    }
  }, [user, fetchProfile, fetchDocuments]);

  const hasName = !!profile?.name && profile.name.trim().length >= 2;
  const hasPhone = !!profile?.phone && profile.phone.trim().length >= 5;
  const hasVehicleType = !!profile?.vehicleType;
  const hasVehicleNumber = !!profile?.vehicleNumber && profile.vehicleNumber.trim().length >= 4;
  const hasPhoto = !!(profile?.profilePhotoUrl || documents?.profilePhotoUrl);
  const hasDL = !!documents?.drivingLicenseUrl;
  const hasRC = !!documents?.vehicleRcUrl;
  const hasAdditional = !!documents?.additionalDocumentUrl;

  const isValidToSubmit =
    hasName &&
    hasPhone &&
    hasVehicleType &&
    hasVehicleNumber &&
    hasPhoto &&
    hasDL &&
    hasRC &&
    hasAdditional;

  const handleSubmit = async () => {
    if (!user) return;

    if (!isValidToSubmit) {
      setValidationError('Please complete all missing required profile, vehicle, and document details before submitting.');
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      // Set approvalStatus = 'pending' and isApproved = false in drivers collection
      await DriverRepository.submitVerification(user.uid);

      // Set verificationStatus = 'pending' in driverDocuments collection
      await DocumentRepository.submitForVerification(user.uid, {
        profilePhotoUrl: profile?.profilePhotoUrl || documents?.profilePhotoUrl,
        drivingLicenseUrl: documents?.drivingLicenseUrl,
        vehicleRcUrl: documents?.vehicleRcUrl,
        additionalDocumentUrl: documents?.additionalDocumentUrl,
      });

      navigate('/pending-approval', { replace: true });
    } catch (err: any) {
      setValidationError(err.message || 'Verification submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Review & Submit</h1>
        <p className="text-sm text-slate-500">Step 4 of 4 — Final Verification Review</p>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full space-y-4">
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start space-x-3">
          <ShieldCheck className="text-sky-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-sky-800 leading-relaxed">
            Please review your information carefully before submitting. Your application will be evaluated by an authorized admin.
          </p>
        </div>

        {/* Profile Details Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center">
              <User size={18} className="text-sky-500 mr-2" /> Driver Profile
            </h3>
            <button
              onClick={() => navigate('/profile')}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-slate-700">
              <span className="font-medium text-slate-500">Name:</span> {profile?.name || 'Not provided'}
            </p>
            <p className="text-slate-700">
              <span className="font-medium text-slate-500">Phone:</span> {profile?.phone || 'Not provided'}
            </p>
          </div>
        </Card>

        {/* Vehicle Details Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Car size={18} className="text-emerald-500 mr-2" /> Vehicle Information
            </h3>
            <button
              onClick={() => navigate('/vehicle')}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-slate-700">
              <span className="font-medium text-slate-500">Category:</span>{' '}
              <span className="uppercase font-semibold text-sky-700">
                {profile?.vehicleType?.replace('_', ' ') || 'Not selected'}
              </span>
            </p>
            <p className="text-slate-700">
              <span className="font-medium text-slate-500">Registration Number:</span>{' '}
              <span className="font-bold text-slate-900">{profile?.vehicleNumber || 'Not provided'}</span>
            </p>
            {profile?.vehicleModel && (
              <p className="text-slate-700">
                <span className="font-medium text-slate-500">Model:</span> {profile.vehicleModel}
              </p>
            )}
          </div>
        </Card>

        {/* Documents Status Card */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center">
              <FileText size={18} className="text-amber-500 mr-2" /> Documents Status
            </h3>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Driver Photo</span>
              {hasPhoto ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 size={14} className="mr-1" /> Uploaded
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Driving License</span>
              {hasDL ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 size={14} className="mr-1" /> Uploaded
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Vehicle RC</span>
              {hasRC ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 size={14} className="mr-1" /> Uploaded
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Additional Document</span>
              {hasAdditional ? (
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 size={14} className="mr-1" /> Uploaded
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Missing</span>
              )}
            </div>
          </div>
        </Card>

        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2 text-red-600 text-xs">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="pt-4 pb-8">
          <Button
            className="w-full"
            size="lg"
            disabled={!isValidToSubmit || isLoading}
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            Submit for Verification
          </Button>
        </div>
      </div>
    </div>
  );
}
