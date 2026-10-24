import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storage.service';

interface UpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  initialUpiId: string;
  initialQrCodeUrl: string;
  onSave: (upiId: string, qrCodeUrl: string) => Promise<void>;
}

export const UpiModal: React.FC<UpiModalProps> = ({
  isOpen,
  onClose,
  driverId,
  initialUpiId,
  initialQrCodeUrl,
  onSave
}) => {
  const [upiId, setUpiId] = useState(initialUpiId);
  const [qrCodeUrl, setQrCodeUrl] = useState(initialQrCodeUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG).');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const url = await StorageService.uploadDocument(
        driverId || 'temp_driver',
        'additional',
        file,
        (progress) => setUploadProgress(progress)
      );
      setQrCodeUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload QR code. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onSave(upiId, qrCodeUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] rounded-2xl w-full max-w-md overflow-hidden border border-[#333] shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="text-lg font-bold text-white">Payment & Bank (UPI)</h2>
          <button onClick={onClose} className="p-2 bg-[#222] rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* UPI ID Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">My UPI ID (VPA)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. 9876543210@paytm"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">Directly receive payments from customers.</p>
          </div>

          {/* QR Code Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">My QR Code Scanner</label>
            
            {qrCodeUrl ? (
              <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-white rounded-xl p-2 border border-gray-200">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setQrCodeUrl('')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative w-full border-2 border-dashed border-[#444] hover:border-amber-500 rounded-xl bg-[#1A1A1A] transition-colors group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-amber-500 font-medium">Uploading {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors mb-3">
                        <Upload size={20} />
                      </div>
                      <p className="text-sm text-white font-medium mb-1">Upload QR Code Image</p>
                      <p className="text-xs text-gray-500">Tap here to select a gallery image</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222] bg-[#151515]">
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                Save Payment Details
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
