import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { DriverRepository } from '../../repositories/driver.repository';
import { VehicleType } from '../../models/types';
import { Button } from '../../widgets/Button';
import { Input } from '../../widgets/Input';
import { Card } from '../../widgets/Card';
import { Car, Tag, Calendar, Palette } from 'lucide-react';

export default function VehicleScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useDriverStore();

  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.E_RICKSHAW);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [manufacturingYear, setManufacturingYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const vehicleOptions = [
    { id: VehicleType.E_RICKSHAW, label: 'E-Rickshaw', desc: 'Zero Emission City Electric Rickshaw' },
    { id: VehicleType.MOTO_BIKE, label: 'Moto Bike', desc: 'Fast Single Passenger Two-Wheeler' },
    { id: VehicleType.AUTO_RICKSHAW, label: 'Auto Rickshaw', desc: 'Standard 3-Wheeler Auto' },
    { id: VehicleType.CITY_CAB, label: 'City Cab', desc: 'Comfortable City Taxi Sedan/Hatchback' },
    { id: VehicleType.EV_GREEN_CAB, label: 'EV Green Cab', desc: 'Premium Eco-Friendly EV Passenger Cab' },
  ];

  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile) {
      if (profile.vehicleType) setVehicleType(profile.vehicleType);
      if (profile.vehicleNumber) setVehicleNumber(profile.vehicleNumber);
      if (profile.vehicleModel) setVehicleModel(profile.vehicleModel);
      if (profile.vehicleColor) setVehicleColor(profile.vehicleColor);
      if (profile.manufacturingYear) setManufacturingYear(profile.manufacturingYear);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const normalizedNumber = vehicleNumber.trim().toUpperCase();

    if (!normalizedNumber || normalizedNumber.length < 4) {
      setError('Please enter a valid vehicle registration number (e.g., UP 16 AB 1234).');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await DriverRepository.updateVehicleDetails(
        user.uid,
        vehicleType,
        normalizedNumber,
        vehicleModel,
        vehicleColor,
        manufacturingYear
      );
      navigate('/documents');
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Vehicle Details</h1>
        <p className="text-sm text-slate-500">Step 2 of 4 — Vehicle Category & Registration</p>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <Card elevated className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Select Vehicle Type *
              </label>
              <div className="space-y-2.5">
                {vehicleOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50/70 has-[:checked]:shadow-sm"
                  >
                    <input
                      type="radio"
                      name="vehicleType"
                      value={option.id}
                      checked={vehicleType === option.id}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <div className="ml-3">
                      <span className="font-semibold text-slate-900 block">{option.label}</span>
                      <span className="text-xs text-slate-500 block">{option.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Vehicle Registration Number *"
              placeholder="e.g. UP 16 AB 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              leftIcon={<Car size={20} />}
              required
              className="uppercase tracking-wider font-semibold"
            />

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Additional Vehicle Details (Optional)
              </p>
              
              <Input
                label="Vehicle Model / Brand"
                placeholder="e.g. Mahindra Treo / Bajaj RE / Maruti Swift"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                leftIcon={<Tag size={20} />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Color"
                  placeholder="e.g. Green / Yellow"
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  leftIcon={<Palette size={18} />}
                />
                <Input
                  label="Year"
                  placeholder="e.g. 2023"
                  value={manufacturingYear}
                  onChange={(e) => setManufacturingYear(e.target.value)}
                  leftIcon={<Calendar size={18} />}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

            <Button type="submit" className="w-full mt-4" size="lg" isLoading={isLoading}>
              Save & Continue to Documents
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
