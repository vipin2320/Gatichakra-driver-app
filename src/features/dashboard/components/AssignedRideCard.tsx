import React, { useState, useEffect } from 'react';
import { Ride, RideStatus } from '../../../models/types';
import { Card } from '../../../widgets/Card';
import { Button } from '../../../widgets/Button';
import { useRideStore } from '../../../providers/rideProvider';
import { useAuthStore } from '../../../providers/authProvider';
import { useDriverAvailabilityStore } from '../../../providers/driverAvailabilityStore';
import { useNavigationStore } from '../../../providers/navigationProvider';
import { DriverNavigationMap } from './DriverNavigationMap';
import {
  Phone,
  MapPin,
  Navigation,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Sparkles,
  Info,
  Car,
  Check,
  AlertTriangle,
  Radio,
  Clock,
  Navigation2,
  RefreshCw,
  Lock,
  X,
} from 'lucide-react';
import { cn } from '../../../core/utils/cn';

interface AssignedRideCardProps {
  key?: React.Key;
  ride: Ride;
}

export function AssignedRideCard({ ride }: AssignedRideCardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const { updateRideStatus, isAccepting, locationError, isGpsTracking } = useRideStore();
  const { currentCoords } = useDriverAvailabilityStore();
  const { user } = useAuthStore();

  const {
    formattedDistance,
    formattedEta,
    routeStatus,
    errorMessage: navError,
    isNearPickup,
    isRecalculating,
    driverHeading,
    initNavigationForRide,
    recalculateRoute,
  } = useNavigationStore();

  // Initialize or re-sync navigation on mount or when ride status changes
  useEffect(() => {
    if (
      ride.rideStatus === RideStatus.DRIVER_ASSIGNED ||
      ride.rideStatus === RideStatus.DRIVER_ARRIVING ||
      ride.rideStatus === RideStatus.RIDE_STARTED
    ) {
      initNavigationForRide(ride, currentCoords);
    }
  }, [ride.rideId, ride.rideStatus, initNavigationForRide, currentCoords]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formattedVehicle = ride.vehicleType
    ? ride.vehicleType.replace('_', ' ').toUpperCase()
    : 'VEHICLE';

  const handleUpdateStatus = async (newStatus: RideStatus) => {
    if (!user) return;

    // Intercept RIDE_STARTED to require PIN verification first
    if (newStatus === RideStatus.RIDE_STARTED) {
      setShowPinModal(true);
      setEnteredPin('');
      setPinError(null);
      return;
    }

    const success = await updateRideStatus(
      ride.rideId,
      user.uid,
      ride.rideStatus as RideStatus,
      newStatus
    );
    if (!success) {
      showToast('Failed to update status');
    }
  };

  const handleVerifyAndStartRide = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    const trimmedPin = enteredPin.trim();
    if (!trimmedPin) {
      setPinError('Please enter the 4-digit PIN');
      return;
    }

    // Reuse any existing customer OTP/PIN field from the ride document schema
    const correctPin = (ride.pin || ride.otp || ride.rideOtp || '').toString().trim();
    const isTestBypass = trimmedPin === '1234' || trimmedPin === '0000';

    if (trimmedPin === correctPin || isTestBypass) {
      const success = await updateRideStatus(
        ride.rideId,
        user.uid,
        RideStatus.DRIVER_ARRIVED,
        RideStatus.RIDE_STARTED
      );

      if (success) {
        showToast(isTestBypass ? 'Ride Started (TESTING BYPASS ACTIVE)' : 'Ride Started successfully!');
        setShowPinModal(false);
      } else {
        setPinError('Failed to start ride in database. Please try again.');
      }
    } else {
      setPinError('Incorrect PIN. Please ask the passenger for the correct 4-digit code.');
    }
  };

  const handleCancelRide = async () => {
    if (!user) return;
    setShowCancelConfirm(false);
    const success = await updateRideStatus(
      ride.rideId,
      user.uid,
      ride.rideStatus as RideStatus,
      RideStatus.CANCELLED_BY_DRIVER
    );
    if (success) {
      showToast('Ride cancelled successfully');
    } else {
      showToast('Failed to cancel ride');
    }
  };

  const isNavigatingToPickup =
    ride.rideStatus === RideStatus.DRIVER_ASSIGNED ||
    ride.rideStatus === RideStatus.DRIVER_ARRIVING;

  const isNavigatingToDestination =
    ride.rideStatus === RideStatus.RIDE_STARTED;

  const isNavigating = isNavigatingToPickup || isNavigatingToDestination;

  const r = ride as any;

  const pickupLocation =
    (r.pickupLatitude ?? r.pickupLat ?? r.pickupLocation?.latitude) &&
    (r.pickupLongitude ?? r.pickupLng ?? r.pickupLocation?.longitude)
      ? {
          latitude: Number(r.pickupLatitude ?? r.pickupLat ?? r.pickupLocation?.latitude),
          longitude: Number(r.pickupLongitude ?? r.pickupLng ?? r.pickupLocation?.longitude)
        }
      : null;

  const destinationLocation =
    (r.destinationLatitude ?? r.destinationLat ?? r.destLat ?? r.dropLat ?? r.destinationLocation?.latitude) &&
    (r.destinationLongitude ?? r.destinationLng ?? r.destLng ?? r.dropLng ?? r.destinationLocation?.longitude)
      ? {
          latitude: Number(r.destinationLatitude ?? r.destinationLat ?? r.destLat ?? r.dropLat ?? r.destinationLocation?.latitude),
          longitude: Number(r.destinationLongitude ?? r.destinationLng ?? r.destLng ?? r.dropLng ?? r.destinationLocation?.longitude)
        }
      : null;

  const activeTargetLocation = isNavigatingToDestination ? destinationLocation : pickupLocation;
  const activeTargetAddress = isNavigatingToDestination
    ? (ride.destinationAddress || 'Destination')
    : (ride.pickupAddress || 'Pickup');

  const getStatusDisplay = () => {
    switch (ride.rideStatus) {
      case RideStatus.DRIVER_ASSIGNED:
        return 'DRIVER ASSIGNED';
      case RideStatus.DRIVER_ARRIVING:
        return 'ARRIVING AT PICKUP';
      case RideStatus.DRIVER_ARRIVED:
        return 'ARRIVED AT PICKUP';
      case RideStatus.RIDE_STARTED:
        return 'RIDE IN PROGRESS';
      default:
        return 'ACTIVE TRIP';
    }
  };

  return (
    <Card elevated className="p-5 border-2 border-emerald-500 bg-white shadow-xl relative">
      {/* Top Active Status Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {getStatusDisplay()}
          </span>
        </div>

        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
          Trip #{ride.rideId.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* GPS Location Status / Warning */}
      {locationError ? (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center space-x-2 text-amber-800 text-xs font-semibold">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      ) : isGpsTracking ? (
        <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <Radio size={14} className="text-emerald-600 animate-pulse" />
            <span>Real-time GPS Tracking Active</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
            3-5s Sync
          </span>
        </div>
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* MAPPLS NAVIGATION TO TARGET PANEL (Pickup or Destination)      */}
      {/* ------------------------------------------------------------- */}
      {isNavigating && (
        <div className="mb-5 space-y-3">
          {/* Navigation HUD Panel */}
          <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation2 size={16} className="text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  {isNavigatingToDestination ? 'Navigation to Destination' : 'Navigation to Pickup'}
                </span>
              </div>
              {isNearPickup ? (
                <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                  {isNavigatingToDestination ? 'Near Dest (≤100m)' : 'Near Pickup (≤100m)'}
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  Mappls Route
                </span>
              )}
            </div>

            {/* Live Distance & ETA Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-950/80 border border-emerald-800/50 rounded-xl text-emerald-400">
                  <Compass size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isNavigatingToDestination ? 'Distance to Dest' : 'Distance to Pickup'}
                  </span>
                  <span className="text-base font-black text-white">
                    {formattedDistance || (routeStatus === 'loading' ? 'Calculating...' : 'Pending GPS')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-sky-950/80 border border-sky-800/50 rounded-xl text-sky-400">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isNavigatingToDestination ? 'ETA to Dest' : 'ETA to Pickup'}
                  </span>
                  <span className="text-base font-black text-sky-300">
                    {formattedEta || (routeStatus === 'loading' ? 'Estimating...' : 'Pending GPS')}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Error / Retry Notification */}
            {navError && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-300">
                <span className="truncate">{navError}</span>
                <button
                  type="button"
                  onClick={recalculateRoute}
                  className="ml-2 px-2 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded text-[10px] font-bold flex items-center space-x-1"
                >
                  <RefreshCw size={10} className={isRecalculating ? 'animate-spin' : ''} />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Mappls Driving Route Map */}
          <DriverNavigationMap
            driverLocation={currentCoords}
            driverHeading={driverHeading}
            pickupLocation={activeTargetLocation}
            pickupAddress={activeTargetAddress}
            className="h-56"
          />
        </div>
      )}

      {/* Customer Information (Privacy Protected: Phone visible ONLY after assignment) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-lg border border-sky-200 shadow-sm">
            {ride.customerName?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="font-bold text-slate-900 text-sm">
                {ride.customerName || 'Customer'}
              </h3>
              <ShieldCheck size={14} className="text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-slate-500">
              Verified Passenger
            </p>
          </div>
        </div>

        {ride.customerPhone && (
          <a
            href={`tel:${ride.customerPhone}`}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-500 transition-colors"
          >
            <Phone size={14} />
            <span>Call</span>
          </a>
        )}
      </div>

      {/* Ride Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            EST. FARE
          </span>
          <span className="text-lg font-black text-emerald-600">
            ₹{ride.estimatedFare || '0'}
          </span>
        </div>

        <div className="border-x border-slate-200 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TRIP DISTANCE
          </span>
          <span className="text-sm font-bold text-slate-900">
            {ride.distanceKm ? `${ride.distanceKm} km` : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            VEHICLE
          </span>
          <span className="text-xs font-bold text-sky-700">
            {formattedVehicle}
          </span>
        </div>
      </div>

      {/* Pickup & Destination Address Details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5 flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              PICKUP LOCATION
            </span>
            <p className="text-xs font-bold text-slate-900 leading-snug">
              {ride.pickupAddress || 'Pickup address unavailable'}
            </p>
          </div>
        </div>

        <div className="ml-4 pl-0.5 border-l-2 border-dashed border-slate-300 h-3 my-0" />

        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg mt-0.5 flex-shrink-0">
            <Navigation size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              DESTINATION
            </span>
            <p className="text-xs font-bold text-slate-900 leading-snug">
              {ride.destinationAddress || 'Destination address unavailable'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons based on status */}
      <div className="space-y-2.5">
        {ride.rideStatus === RideStatus.DRIVER_ASSIGNED && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isLoading={isAccepting}
            disabled={isAccepting}
            onClick={() => handleUpdateStatus(RideStatus.DRIVER_ARRIVING)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 shadow-md"
          >
            <Compass size={18} className="mr-2" />
            Start Arriving
          </Button>
        )}

        {ride.rideStatus === RideStatus.DRIVER_ARRIVING && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isLoading={isAccepting}
            disabled={isAccepting}
            onClick={() => handleUpdateStatus(RideStatus.DRIVER_ARRIVED)}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-3.5 shadow-md"
          >
            <MapPin size={18} className="mr-2" />
            Arrived at Pickup
          </Button>
        )}

        {ride.rideStatus === RideStatus.DRIVER_ARRIVED && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isLoading={isAccepting}
            disabled={isAccepting}
            onClick={() => handleUpdateStatus(RideStatus.RIDE_STARTED)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 size={18} className="mr-2" />
            Start Ride
          </Button>
        )}

        {ride.rideStatus === RideStatus.RIDE_STARTED && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isLoading={isAccepting}
            disabled={isAccepting}
            onClick={() => handleUpdateStatus(RideStatus.RIDE_COMPLETED)}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3.5 shadow-lg shadow-rose-500/20"
          >
            <Check size={18} className="mr-2" />
            Complete Ride
          </Button>
        )}

        {/* Cancellation option available during driverAssigned or driverArriving */}
        {(ride.rideStatus === RideStatus.DRIVER_ASSIGNED ||
          ride.rideStatus === RideStatus.DRIVER_ARRIVING) && (
          <div>
            {!showCancelConfirm ? (
              <button
                type="button"
                disabled={isAccepting}
                onClick={() => setShowCancelConfirm(true)}
                className="w-full text-center text-xs font-semibold text-rose-600 hover:text-rose-700 py-1.5 transition-colors"
              >
                Cancel this ride
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-rose-800 text-center">
                  Are you sure you want to cancel this ride?
                </p>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 text-xs"
                  >
                    No, Keep Ride
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    isLoading={isAccepting}
                    onClick={handleCancelRide}
                    className="flex-1 text-xs bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Yes, Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center">
            <Info size={13} className="mr-1 text-slate-400" />
            Location is being shared with customer
          </p>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 relative">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide uppercase">PIN Verification</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Ride Security</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleVerifyAndStartRide} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Ask the customer for their <span className="font-bold text-slate-950">4-digit Ride PIN</span> to start the ride. This ensures security and trip validation.
              </p>

              {/* PIN Input Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Enter 4-Digit PIN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={enteredPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEnteredPin(val);
                      if (pinError) setPinError(null);
                    }}
                    placeholder="• • • •"
                    className="w-full text-center tracking-[0.75em] text-2xl font-black py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Error Alert */}
              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-bold animate-pulse">
                  <span className="mt-0.5">•</span>
                  <span>{pinError}</span>
                </div>
              )}

              {/* Notice of Testing Bypass */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block">
                  ⚠️ TESTING / DEVELOPER BYPASS ONLY
                </span>
                <p className="text-[9px] text-amber-600 font-bold">
                  Enter "1234" or "0000" to simulate a successful match.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 text-xs py-3 rounded-2xl border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isAccepting}
                  disabled={enteredPin.length < 4 || isAccepting}
                  className="flex-1 text-xs py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Verify & Start
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      {toastMessage && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-xs font-semibold text-center animate-in fade-in slide-in-from-bottom duration-200 z-10 flex items-center justify-center space-x-2">
          <Sparkles size={16} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </Card>
  );
}
