import { MapplsService, LatLng, RouteResult } from '../services/mappls.service';

/**
 * Navigation Repository
 * Manages caching, fetching, and validation of routes between driver GPS and pickup points.
 */
export class NavigationRepository {
  private static cachedRoute: RouteResult | null = null;
  private static cachedRideId: string | null = null;
  private static lastFetchTime: number = 0;

  /**
   * Fetch driving route to pickup with memory caching and rate limit safeguards
   */
  static async getRouteToPickup(
    rideId: string,
    origin: LatLng,
    destination: LatLng,
    forceRefresh: boolean = false
  ): Promise<RouteResult> {
    const now = Date.now();

    // Cache hit: If same ride and requested within last 12 seconds without force refresh, return cached
    if (
      !forceRefresh &&
      this.cachedRideId === rideId &&
      this.cachedRoute &&
      now - this.lastFetchTime < 12000
    ) {
      return this.cachedRoute;
    }

    try {
      const result = await MapplsService.calculateRoute(origin, destination);
      this.cachedRoute = result;
      this.cachedRideId = rideId;
      this.lastFetchTime = now;
      return result;
    } catch (error) {
      // If network fails but we had a cached route for this ride, preserve it
      if (this.cachedRideId === rideId && this.cachedRoute) {
        console.warn('Using cached route due to route fetch failure:', error);
        return this.cachedRoute;
      }
      throw error;
    }
  }

  /**
   * Clear cached navigation state for completed/cancelled rides
   */
  static clearCache() {
    this.cachedRoute = null;
    this.cachedRideId = null;
    this.lastFetchTime = 0;
  }

  /**
   * Get currently cached route if available
   */
  static getCachedRoute(): RouteResult | null {
    return this.cachedRoute;
  }
}
