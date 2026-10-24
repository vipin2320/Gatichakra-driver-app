export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
}

export type DriverAvailability = 'offline' | 'online' | 'busy';

export enum VehicleType {
  E_RICKSHAW = 'e_rickshaw',
  MOTO_BIKE = 'moto_bike',
  AUTO_RICKSHAW = 'auto_rickshaw',
  CITY_CAB = 'city_cab',
  EV_GREEN_CAB = 'ev_green_cab',
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type OnboardingState = 
  | 'profileIncomplete'
  | 'vehicleIncomplete'
  | 'documentsIncomplete'
  | 'readyForSubmission'
  | 'pendingVerification'
  | 'rejected'
  | 'approved';

export type LocationPermissionState = 'granted' | 'denied' | 'permanently_denied' | 'disabled' | 'unknown';

export interface Driver {
  driverId: string;
  name: string;
  phone: string;
  profilePhotoUrl?: string;

  vehicleType?: VehicleType;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  manufacturingYear?: string;

  isApproved: boolean;
  approvalStatus: ApprovalStatus;
  approvalReason?: string;
  isOnline: boolean;
  isAvailable: boolean;

  rating: number;
  totalTrips: number;

  latitude?: number;
  longitude?: number;
  heading?: number;
  locationUpdatedAt?: any;

  createdAt: any;
  updatedAt: any;
}

export interface DriverDocuments {
  driverId: string;
  profilePhotoUrl?: string;
  drivingLicenseUrl?: string;
  vehicleRcUrl?: string;
  additionalDocumentUrl?: string;
  verificationStatus: ApprovalStatus;
  submittedAt?: any;
  updatedAt?: any;
}

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy?: number;
  updatedAt: any;
}

export interface DriverStats {
  driverId: string;
  todayTrips: number;
  todayEarnings: number;
  rating: number;
  totalTrips: number;
  updatedAt?: any;
}

export enum RideStatus {
  SEARCHING = 'searching',
  DRIVER_ASSIGNED = 'driverAssigned',
  DRIVER_ARRIVING = 'driverArriving',
  DRIVER_ARRIVED = 'driverArrived',
  RIDE_STARTED = 'rideStarted',
  RIDE_COMPLETED = 'rideCompleted',
  CANCELLED_BY_CUSTOMER = 'cancelledByCustomer',
  CANCELLED_BY_DRIVER = 'cancelledByDriver',
}

export interface Ride {
  rideId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;

  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;

  destinationAddress: string;
  destinationLatitude?: number;
  destinationLongitude?: number;

  vehicleType: VehicleType | string;

  distanceKm: number;
  estimatedDurationMinutes?: number;

  baseFare?: number;
  distanceCharge?: number;
  waitingCharge?: number;
  estimatedFare: number;

  paymentMethod?: string;
  paymentStatus?: string;

  rideStatus: RideStatus | string;

  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverVehicleType?: string | null;
  driverVehicleNumber?: string | null;

  driverLatitude?: number | null;
  driverLongitude?: number | null;

  otp?: string;
  pin?: string;
  rideOtp?: string;

  createdAt?: any;
  acceptedAt?: any;
  arrivedAt?: any;
  startedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
}

