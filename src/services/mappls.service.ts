/**
 * Mappls Navigation Service
 * Handles Mappls Directions / Routing API communication,
 * route geometry decoding, off-route detection, and distance/ETA formatting.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapplsPlace {
  placeName: string;
  placeAddress: string;
  eLoc: string;
  type?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export interface RouteResult {
  geometry: [number, number][]; // Array of [lat, lng] points for Leaflet polyline
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  formattedDistance: string; // e.g. "2.4 km"
  formattedDuration: string; // e.g. "8 min"
  destinationCoords?: LatLng;
}

export class MapplsService {
  private static cachedToken: { token: string; expiresAt: number } | null = null;

  static getApiKey(): string {
    let storedKey = '';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        storedKey = window.localStorage.getItem('gatichakra_mappls_api_key') || '';
      }
    } catch {}
    return (
      ((import.meta as any).env?.VITE_MAPPLS_REST_API_KEY as string) ||
      ((import.meta as any).env?.VITE_MAPPLS_API_KEY as string) ||
      (typeof process !== 'undefined' ? (process.env?.VITE_MAPPLS_REST_API_KEY || process.env?.VITE_MAPPLS_API_KEY) : '') ||
      storedKey ||
      ''
    ).trim();
  }

  static getClientId(): string {
    let storedId = '';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        storedId = window.localStorage.getItem('gatichakra_mappls_client_id') || '';
      }
    } catch {}
    return (
      ((import.meta as any).env?.VITE_MAPPLS_CLIENT_ID as string) ||
      (typeof process !== 'undefined' ? process.env?.VITE_MAPPLS_CLIENT_ID : '') ||
      storedId ||
      ''
    ).trim();
  }

  static getClientSecret(): string {
    let storedSecret = '';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        storedSecret = window.localStorage.getItem('gatichakra_mappls_client_secret') || '';
      }
    } catch {}
    return (
      ((import.meta as any).env?.VITE_MAPPLS_CLIENT_SECRET as string) ||
      (typeof process !== 'undefined' ? process.env?.VITE_MAPPLS_CLIENT_SECRET : '') ||
      storedSecret ||
      ''
    ).trim();
  }

  /**
   * Retrieve cached or fresh OAuth2 Bearer Access Token for Mappls Atlas APIs
   */
  static async getOAuthToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60000) {
      return this.cachedToken.token;
    }

    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId || !clientSecret) {
      console.warn('[MapplsService] Client ID or Secret missing for OAuth token');
      return '';
    }

    try {
      const response = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mappls OAuth error (${response.status})`);
      }

      const data = await response.json();
      if (data.access_token) {
        const expiresInMs = (data.expires_in || 86400) * 1000;
        this.cachedToken = {
          token: data.access_token,
          expiresAt: Date.now() + expiresInMs,
        };
        return data.access_token;
      }
    } catch (err) {
      console.warn('[MapplsService] OAuth token fetch failed:', err);
    }
    return '';
  }

  /**
   * Search real places (hospitals, schools, coaching, shops, bus stand) using Mappls Atlas Places Search
   */
  static async searchPlaces(query: string, userLocation?: LatLng): Promise<MapplsPlace[]> {
    if (!query || query.trim().length < 2) return [];

    const token = await this.getOAuthToken();
    if (!token) {
      return [];
    }

    try {
      let url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query.trim())}`;
      if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
        url += `&location=${userLocation.latitude},${userLocation.longitude}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const locations = data.suggestedLocations || [];

      return locations.map((loc: any) => ({
        placeName: loc.placeName || loc.poi || '',
        placeAddress: loc.placeAddress || '',
        eLoc: loc.eLoc || '',
        type: loc.type || '',
        distance: loc.distance,
      }));
    } catch (error) {
      console.warn('[MapplsService] searchPlaces error:', error);
      return [];
    }
  }

  /**
   * Reverse Geocode coordinates to an exact Indian address, landmark and city
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) return '';

    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${latitude}&lng=${longitude}`;
      const res = await fetch(url);
      if (!res.ok) return '';

      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const r = data.results[0];
        const parts = [
          r.poi,
          r.houseName,
          r.street,
          r.subLocality,
          r.locality,
          r.city || r.district,
        ].filter(Boolean);
        return parts.join(', ') || r.formatted_address || '';
      }
    } catch (e) {
      console.warn('[MapplsService] reverseGeocode error:', e);
    }
    return '';
  }

  /**
   * Calculate driving route between origin and destination using Mappls Advanced Maps Driving Route API
   */
  static async calculateRoute(
    origin: LatLng,
    destination: LatLng
  ): Promise<RouteResult> {
    if (!origin || !destination) {
      throw new Error('Origin and destination coordinates are required.');
    }

    // Validate coordinates
    if (
      isNaN(origin.latitude) ||
      isNaN(origin.longitude) ||
      isNaN(destination.latitude) ||
      isNaN(destination.longitude)
    ) {
      throw new Error('Invalid GPS coordinates provided for routing.');
    }

    // Helper to fetch route from free Open Source Routing Machine (OSRM) with mirror fallback
    const fetchOsrmRoute = async (): Promise<RouteResult> => {
      const endpoints = [
        `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`,
        `https://routing.openstreetmap.de/routed-car/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
      ];

      let lastError: any = null;
      for (const osrmUrl of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(osrmUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) continue;
          const osrmData = await res.json();
          if (!osrmData || !osrmData.routes || osrmData.routes.length === 0) continue;

          const route = osrmData.routes[0];
          const distanceMeters = Math.round(route.distance || 0);
          const durationSeconds = Math.round(route.duration || 0);
          const distanceKm = Number((distanceMeters / 1000).toFixed(1));
          const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
          const coordinates: [number, number][] = (route.geometry?.coordinates || []).map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );

          if (coordinates.length > 0) {
            return {
              geometry: coordinates,
              distanceMeters,
              distanceKm,
              durationSeconds,
              durationMinutes,
              formattedDistance: distanceMeters >= 1000 ? `${distanceKm} km` : `${distanceMeters} m`,
              formattedDuration: durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min` : `${durationMinutes} min`,
              destinationCoords: { latitude: destination.latitude, longitude: destination.longitude }
            };
          }
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('No driving route found via OSRM mirrors.');
    };

    // Primary: High-speed, CORS-friendly OSRM road routing (identical to Customer App)
    try {
      return await fetchOsrmRoute();
    } catch (osrmError) {
      console.warn('OSRM routing mirror error, attempting Mappls/Fallback:', osrmError);
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/route_adv/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&overview=full&steps=true`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceMeters = Math.round(route.distance || 0);
            const durationSeconds = Math.round(route.duration || 0);

            let coordinates: [number, number][] = [];
            if (route.geometry && typeof route.geometry === 'object' && Array.isArray(route.geometry.coordinates)) {
              coordinates = route.geometry.coordinates.map((coord: [number, number]) => [
                coord[1],
                coord[0],
              ]);
            } else if (typeof route.geometry === 'string') {
              coordinates = this.decodePolyline(route.geometry);
            }

            if (coordinates.length > 0) {
              const distanceKm = Number((distanceMeters / 1000).toFixed(1));
              const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
              return {
                geometry: coordinates,
                distanceMeters,
                distanceKm,
                durationSeconds,
                durationMinutes,
                formattedDistance: distanceMeters >= 1000 ? `${distanceKm} km` : `${distanceMeters} m`,
                formattedDuration: durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} min` : `${durationMinutes} min`,
                destinationCoords: { latitude: destination.latitude, longitude: destination.longitude }
              };
            }
          }
        }
      } catch (mapplsErr) {
        console.warn('Mappls route fetch skipped (CORS/Network):', mapplsErr);
      }
    }

    // Reliable fallback: Straight line with distance calculation
    const distM = Math.round(this.calculateDistanceMeters(origin.latitude, origin.longitude, destination.latitude, destination.longitude));
    const distKm = Number((distM / 1000).toFixed(1));
    const durMin = Math.max(1, Math.ceil(distKm * 2.5));
    return {
      geometry: [
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude]
      ],
      distanceMeters: distM,
      distanceKm: distKm,
      durationSeconds: durMin * 60,
      durationMinutes: durMin,
      formattedDistance: distM >= 1000 ? `${distKm} km` : `${distM} m`,
      formattedDuration: `${durMin} min`,
      destinationCoords: { latitude: destination.latitude, longitude: destination.longitude }
    };
  }

  /**
   * Decode Polyline string (OSRM/Google/Mappls format)
   */
  private static decodePolyline(encoded: string, precision: number = 5): [number, number][] {
    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;
    const factor = Math.pow(10, precision);

    while (index < encoded.length) {
      let byte: number;
      let shift = 0;
      let result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
  }

  /**
   * Calculate distance between two coordinates in meters using the Haversine formula
   */
  static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if driver is within proximity of the pickup location (e.g. 100 meters)
   */
  static isNearPickup(
    driverLoc: LatLng,
    pickupLoc: LatLng,
    thresholdMeters: number = 100
  ): boolean {
    const dist = this.calculateDistanceMeters(
      driverLoc.latitude,
      driverLoc.longitude,
      pickupLoc.latitude,
      pickupLoc.longitude
    );
    return dist <= thresholdMeters;
  }

  /**
   * Check if driver has drifted off the calculated route polyline.
   * Finds the minimum distance from point to all line segments of the polyline.
   */
  static isOffRoute(
    driverLoc: LatLng,
    routeGeometry: [number, number][],
    thresholdMeters: number = 80
  ): boolean {
    if (!routeGeometry || routeGeometry.length < 2) return false;

    let minDistance = Infinity;

    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const p1 = routeGeometry[i];
      const p2 = routeGeometry[i + 1];

      const dist = this.distanceToSegmentMeters(
        driverLoc.latitude,
        driverLoc.longitude,
        p1[0],
        p1[1],
        p2[0],
        p2[1]
      );

      if (dist < minDistance) {
        minDistance = dist;
      }

      // Fast exit if we are close enough to any segment
      if (minDistance <= thresholdMeters) {
        return false;
      }
    }

    return minDistance > thresholdMeters;
  }

  /**
   * Snap raw GPS coordinate to the nearest segment of the road route polyline.
   * If the driver is within maxThresholdMeters (default: 35m) of the route, returns the projected
   * point on the road line plus the road segment's tangent bearing.
   * If farther away (e.g. took a wrong turn), returns raw coordinates so auto-reroute can handle it.
   */
  static snapToRoute(
    rawLoc: LatLng,
    routeGeometry: [number, number][],
    maxThresholdMeters: number = 35
  ): { latitude: number; longitude: number; snapped: boolean; segmentBearing?: number; distanceToRoadMeters: number } {
    if (!routeGeometry || routeGeometry.length < 2) {
      return {
        latitude: rawLoc.latitude,
        longitude: rawLoc.longitude,
        snapped: false,
        distanceToRoadMeters: 0,
      };
    }

    let minDistance = Infinity;
    let closestPoint: LatLng = { latitude: rawLoc.latitude, longitude: rawLoc.longitude };
    let bestBearing = 0;

    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const p1 = routeGeometry[i];
      const p2 = routeGeometry[i + 1];

      const { distance, projectedPoint } = this.projectPointOntoSegment(
        rawLoc.latitude,
        rawLoc.longitude,
        p1[0],
        p1[1],
        p2[0],
        p2[1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = projectedPoint;
        bestBearing = this.calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      }
    }

    if (minDistance <= maxThresholdMeters) {
      return {
        latitude: closestPoint.latitude,
        longitude: closestPoint.longitude,
        snapped: true,
        segmentBearing: bestBearing,
        distanceToRoadMeters: minDistance,
      };
    }

    return {
      latitude: rawLoc.latitude,
      longitude: rawLoc.longitude,
      snapped: false,
      distanceToRoadMeters: minDistance,
    };
  }

  /**
   * Calculate bearing (heading angle 0-360°) between two coordinates
   */
  static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = Math.PI / 180;
    const toDeg = 180 / Math.PI;
    const phi1 = lat1 * toRad;
    const phi2 = lat2 * toRad;
    const deltaLambda = (lon2 - lon1) * toRad;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    const bearing = (theta * toDeg + 360) % 360;
    return Math.round(bearing);
  }

  /**
   * Project a point P onto segment AB and return both distance and projected coordinates
   */
  private static projectPointOntoSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { distance: number; projectedPoint: LatLng } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return {
        distance: this.calculateDistanceMeters(px, py, x1, y1),
        projectedPoint: { latitude: x1, longitude: y1 },
      };
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const projLat = x1 + t * dx;
    const projLng = y1 + t * dy;

    return {
      distance: this.calculateDistanceMeters(px, py, projLat, projLng),
      projectedPoint: { latitude: projLat, longitude: projLng },
    };
  }

  /**
   * Calculate perpendicular distance from point P to line segment AB in meters
   */
  private static distanceToSegmentMeters(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return this.calculateDistanceMeters(px, py, x1, y1);
    }

    // Projection parameter t
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return this.calculateDistanceMeters(px, py, projX, projY);
  }
}
