import React, { useEffect, useState } from 'react';
import { Ride, Driver } from '../../../models/types';
import { useRideStore } from '../../../providers/rideProvider';
import { Card } from '../../../widgets/Card';
import { Button } from '../../../widgets/Button';
import {
  MapPin,
  Navigation,
  Clock,
  Car,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../core/utils/cn';

interface RideRequestCardProps {
  key?: React.Key;
  ride: Ride;
  driver: Driver;
}

export function RideRequestCard({ ride, driver }: RideRequestCardProps) {
  const { acceptRide, declineRide, isAccepting, acceptError, clearAcceptError } =
    useRideStore();

  const [timeLeft, setTimeLeft] = useState(25); // 25 seconds countdown timer
  const TOTAL_TIME = 25;

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto decline/hide request when countdown expires
          declineRide(ride.rideId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ride.rideId, declineRide]);

  const handleAccept = async () => {
    clearAcceptError();
    await acceptRide(ride.rideId, driver);
  };

  const handleDecline = () => {
    clearAcceptError();
    declineRide(ride.rideId);
  };

  const formattedVehicle = ride.vehicleType
    ? ride.vehicleType.replace('_', ' ').toUpperCase()
    : 'VEHICLE';

  const formattedTime = ride.createdAt
    ? new Date(ride.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  const progressPercentage = (timeLeft / TOTAL_TIME) * 100;

  return (
    <Card elevated className="p-5 border-2 border-sky-500 bg-white shadow-xl relative overflow-hidden">
      {/* Top Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            timeLeft > 10 ? 'bg-sky-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Header Banner */}
      <div className="flex items-center justify-between pt-1 mb-4">
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-sky-900 uppercase tracking-widest bg-sky-100 px-2.5 py-1 rounded-md">
            NEW RIDE REQUEST
          </span>
        </div>

        <div className="flex items-center text-xs font-bold text-slate-500">
          <Clock size={14} className="mr-1 text-slate-400" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Ride Summary Grid */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            EST. FARE
          </span>
          <span className="text-xl font-black text-emerald-600">
            ₹{ride.estimatedFare || '0'}
          </span>
        </div>

        <div className="border-x border-slate-200 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            DISTANCE
          </span>
          <span className="text-base font-bold text-slate-900">
            {ride.distanceKm ? `${ride.distanceKm} km` : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            EST. TIME
          </span>
          <span className="text-base font-bold text-slate-900">
            {ride.estimatedDurationMinutes ? `${ride.estimatedDurationMinutes} min` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Route Addresses */}
      <div className="space-y-3 mb-4">
        {/* Pickup */}
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg mt-0.5 flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              PICKUP LOCATION
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {ride.pickupAddress || 'Pickup address unavailable'}
            </p>
          </div>
        </div>

        {/* Connector Line */}
        <div className="ml-4 pl-0.5 border-l-2 border-dashed border-slate-300 h-3 my-0" />

        {/* Destination */}
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg mt-0.5 flex-shrink-0">
            <Navigation size={18} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              DESTINATION
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {ride.destinationAddress || 'Destination address unavailable'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Meta */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
        <div className="flex items-center space-x-1.5">
          <Car size={14} className="text-sky-600" />
          <span className="font-bold text-slate-700">{formattedVehicle}</span>
        </div>
        <span className="text-[11px] font-medium">Req at {formattedTime}</span>
      </div>

      {/* Error Notice */}
      {acceptError && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-medium">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <span>{acceptError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleDecline}
          disabled={isAccepting}
          className="w-full border-slate-300 text-slate-600 hover:bg-slate-100 font-bold"
        >
          <XCircle size={18} className="mr-1.5" /> DECLINE
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleAccept}
          isLoading={isAccepting}
          disabled={isAccepting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-black tracking-wider text-white shadow-md shadow-emerald-500/20"
        >
          <CheckCircle2 size={18} className="mr-1.5" /> ACCEPT RIDE
        </Button>
      </div>
    </Card>
  );
}
