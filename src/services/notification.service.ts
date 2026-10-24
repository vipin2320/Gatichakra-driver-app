/**
 * Notification Service for GatiChakra Driver App
 * Plays continuous loud siren/chime alert when a new ride request arrives.
 */

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ringInterval: any = null;

  constructor() {
    // Check if audio enabled in storage safely
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('gatichakra_driver_sound_enabled') : null;
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('gatichakra_driver_sound_enabled', String(enabled));
    } catch {}
    if (!enabled) {
      this.stopRinging();
    }
  }

  /**
   * Start loud continuous ringing when a ride request arrives
   */
  public startRinging(): void {
    if (!this.soundEnabled) return;
    this.stopRinging();

    // Play immediately
    this.playDoubleBeep();

    // Loop every 1.2 seconds
    this.ringInterval = setInterval(() => {
      this.playDoubleBeep();
    }, 1200);
  }

  /**
   * Play single alert chime (backwards-compatibility alias)
   */
  public playNewRequestChime(): void {
    this.playDoubleBeep();
  }

  /**
   * Stop ringing when driver accepts, rejects, or timer expires
   */
  public stopRinging(): void {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Play high-attention alert sound
   */
  public playDoubleBeep(): void {
    if (!this.soundEnabled) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: 659.25 Hz (E5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2: 987.77 Hz (B5) - Higher pitch for urgent attention
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77, now + 0.22);
      gain2.gain.setValueAtTime(0.4, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio chime playback omitted:', e);
    }
  }

  /**
   * Play distinct cancellation chime when rider cancels ride
   */
  public playCancelChime(): void {
    if (!this.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      // Descending warning tone: 880Hz -> 587Hz -> 392Hz
      const notes = [880.0, 587.33, 392.0];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.3, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.22);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.22);
      });
    } catch (_) {}
  }

  /**
   * Pleasant success chime when ride accepted or trip finished
   */
  public playSuccessChime(): void {
    if (!this.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (_) {}
  }
}

export const notificationService = new NotificationService();
