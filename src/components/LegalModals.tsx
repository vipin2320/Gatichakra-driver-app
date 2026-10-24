import React from 'react';
import { ShieldCheck, Lock, FileText, X, AlertTriangle, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { LEGAL_TERMS_OF_SERVICE, LEGAL_PRIVACY_POLICY } from '../legalContent';
import { Language } from '../translations';

interface LegalModalsProps {
  type: 'terms' | 'privacy' | 'disclaimer' | 'deleteAccount' | null;
  language: Language;
  onClose: () => void;
  onAccept?: () => void;
  isAccepted?: boolean;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  type,
  language,
  onClose,
  onAccept,
  isAccepted
}) => {
  if (!type) return null;

  const isHindi = language === 'hi';

  if (type === 'deleteAccount') {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto animate-fade-in p-4">
        <div className="bg-[#181818] border-t-2 border-red-500 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {isHindi ? 'खाता व डेटा हटाने का अनुरोध' : 'Request Account Deletion'}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isHindi ? 'DPDP Act 2023 के तहत अधिकार' : 'Right to Erasure under DPDP Act'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#252525] text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-red-950/30 border border-red-900/40 p-3.5 rounded-xl text-xs text-red-200 leading-relaxed space-y-2">
            <p>
              {isHindi
                ? 'यदि आप अपना चालक खाता और व्यक्तिगत डेटा (मोबाइल नंबर, दस्तावेज व राइड हिस्ट्री) हमेशा के लिए हटाना चाहते हैं, तो यह कार्रवाई अपरिवर्तनीय होगी।'
                : 'Requesting deletion will permanently erase your driver profile, vehicle documents, and personal identifiers from active databases.'}
            </p>
            <p className="text-[11px] text-gray-300">
              {isHindi
                ? 'नियामक ऑडिट और मोटर वाहन अधिनियम के तहत पूर्ण यात्रा रिकॉर्ड अनिवार्य कानूनी अवधि तक एन्क्रिप्टेड रखे जा सकते हैं।'
                : 'Statutory trip logs may be archived securely as required by applicable motor vehicle regulations.'}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-[#252525] hover:bg-[#303030] text-gray-300 py-3 rounded-xl text-xs font-bold transition-all"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/30"
            >
              {isHindi ? 'हटाने का अनुरोध भेजें' : 'Confirm Deletion'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'disclaimer') {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto animate-fade-in p-4">
        <div className="bg-[#181818] border-t-2 border-amber-500 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {isHindi ? 'SaaS मध्यस्थ डिस्क्लेमर' : 'SaaS Intermediary Disclaimer'}
                </h3>
                <p className="text-[11px] text-gray-400">
                  {isHindi ? 'IT Act 2000 धारा 79 एवं मोटर वाहन नियम' : 'Safe Harbor & Platform Role'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#252525] text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-gray-300 leading-relaxed">
            <div className="bg-[#202020] p-3.5 rounded-xl border border-[#333] space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                <span>{isHindi ? '1. सॉफ़्टवेयर सुविधा प्रदाता (Software Provider Only)' : '1. Technology Enabler Only'}</span>
              </div>
              <p>
                {isHindi
                  ? 'गतिचक्र (GatiChakra) कोई परिवहन या टैक्सी कंपनी नहीं है। यह स्वतंत्र चालकों और यात्रियों के बीच संपर्क स्थापित कराने वाला क्लाउड-आधारित सॉफ्टवेयर (SaaS Platform) है।'
                  : 'GatiChakra is not a transportation carrier or taxicab operator. It is a SaaS intermediary enabling peer-to-peer ride coordination.'}
              </p>
            </div>

            <div className="bg-[#202020] p-3.5 rounded-xl border border-[#333] space-y-2">
              <div className="font-bold text-white">
                {isHindi ? '2. चालकों का स्वतंत्र दायित्व (Driver Responsibility)' : '2. Independent Driver Liability'}
              </div>
              <p>
                {isHindi
                  ? 'सड़क पर सुरक्षित ड्राइविंग, आरटीओ नियमों का पालन, वाहन फिटनेस व बीमा बनाए रखना प्रत्येक चालक का निजी दायित्व है।'
                  : 'Drivers are independently licensed operators solely responsible for vehicular maintenance, road compliance, and passenger transit safety.'}
              </p>
            </div>

            <div className="bg-[#202020] p-3.5 rounded-xl border border-[#333] space-y-2">
              <div className="font-bold text-white">
                {isHindi ? '3. आपातकालीन सहायता (Emergency SOS)' : '3. Emergency Protocols'}
              </div>
              <p>
                {isHindi
                  ? 'ऐप में 24x7 पुलिस हेल्पलाइन (112) और एंबुलेंस (108) से सीधा संपर्क उपलब्ध है। किसी भी अप्रिय घटना में चालक या यात्री तुरंत स्थानीय पुलिस से संपर्क करें।'
                  : 'The app features instant 112/108 police and medical emergency dialing. For any on-road incident, local authorities must be contacted.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#252525] hover:bg-[#333] text-white py-3 rounded-xl text-xs font-bold transition-all border border-[#3a3a3a]"
          >
            {isHindi ? 'समझ लिया और बंद करें' : 'Understood & Close'}
          </button>
        </div>
      </div>
    );
  }

  const isTerms = type === 'terms';
  const data = isTerms ? LEGAL_TERMS_OF_SERVICE : LEGAL_PRIVACY_POLICY;
  const sections = isHindi ? data.sectionsHindi : data.sectionsEnglish;
  const title = isHindi ? data.titleHindi : data.titleEnglish;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto animate-fade-in p-2">
      <div className="bg-[#181818] border-t-2 border-[#FF4500] rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF4500]/20 text-[#FF4500] flex items-center justify-center">
              {isTerms ? <FileText size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white line-clamp-1">{title}</h3>
              <p className="text-[10px] text-gray-400">
                संस्करण {data.version} • अद्यतन: {data.lastUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#252525] text-gray-400 hover:text-white flex items-center justify-center shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1 text-xs text-gray-300">
          <div className="bg-[#202020] p-3 rounded-xl border border-[#333] flex items-center justify-between text-[11px]">
            <span className="text-gray-400">
              {isHindi ? 'स्थिति:' : 'Status:'}{' '}
              <strong className="text-emerald-400">
                {isAccepted ? (isHindi ? 'स्वीकृत है ✓' : 'Accepted ✓') : (isHindi ? 'स्वीकृति अपेक्षित' : 'Pending Acceptance')}
              </strong>
            </span>
            <span className="bg-[#2a2a2a] text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]">
              {isHindi ? 'कानूनी अनुबंध' : 'Legal Agreement'}
            </span>
          </div>

          {sections.map((sec, idx) => (
            <div key={idx} className="bg-[#1e1e1e] p-3.5 rounded-xl border border-[#2a2a2a] space-y-2">
              <h4 className="font-bold text-white text-xs text-[#FF4500]">
                {sec.title}
              </h4>
              <ul className="space-y-1.5 list-disc pl-4 text-gray-300 text-[11px] leading-relaxed">
                {sec.points.map((pt, pIdx) => (
                  <li key={pIdx}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Legal Safe Harbor Footer */}
          <div className="text-[10px] text-gray-500 text-center py-2">
            {isHindi
              ? 'गतिचक्र सारथी पार्टनर अनुबंध • भारतीय सूचना प्रौद्योगिकी अधिनियम 2000 व मोटर वाहन अधिनियम के तहत संरक्षित।'
              : 'GatiChakra Driver Partner Agreement • Governed by Information Technology Act 2000 and Motor Vehicles Act 1988.'}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#282828]">
          <button
            onClick={onClose}
            className="flex-1 bg-[#242424] hover:bg-[#2d2d2d] text-gray-300 py-3 rounded-xl text-xs font-bold transition-all border border-[#333]"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
          
          {onAccept && !isAccepted && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="flex-1 bg-[#FF4500] hover:bg-[#e03a00] text-white py-3 rounded-xl text-xs font-black transition-all shadow-lg shadow-[#FF4500]/30 flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={15} />
              <span>{isHindi ? 'स्वीकार करें' : 'Accept Terms'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
