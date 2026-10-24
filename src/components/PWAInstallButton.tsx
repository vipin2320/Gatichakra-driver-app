import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, X, Share2, HelpCircle } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA, show a subtle active badge
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>GatiChakra Installed</span>
      </div>
    );
  }

  // Chromium / Android / Desktop standard install
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 bg-[#FF4500] hover:bg-[#e03d00] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-950/30 transition-all hover:scale-105 active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>ऐप इंस्टॉल करें (Install App)</span>
      </button>
    );
  }

  // Fallback Guide for all browsers / iOS
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-2 bg-[#222] hover:bg-[#2c2c2c] text-orange-400 border border-[#444] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
      >
        <Smartphone className="w-4 h-4 text-[#FF4500]" />
        <span>फोन में इंस्टॉल करें (Install APK)</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1A] border border-[#333] p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-[#FF4500] flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isIOS ? 'iPhone / iPad में इंस्टॉल करें' : 'Android फोन में इंस्टॉल करें'}
                  </h3>
                  <p className="text-[10px] text-gray-400">Direct 1-Tap Home Screen Setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#252525]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222] rounded-xl border border-[#333]">
                    <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <p>Safari ब्राउज़र के नीचे <strong>Share</strong> (<Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" />) बटन दबाएं।</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222] rounded-xl border border-[#333]">
                    <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <p>नीचे स्क्रॉल करके <strong>'Add to Home Screen' (होम स्क्रीन में जोड़ें)</strong> चुनें।</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222] rounded-xl border border-[#333]">
                    <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <p>Chrome ब्राउज़र के ऊपर कोने में <strong>3 डॉट्स (⋮)</strong> मेनू दबाएं।</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222] rounded-xl border border-[#333]">
                    <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <p><strong>'Install App'</strong> या <strong>'Add to Home screen'</strong> पर टैप करें।</p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#222] rounded-xl border border-[#333]">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                    <p className="text-emerald-300">ऐप आपके फोन में बिल्कुल असली Android APK की तरह इंस्टॉल हो जाएगा!</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-[#FF4500] hover:bg-[#e03d00] text-white py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              समझ गया (Got It)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
