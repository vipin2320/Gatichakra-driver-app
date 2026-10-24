// In-App Hindi/English Voice Guidance Service using Browser SpeechSynthesis API
// This speaks out navigation instructions (e.g. "पिकअप स्थान 2 किमी दूर है, सीधे जाएं") in pure Hindi/English audio directly in the app,
// in addition to Google Maps turn-by-turn.

class VoiceGuidanceService {
  private isSpeaking: boolean = false;
  private isMuted: boolean = false;

  constructor() {
    // Warm up speech synthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(text: string, lang: 'hi' | 'en' = 'hi') {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop prior speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly natural pace for drivers
      utterance.pitch = 1.0;

      const targetLocale = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.lang = targetLocale;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Try finding exact hindi voice or Indian English voice
        const matchedVoice = voices.find(v => 
          lang === 'hi' ? (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'))
                        : (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'))
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice guidance speech error:', e);
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceGuidance = new VoiceGuidanceService();
