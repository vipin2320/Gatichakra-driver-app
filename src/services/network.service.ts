export class NetworkService {
  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  static subscribe(onStatusChange: (isOnline: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => onStatusChange(true);
    const handleOffline = () => onStatusChange(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}
