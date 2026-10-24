export interface SubscriptionPass {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  description: string;
  features: string[];
  popular?: boolean;
  commissionType: 'zero_commission' | 'flat_daily';
  maxRidesPerDay?: number | 'unlimited';
}

export interface ActiveDriverPass {
  passId: string;
  passName: string;
  price: number;
  purchasedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
  paymentRef: string;
  autoRenew: boolean;
  totalSavingsEst: number;
}

export const SUBSCRIPTION_PASS_PLANS: SubscriptionPass[] = [
  {
    id: 'daily_unlimited',
    name: '1-Day Starter Pass (दैनिक पास)',
    durationDays: 1,
    price: 39,
    originalPrice: 79,
    discountPercent: 50,
    description: '1 दिन के लिए असीमित राइड्स, ज़ीरो कमीशन (Zero Commission)',
    features: [
      '24 घंटे के लिए 100% कमाई आपकी (₹0 कमीशन)',
      'असीमित पिकअप व ड्रॉप राइड्स',
      'प्राथमिकता डिस्पैच (Priority Dispatch)',
      'तुरंत UPI कैशआउट सपोर्ट'
    ],
    commissionType: 'zero_commission',
    maxRidesPerDay: 'unlimited'
  },
  {
    id: 'weekly_pro',
    name: '7-Days Super Pass (साप्ताहिक पास)',
    durationDays: 7,
    price: 199,
    originalPrice: 399,
    discountPercent: 50,
    popular: true,
    description: 'पूरे 7 दिनों तक किसी भी राइड पर 1 रुपया भी कमीशन नहीं कटेगा',
    features: [
      '7 दिनों के लिए ज़ीरो प्लेटफॉर्म कमीशन',
      'अनुमानित बचत: ₹1,500+ प्रति सप्ताह',
      'फास्टेस्ट राइड अलोकेशन व हॉटस्पॉट रडार',
      '24x7 वीआईपी पार्टनर सपोर्ट'
    ],
    commissionType: 'zero_commission',
    maxRidesPerDay: 'unlimited'
  },
  {
    id: 'monthly_vip',
    name: '30-Days VIP Sarthi Pass (मासिक पास)',
    durationDays: 30,
    price: 699,
    originalPrice: 1499,
    discountPercent: 53,
    description: 'मासिक सुपर सेवर - सबसे ज्यादा कमाई करने वाले सारथी पार्टनर्स की पसंद',
    features: [
      'पूरे 30 दिनों तक 100% शुद्ध मुनाफा आपके पास',
      'अनुमानित बचत: ₹7,000+ प्रति माह',
      'VIP सारथी बैज व प्रीमियम ग्राहक राइड्स',
      'निःशुल्क आपातकालीन दुर्घटना बीमा कवर'
    ],
    commissionType: 'zero_commission',
    maxRidesPerDay: 'unlimited'
  }
];
