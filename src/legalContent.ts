export interface LegalSection {
  title: string;
  points: string[];
}

export const LEGAL_TERMS_OF_SERVICE = {
  version: '2026.1',
  lastUpdated: '1 जनवरी 2026',
  titleHindi: 'सारथी पार्टनर सेवा शर्तें (Partner Terms of Service)',
  titleEnglish: 'Driver Partner Agreement & Terms of Service',
  sectionsHindi: [
    {
      title: '1. स्वतंत्र सेवा प्रदाता संबंध (Independent Contractor Status)',
      points: [
        'चालक/सारथी (Driver Partner) गतिचक्र (GatiChakra) का कर्मचारी नहीं है, बल्कि एक स्वतंत्र सेवा प्रदाता (Independent Contractor) है।',
        'गतिचक्र केवल एक टेक्नोलॉजी और सॉफ्टवेयर प्लेटफ़ॉर्म (SaaS Intermediary) प्रदान करता है, जो चालक को सीधे नजदीकी यात्रियों (Riders) से जोड़ता है।',
        'चालक अपनी सुविधानुसार ड्यूटी ऑनलाइन या ऑफलाइन करने के लिए पूरी तरह स्वतंत्र है, ऐप पर कोई न्यूनतम घंटे या जबरन फेरे का दबाव नहीं है।'
      ]
    },
    {
      title: '2. अनिवार्य दस्तावेज व वाहन फिटनेस (Driver Warranties & Compliance)',
      points: [
        'चालक प्रमाणित करता है कि उसके पास मोटर वाहन अधिनियम (Motor Vehicles Act) के तहत वैध ड्राइविंग लाइसेंस (Commercial/Valid DL) है।',
        'वाहन का वैध रजिस्ट्रेशन सर्टिफिकेट (RC), प्रदूषण प्रमाण पत्र (PUC) और थर्ड-पार्टी वाहन बीमा (Vehicle Insurance) सक्रिय है।',
        'चालक किसी भी गंभीर आपराधिक रिकॉर्ड में लिप्त नहीं है एवं आवश्यकता पड़ने पर पुलिस सत्यापन उपलब्ध कराएगा।'
      ]
    },
    {
      title: '3. सुरक्षा, आचरण व ज़ीरो टॉलरेंस (Safety & Code of Conduct)',
      points: [
        'नशे (शराब, मादक पदार्थ) की हालत में वाहन चलाना सख्त वर्जित है। ऐसी किसी भी शिकायत पर आईडी तुरंत ब्लैकलिस्ट की जाएगी।',
        'यात्रियों, विशेषकर महिला व वृद्ध यात्रियों के साथ पूर्णतः विनम्र और सुरक्षित व्यवहार करना अनिवार्य है।',
        'सवारी से ऐप पर निर्धारित किराए के अलावा कोई अनुचित अतिरिक्त मांग या ओवरचार्जिंग नहीं की जाएगी।'
      ]
    },
    {
      title: '4. किराया, भुगतान व SaaS सब्सक्रिप्शन (Fares & Platform Fees)',
      points: [
        'चालक को सवारी से सीधे नकद या स्वयं के UPI क्यूआर कोड पर पूरा किराया प्राप्त होता है।',
        'गतिचक्र प्लेटफ़ॉर्म उपयोग हेतु फ्लैट दैनिक/मासिक सॉफ्टवेयर सब्सक्रिप्शन या शून्य कमीशन मॉडल पर काम कर सकता है।',
        'टोल टैक्स, पार्किंग आदि यात्री की सहमति से अतिरिक्त जोड़े जा सकते हैं।'
      ]
    },
    {
      title: '5. मध्यस्थ दायित्व व क्षतिपूर्ति (Limitation of Liability & Safe Harbor)',
      points: [
        'सूचना प्रौद्योगिकी अधिनियम (IT Act 2000) की धारा 79 के तहत गतिचक्र केवल एक मध्यस्थ (Intermediary) है।',
        'सड़क दुर्घटना, यातायात चालान, वाहन चोरी या प्राकृतिक आपदा से होने वाली किसी भी क्षति के लिए गतिचक्र उत्तरदायी नहीं होगा।',
        'चालक अपने वाहन और स्वयं की सुरक्षा के लिए पूर्णतः जिम्मेदार है।'
      ]
    },
    {
      title: '6. क्षेत्राधिकार व विवाद निपटान (Jurisdiction)',
      points: [
        'इस अनुबंध या ऐप के उपयोग से संबंधित किसी भी विवाद का निपटारा उत्तर प्रदेश (मुरादाबाद जिला न्यायालय) के न्यायिक क्षेत्र के अंतर्गत होगा।'
      ]
    }
  ],
  sectionsEnglish: [
    {
      title: '1. Independent Contractor Relationship',
      points: [
        'The Driver Partner is an independent contractor and not an employee, agent, or joint venture partner of GatiChakra.',
        'GatiChakra provides a Software-as-a-Service (SaaS) intermediary technology platform connecting independent drivers with nearby passengers.',
        'The driver is completely free to set their working hours, go online or offline, and accept or decline ride requests.'
      ]
    },
    {
      title: '2. Driver Representations & Statutory Compliance',
      points: [
        'The driver warrants possessing a valid Driving Licence under the Motor Vehicles Act 1988.',
        'The vehicle possesses valid Registration (RC), Fitness, PUC, and active Third-Party Commercial Insurance at all times.',
        'The driver has no criminal background and agrees to submit police verification upon platform request.'
      ]
    },
    {
      title: '3. Passenger Safety & Zero Tolerance Policy',
      points: [
        'Zero tolerance towards driving under the influence of alcohol, drugs, or rash driving. Violations lead to immediate deactivation.',
        'Drivers must maintain courteous and professional conduct, particularly towards women, elderly, and differently-abled passengers.',
        'Overcharging beyond the transparently calculated app fare is strictly prohibited.'
      ]
    },
    {
      title: '4. Fares, Settlements & Platform Subscription',
      points: [
        'Drivers receive payments directly from riders via direct cash or personal UPI QR code settlements.',
        'GatiChakra operates on transparent software subscription or commission-free technology enablement.',
        'Toll and parking fees may only be added with rider concurrence.'
      ]
    },
    {
      title: '5. Intermediary Status & Safe Harbor (IT Act Section 79)',
      points: [
        'GatiChakra functions strictly as an intermediary under Section 79 of the Information Technology Act, 2000.',
        'The platform bears no direct liability for road mishaps, traffic penalties, vehicle damages, or external incidents.',
        'The driver retains sole responsibility for vehicle maintenance and safe on-road operation.'
      ]
    },
    {
      title: '6. Governing Law & Jurisdiction',
      points: [
        'All disputes arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in Moradabad District, Uttar Pradesh, India.'
      ]
    }
  ]
};

