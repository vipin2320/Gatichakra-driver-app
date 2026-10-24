import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../providers/authProvider';
import { useDriverStore } from '../../providers/driverProvider';
import { DriverRepository } from '../../repositories/driver.repository';
import { StorageService } from '../../services/storage.service';
import { DocumentRepository } from '../../repositories/document.repository';
import { Button } from '../../widgets/Button';
import { Input } from '../../widgets/Input';
import { Card } from '../../widgets/Card';
import { User, Phone, Camera, Upload } from 'lucide-react';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useDriverStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile(user.uid);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.profilePhotoUrl) setProfilePhotoUrl(profile.profilePhotoUrl);
    } else if (user?.phoneNumber) {
      setPhone(user.phoneNumber);
    } else if (user?.email) {
      // If signed in via email/phone mock
      if (!phone) setPhone(user.email.split('@')[0]);
    }
  }, [profile, user]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    setError('');
    setUploadProgress(10);

    try {
      const url = await StorageService.uploadDocument(user.uid, 'profile', file, (progress) => {
        setUploadProgress(progress);
      });
      setProfilePhotoUrl(url);
      await DocumentRepository.saveDocumentUrl(user.uid, 'profile', url);
    } catch (err: any) {
      setError('Failed to upload profile photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setError('Please enter a valid full name (minimum 2 characters).');
      return;
    }

    if (trimmedPhone.length < 5) {
      setError('Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await DriverRepository.createDriverProfile(user.uid, trimmedPhone, trimmedName, profilePhotoUrl);
      navigate('/vehicle');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white px-6 py-4 shadow-sm border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Driver Profile</h1>
        <p className="text-sm text-slate-500">Step 1 of 4 — Basic Information</p>
      </div>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        <Card elevated className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="h-28 w-28 rounded-full bg-slate-100 border-2 border-sky-500 flex items-center justify-center overflow-hidden shadow-sm">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400" />
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 h-9 w-9 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors"
              >
                <Camera size={18} />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>
            
            {isUploadingPhoto && (
              <div className="w-full mt-3">
                <div className="text-xs text-slate-500 text-center mb-1">Uploading... {uploadProgress}%</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            
            <p className="text-xs text-slate-500 mt-2">Tap camera icon to upload profile photo (optional)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={20} />}
              required
            />
            <Input
              label="Phone Number *"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={20} />}
              required
            />

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

            <Button type="submit" className="w-full mt-8" size="lg" isLoading={isLoading || isUploadingPhoto}>
              Save & Continue to Vehicle
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
