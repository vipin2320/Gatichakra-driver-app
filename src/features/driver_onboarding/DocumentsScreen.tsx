import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDocumentStore } from '../../providers/documentProvider';
import { DocType } from '../../services/storage.service';
import { Button } from '../../widgets/Button';
import { Card } from '../../widgets/Card';
import { FileText, CheckCircle2, Upload, AlertCircle, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { cn } from '../../core/utils/cn';

export default function DocumentsScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    documents,
    subscribeToDocuments,
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
  } = useDocumentStore();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToDocuments(user.uid);
    return () => unsubscribe();
  }, [user, subscribeToDocuments]);

  const documentItems: Array<{
    type: DocType;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    url?: string;
  }> = [
    {
      type: 'profile',
      title: 'Driver Photo',
      subtitle: 'Clear front-facing photo',
      icon: <User className="text-sky-500" size={24} />,
      url: documents?.profilePhotoUrl,
    },
    {
      type: 'driving_license',
      title: 'Driving License',
      subtitle: 'Upload valid Commercial/Light Vehicle License',
      icon: <FileText className="text-emerald-500" size={24} />,
      url: documents?.drivingLicenseUrl,
    },
    {
      type: 'vehicle_rc',
      title: 'Vehicle RC',
      subtitle: 'Vehicle Registration Certificate',
      icon: <FileText className="text-amber-500" size={24} />,
      url: documents?.vehicleRcUrl,
    },
    {
      type: 'additional',
      title: 'Additional Document',
      subtitle: 'Identity Proof / Aadhaar / Vehicle Insurance',
      icon: <ShieldCheck className="text-purple-500" size={24} />,
      url: documents?.additionalDocumentUrl,
    },
  ];

  const handleFileUpload = async (type: DocType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    await uploadDocument(user.uid, type, file);
  };

  const allRequiredUploaded =
    !!documents?.profilePhotoUrl &&
    !!documents?.drivingLicenseUrl &&
    !!documents?.vehicleRcUrl &&
    !!documents?.additionalDocumentUrl;

  const anyUploading = Object.values(isUploading).some(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Document Upload</h1>
        <p className="text-sm text-slate-500">Step 3 of 4 — Verification Documents</p>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full space-y-4">
        {documentItems.map((item) => {
          const uploading = isUploading[item.type];
          const progress = uploadProgress[item.type];
          const error = uploadError[item.type];
          const isUploaded = !!item.url;

          return (
            <Card key={item.type} className="p-4 flex flex-col space-y-3 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                </div>

                <div>
                  {isUploaded ? (
                    <div className="flex items-center text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <CheckCircle2 size={16} className="mr-1.5" /> Uploaded
                    </div>
                  ) : uploading ? (
                    <div className="text-xs text-sky-600 font-semibold bg-sky-50 px-3 py-1.5 rounded-full flex items-center">
                      <RefreshCw size={14} className="animate-spin mr-1.5" /> Uploading...
                    </div>
                  ) : (
                    <label className="inline-flex items-center justify-center px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-sky-600 transition-colors shadow-sm">
                      <Upload size={14} className="mr-1.5" /> Select File
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(item.type, e)}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Uploading progress bar */}
              {uploading && (
                <div className="w-full space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Compressing & Uploading</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload error with Retry */}
              {error && (
                <div className="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-200 text-xs text-red-600">
                  <div className="flex items-center mr-2">
                    <AlertCircle size={14} className="mr-1.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <label className="text-xs font-bold underline cursor-pointer hover:text-red-800 flex-shrink-0">
                    Retry
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(item.type, e)}
                    />
                  </label>
                </div>
              )}
            </Card>
          );
        })}

        <div className="pt-6">
          <Button
            className="w-full"
            size="lg"
            disabled={!allRequiredUploaded || anyUploading}
            onClick={() => navigate('/review')}
          >
            Proceed to Review & Submit
          </Button>

          {!allRequiredUploaded && (
            <p className="text-center text-xs text-slate-500 mt-2">
              Please upload all 4 required documents to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
