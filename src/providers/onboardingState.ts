import { Driver, DriverDocuments, OnboardingState } from '../models/types';

export function computeOnboardingState(
  driver: Driver | null,
  documents: DriverDocuments | null
): OnboardingState {
  if (!driver || !driver.name || !driver.phone) {
    return 'profileIncomplete';
  }

  if (!driver.vehicleType || !driver.vehicleNumber) {
    return 'vehicleIncomplete';
  }

  const hasProfilePhoto = !!(driver.profilePhotoUrl || documents?.profilePhotoUrl);
  const hasDL = !!documents?.drivingLicenseUrl;
  const hasRC = !!documents?.vehicleRcUrl;
  const hasAdditional = !!documents?.additionalDocumentUrl;

  const allDocsUploaded = hasProfilePhoto && hasDL && hasRC && hasAdditional;

  if (driver.isApproved && driver.approvalStatus === 'approved') {
    return 'approved';
  }

  if (driver.approvalStatus === 'rejected') {
    return 'rejected';
  }

  // If driver has submitted verification and is currently pending
  if (driver.approvalStatus === 'pending' && documents?.verificationStatus === 'pending' && allDocsUploaded) {
    return 'pendingVerification';
  }

  if (!allDocsUploaded) {
    return 'documentsIncomplete';
  }

  return 'readyForSubmission';
}
