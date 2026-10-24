const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetProfileStart = content.indexOf("{/* ================= TAB 4: PROFILE & SETTINGS ================= */}");
const targetProfileEnd = content.indexOf("{/* ================= INCOMING RIDE REQUEST OVERLAY MODAL ================= */}");

if (targetProfileStart !== -1 && targetProfileEnd !== -1) {
  const profileSection = content.substring(targetProfileStart, targetProfileEnd);
  
  const newProfileSection = `{/* ================= TAB 4: PROFILE & SETTINGS ================= */}
            {activeTab === 'profile' && (
              <div className="p-4 space-y-2 animate-fade-in pb-20">
                
                {/* 1. Header Card (Dark Theme, List Style Base) */}
                <div className="bg-[#161616] p-4 rounded-xl flex items-center justify-between mb-4 border border-[#252525]">
                  <div className="flex items-center gap-4">
                    <img 
                      src="https://i.pravatar.cc/150?img=11" 
                      alt={driverProfile?.name || "Driver"} 
                      className="w-14 h-14 rounded-full object-cover border border-[#333]"
                    />
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">{driverProfile?.name || "Driver"}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">+91 {driverProfile?.phone?.replace('+91', '') || phoneNumber || '9876543210'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Verified</span>
                        <span className="text-[10px] text-amber-400 font-bold">★ 4.8</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-600" />
                </div>

                {/* List Container */}
                <div className="bg-[#161616] rounded-xl border border-[#252525] overflow-hidden">
                  
                  {/* Vehicle Details */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer" onClick={() => {
                     // Add modal trigger logic for vehicle change if requested later
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <Car size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Vehicle Details</div>
                        <div className="text-[10px] text-gray-400">{driverProfile?.vehicleModel || "Vehicle"} • {driverProfile?.vehicleNumber || "No RC"}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* My Rides */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer" onClick={() => setActiveTab('rides')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <History size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">My Rides</div>
                        <div className="text-[10px] text-gray-400">View past trips and earnings</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Payment / Bank Details */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <Wallet size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Payment & Bank</div>
                        <div className="text-[10px] text-gray-400">Manage UPI ID and payouts</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Power Pass (Subscription) */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer" onClick={() => setShowSubscriptionModal(true)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Crown size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Power Pass</div>
                        <div className="text-[10px] text-amber-500/80">{activeDriverPass ? 'Active (0% Commission)' : 'Buy pass to save commissions'}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Safety & SOS */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                        <ShieldAlert size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Safety & SOS</div>
                        <div className="text-[10px] text-gray-400">Emergency contacts and alerts</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Refer and Earn */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Gift size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Refer and Earn</div>
                        <div className="text-[10px] text-blue-400/80">Get ₹50 for every referral</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Map Settings */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <Map size={15} />
                      </div>
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-bold text-white">Map Preferences</div>
                        <div className="text-[10px] text-gray-400">Mappls Key: {MapplsService.getApiKey() ? 'Active' : 'Missing'} | Voice: {mapNavLanguage === 'hi' ? 'Hindi' : 'English'}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Legal & Terms */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer" onClick={() => setActiveLegalModal('terms')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <FileText size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Legal & Compliance</div>
                        <div className="text-[10px] text-gray-400">Terms, Privacy, DPDP Act</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Help & Support */}
                  <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between hover:bg-[#202020] cursor-pointer" onClick={() => window.location.href = "tel:" + t.helplineNumber}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <HelpCircle size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Help & Support</div>
                        <div className="text-[10px] text-gray-400">24x7 Driver Helpline</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>

                  {/* Settings */}
                  <div className="px-4 py-3 flex items-center justify-between hover:bg-[#202020] cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center text-gray-300">
                        <Settings size={15} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">App Settings</div>
                        <div className="text-[10px] text-gray-400">Theme, Language, Cache</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                  
                </div>

                {/* Logout Button as a standalone card/list item */}
                <div className="bg-[#161616] rounded-xl border border-[#252525] overflow-hidden mt-4">
                  <div className="px-4 py-3.5 flex items-center justify-between hover:bg-red-950/20 cursor-pointer" onClick={async () => {
                      setIsOnline(false);
                      try {
                        await signOut(auth);
                      } catch (e) {}
                      localStorage.removeItem('gatichakra_driver_id');
                      localStorage.removeItem('gatichakra_driver_phone');
                      setDriverId('');
                      setIsOnboarding(true);
                      setOnboardingStep(1);
                      setAuthOtp('');
                      setConfirmationResult(null);
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                        <LogOut size={15} />
                      </div>
                      <div className="text-sm font-bold text-red-400">Logout</div>
                    </div>
                    <ChevronRight size={16} className="text-red-400/50" />
                  </div>
                </div>

                <div className="text-center pt-6 pb-2 opacity-50">
                  <img src="/logo.png" alt="GatiChakra" className="w-24 h-auto mx-auto mb-1 opacity-50" />
                  <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{t.appName} v2026.1.0</p>
                  <div className="mt-4 flex justify-center">
                    <PWAInstallButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        `;
        
  const updatedContent = content.substring(0, targetProfileStart) + newProfileSection + content.substring(targetProfileEnd);
  fs.writeFileSync('src/App.tsx', updatedContent);
  console.log("Successfully patched Profile page to List View (Dark Theme)");
} else {
  console.log("Could not find start/end markers");
}
