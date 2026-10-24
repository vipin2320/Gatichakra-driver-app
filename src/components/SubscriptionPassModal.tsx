import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  Clock, 
  Calendar, 
  Zap, 
  Award, 
  IndianRupee, 
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { SUBSCRIPTION_PASS_PLANS, SubscriptionPass, ActiveDriverPass } from '../models/subscription';
import { Language } from '../translations';

interface SubscriptionPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePass: ActiveDriverPass | null;
  onBuyPass: (pass: SubscriptionPass, paymentMethod: 'upi' | 'wallet' | 'cash') => Promise<void>;
  language?: Language;
}

export const SubscriptionPassModal: React.FC<SubscriptionPassModalProps> = ({
  isOpen,
  onClose,
  activePass,
  onBuyPass,
  language = 'hi'
}) => {
  const [selectedPassId, setSelectedPassId] = useState<string>('weekly_pro');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'wallet' | 'cash'>('upi');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [purchaseSuccessToast, setPurchaseSuccessToast] = useState<string>('');

  if (!isOpen) return null;

  const isHindi = language === 'hi';
  const selectedPass = SUBSCRIPTION_PASS_PLANS.find(p => p.id === selectedPassId) || SUBSCRIPTION_PASS_PLANS[1];

  const handlePurchase = async () => {
    setIsSubmitting(true);
    try {
      await onBuyPass(selectedPass, paymentMethod);
      setPurchaseSuccessToast(
        isHindi 
          ? `बधाई हो! ${selectedPass.name} सफलतापूर्वक सक्रिय हो गया!` 
          : `Congratulations! ${selectedPass.name} is now active!`
      );
      setTimeout(() => {
        setPurchaseSuccessToast('');
        onClose();
      }, 1800);
    } catch (e: any) {
      console.error("Pass purchase error:", e);
      alert(isHindi ? "पास सक्रिय करने में त्रुटि आई।" : "Failed to activate pass.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto animate-fade-in p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-[#2a2a2a] border-t-2 border-t-[#FF4500] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF4500] to-amber-500 text-white flex items-center justify-center shadow-lg shadow-[#FF4500]/25">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{isHindi ? 'गतिचक्र सारथी सब्सक्रिप्शन पास' : 'GatiChakra Sarthi Pass'}</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  PRO
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {isHindi ? '0% कमीशन पर 100% कमाई आपकी जेब में' : 'Zero commission, 100% earnings in your pocket'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#202020] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Pass Banner if driver already has one */}
        {activePass && activePass.status === 'active' && (
          <div className="bg-gradient-to-r from-emerald-950/70 to-[#122416] border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Check size={18} />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-300 block">
                  {isHindi ? 'सक्रिय पास (Active Pass)' : 'Currently Active Pass'}
                </span>
                <p className="text-[11px] text-white font-bold">{activePass.passName}</p>
                <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  <span>
                    {isHindi ? 'वैधता:' : 'Valid until:'} {new Date(activePass.expiresAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-1 rounded-full uppercase tracking-wider">
              {isHindi ? 'सक्रिय' : 'ACTIVE'}
            </span>
          </div>
        )}

        {/* Success Toast */}
        {purchaseSuccessToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span>{purchaseSuccessToast}</span>
          </div>
        )}

        {/* Ola/Uber Style Comparison Bar */}
        <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#272727] grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 bg-[#202020] rounded-xl border border-red-900/30">
            <span className="text-gray-400 block text-[10px] font-bold">सामान्य ऐप (Ola/Uber)</span>
            <span className="text-red-400 font-black text-sm">20% - 25%</span>
            <span className="text-[9px] text-gray-500 block">हर राइड पर भारी कमीशन</span>
          </div>
          <div className="p-2 bg-gradient-to-b from-[#FF4500]/15 to-transparent rounded-xl border border-[#FF4500]/40">
            <span className="text-amber-400 block text-[10px] font-black flex items-center justify-center gap-1">
              <Zap size={10} /> गतिचक्र पास
            </span>
            <span className="text-emerald-400 font-black text-sm">₹0 कमीशन (100% लाभ)</span>
            <span className="text-[9px] text-emerald-300/80 block">पूरी कमाई आपकी</span>
          </div>
        </div>

        {/* Subscription Plans List */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-gray-300 px-1 block flex items-center justify-between">
            <span>{isHindi ? 'अपनी पसंद का पास चुनें:' : 'Select your subscription plan:'}</span>
            <span className="text-[10px] text-amber-400 font-normal">असीमित राइड्स</span>
          </label>

          {SUBSCRIPTION_PASS_PLANS.map((plan) => {
            const isSelected = selectedPassId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPassId(plan.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#201510] to-[#1a1715] border-[#FF4500] shadow-lg shadow-[#FF4500]/10'
                    : 'bg-[#181818] border-[#292929] hover:border-[#383838]'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Sparkles size={10} /> {isHindi ? 'चालकों की पहली पसंद' : 'MOST POPULAR'}
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-gray-600'
                      }`}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </span>
                      <h4 className="text-sm font-black text-white">{plan.name}</h4>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-1 pl-6 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2 pl-6">
                      {plan.features.slice(0, 2).map((feat, i) => (
                        <span key={i} className="text-[10px] bg-[#222] text-gray-300 px-2 py-0.5 rounded-md border border-[#303030] flex items-center gap-1">
                          <Check size={10} className="text-emerald-400" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#FF4500] flex items-center justify-end">
                      <IndianRupee size={15} />
                      <span>{plan.price}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 line-through">₹{plan.originalPrice}</div>
                    <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 mt-0.5">
                      {plan.discountPercent}% OFF
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Method Selector */}
        <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#272727] space-y-2">
          <span className="text-xs font-bold text-gray-300 block">
            {isHindi ? 'भुगतान का तरीका (Payment Mode):' : 'Select Payment Method:'}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upi', label: 'UPI / PhonePe', icon: Zap },
              { id: 'wallet', label: isHindi ? 'कमाई वॉलेट' : 'Wallet', icon: IndianRupee },
              { id: 'cash', label: isHindi ? 'ऑफिस / कैश' : 'Cash Counter', icon: ShieldCheck },
            ].map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  paymentMethod === method.id
                    ? 'bg-[#FF4500]/20 border-[#FF4500] text-white shadow-sm'
                    : 'bg-[#202020] border-[#303030] text-gray-400 hover:text-white'
                }`}
              >
                <method.icon size={15} className={paymentMethod === method.id ? 'text-[#FF4500]' : 'text-gray-400'} />
                <span className="text-[11px] line-clamp-1">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handlePurchase}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#FF4500] to-[#e03a00] hover:from-[#e03a00] hover:to-[#c83200] text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-[#FF4500]/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{isHindi ? 'पास सक्रिय किया जा रहा है...' : 'Activating Pass...'}</span>
            </div>
          ) : (
            <>
              <Crown size={18} />
              <span>
                {isHindi 
                  ? `₹${selectedPass.price} में अभी पास लें (${selectedPass.name.split(' ')[0]})` 
                  : `Get Pass for ₹${selectedPass.price} Now`}
              </span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Micro-guarantee Footer */}
        <p className="text-[10px] text-gray-500 text-center leading-relaxed">
          🔒 {isHindi ? 'सुरक्षित भुगतान। पास सक्रिय होते ही तुरंत 0% कमीशन पर राइड्स शुरू करें।' : 'Safe & Instant activation. Enjoy 0% commission on every ride immediately.'}
        </p>
      </div>
    </div>
  );
};