export const LEGAL_PRIVACY_POLICY = {
  version: '2026.1',
  lastUpdated: '1 जनवरी 2026',
  titleHindi: 'गोपनीयता नीति एवं डेटा सुरक्षा (Privacy Policy - DPDP Act 2023)',
  titleEnglish: 'Privacy Policy & Data Protection (DPDP Act 2023)',
  sectionsHindi: [
    {
      title: '1. एकत्रित की जाने वाली जानकारी (Data Collected)',
      points: [
        'मोबाइल नंबर, नाम और प्रोफाइल फोटो (चालक पहचान व लॉगिन हेतु)।',
        'लाइव बैकग्राउंड जीपीएस लोकेशन (केवल ड्यूटी के दौरान, निकटतम सवारी आवंटन और सुरक्षा नेविगेशन हेतु)।',
        'दस्तावेज (ड्राइविंग लाइसेंस, आरसी) नियामक अनुपालन एवं सुरक्षा सत्यापन हेतु।'
      ]
    },
    {
      title: '2. लोकेशन ट्रैकिंग का उद्देश्य (Purpose of Location Tracking)',
      points: [
        'ड्यूटी पर रहने के दौरान आपकी लोकेशन का उपयोग केवल सवारी को आपकी सही दूरी व अनुमानित समय (ETA) दिखाने के लिए किया जाता है।',
        'सवारी के दौरान सुरक्षा व SOS आपातकालीन स्थिति में रूट निगरानी हेतु।',
        'ड्यूटी "ऑफलाइन" करते ही बैकग्राउंड लोकेशन ट्रैकिंग पूर्णतः बंद हो जाती है। हम आपकी लोकेशन किसी विज्ञापन कंपनी को कभी नहीं बेचते।'
      ]
    },
    {
      title: '3. डेटा भंडारण व सुरक्षा (Data Storage & Security)',
      points: [
        'सभी डेटा Google Cloud Firestore के एन्क्रिप्टेड और सुरक्षित डेटाबेस में संग्रहित किया जाता है।',
        'बैंक/UPI विवरण कभी भी असुरक्षित रूप से साझा नहीं किया जाता।'
      ]
    },
    {
      title: '4. डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023 Rights)',
      points: [
        'सूचना का अधिकार: आप कभी भी देख सकते हैं कि आपका कौन सा डेटा ऐप पर दर्ज है।',
        'डेटा हटाने का अधिकार (Right to Erasure): आप ऐप की प्रोफाइल सेटिंग से या सपोर्ट पर ईमेल/संदेश भेजकर अपना खाता व पूरा डेटा हटाने का अनुरोध कर सकते हैं।'
      ]
    }
  ],
  sectionsEnglish: [
    {
      title: '1. Information We Collect',
      points: [
        'Personal identifiers including mobile phone number, name, and profile picture for authentication.',
        'Real-time GPS location collected strictly during active duty for ride dispatch, ETA computation, and route tracking.',
        'Regulatory credentials such as Driving Licence and vehicle RC for compliance audits.'
      ]
    },
    {
      title: '2. Purpose of GPS Location Processing',
      points: [
        'Location tracking operates strictly while on duty to match nearby passenger ride requests and compute accurate routes.',
        'Real-time tracking powers the in-app emergency SOS and turn-by-turn navigation.',
        'Background tracking terminates immediately upon toggling Duty OFFLINE. Location data is never sold or shared with third-party advertisers.'
      ]
    },
    {
      title: '3. Data Security & Cloud Infrastructure',
      points: [
        'All data is encrypted in transit and at rest using enterprise Google Cloud Firestore infrastructure.',
        'Sensitive identity documents are access-controlled strictly for verification purposes.'
      ]
    },
    {
      title: '4. Your Rights under DPDP Act 2023',
      points: [
        'Right to Access & Correction: You may review and update your profile details anytime.',
        'Right to Erasure: Drivers have the statutory right to request permanent deletion of their account and associated records via account settings.'
      ]
    }
  ]
};
