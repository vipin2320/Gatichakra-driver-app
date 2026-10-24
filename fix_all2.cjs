const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Import getDoc
code = code.replace(
  `import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, setDoc, runTransaction } from 'firebase/firestore';`,
  `import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, setDoc, runTransaction, getDoc } from 'firebase/firestore';`
);

// 2. Add driverProfile state
code = code.replace(
  `  const [driverVehicleType, setDriverVehicleType] = useState<string>("City Cab");`,
  `  const [driverVehicleType, setDriverVehicleType] = useState<string>("City Cab");\n  const [driverProfile, setDriverProfile] = useState<any>(null);`
);

// 3. Populate driverProfile
code = code.replace(
  `          setIsBlocked(false);
          if (data.vehicleType) {`,
  `          setIsBlocked(false);
          setDriverProfile(data);
          if (data.vehicleType) {`
);

// 4. Update hard-coded data in goOnline
// We shouldn't overwrite the driver's profile with 'Ramesh Kumar'. We should only update online status, and location if needed.
const oldGoOnline = `    try {
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(driverRef, {
        driverId: driverId,
        name: 'Ramesh Kumar',
        phone: phoneNumber,
        profilePhotoUrl: 'https://i.pravatar.cc/150?img=11',
        vehicleType: 'City Cab',
        vehicleNumber: 'UP 16 AB 1234',
        vehicleModel: 'Maruti Swift Dzire',
        vehicleColor: 'White',
        isOnline: true,
        isAvailable: true,
        rating: 4.8,
        totalTrips: todayTrips + 120,
        termsAccepted: true,
        termsAcceptedAt: termsAcceptedDate,
        complianceVersion: '2026.1'
      }, { merge: true });`;

const newGoOnline = `    try {
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(driverRef, {
        isOnline: true,
        isAvailable: true,
        termsAccepted: true,
        termsAcceptedAt: termsAcceptedDate,
        complianceVersion: '2026.1'
      }, { merge: true });`;
code = code.replace(oldGoOnline, newGoOnline);

// 5. handleAcceptRide - use driverProfile
const oldAcceptCode = `          transaction.update(rideRef, {
            rideStatus: 'driverAssigned',
            driverId: driverId,
            driverName: 'Ramesh Kumar',
            driverPhone: phoneNumber,
            driverVehicleType: driverVehicleType,
            driverVehicleNumber: 'UP 16 AB 1234',
            driverVehicleModel: 'Maruti Swift Dzire',
            driverCurrentLatitude: driverLat,
            driverCurrentLongitude: driverLng,
            assignedAt: new Date().toISOString()
          });`;
const newAcceptCode = `          transaction.update(rideRef, {
            rideStatus: 'driverAssigned',
            driverId: driverId,
            driverName: driverProfile?.name || driverProfile?.firstName || 'Unknown Driver',
            driverPhone: driverProfile?.phone || driverProfile?.phoneNumber || phoneNumber,
            driverVehicleType: driverProfile?.vehicleType || driverVehicleType,
            driverVehicleNumber: driverProfile?.vehicleNumber || 'Unknown',
            driverVehicleModel: driverProfile?.vehicleModel || 'Unknown',
            driverCurrentLatitude: driverLat,
            driverCurrentLongitude: driverLng,
            assignedAt: new Date().toISOString()
          });`;
code = code.replace(oldAcceptCode, newAcceptCode);

// 6. handleArrivedPickup - ensure DB update BEFORE UI update
const oldArrivedCode = `  const handleArrivedPickup = async () => {
    setRideStage('at_pickup_otp');
    voiceGuidance.speak(t.voiceArrivedPickup, mapNavLanguage);
    if (acceptedRide) {
      try {
        await updateDoc(doc(db, 'rides', acceptedRide.id), { 
          rideStatus: 'driverArrived' 
        });
      } catch(e) {}
    }
  };`;
const newArrivedCode = `  const handleArrivedPickup = async () => {
    if (!acceptedRide) return;
    try {
      await updateDoc(doc(db, 'rides', acceptedRide.id), { 
        rideStatus: 'driverArrived' 
      });
      setRideStage('at_pickup_otp');
      voiceGuidance.speak(t.voiceArrivedPickup, mapNavLanguage);
    } catch(e) {
      alert("Error updating status. Please check your connection.");
    }
  };`;
code = code.replace(oldArrivedCode, newArrivedCode);

// 7. handleStartTripWithOtp - Validate OTP & ensure DB update BEFORE UI update
const oldStartTripCode = `  const handleStartTripWithOtp = async () => {
    if (otpInput.length === 4) {
      setOtpError(false);
      setRideStage('in_trip');
      setOtpInput('');
      voiceGuidance.speak(t.voiceTripStarted, mapNavLanguage);
      if (acceptedRide) {
        try {
          await updateDoc(doc(db, 'rides', acceptedRide.id), { 
            rideStatus: 'rideStarted' 
          });
        } catch(e) {}
      }
    } else {
      setOtpError(true);
    }
  };`;
const newStartTripCode = `  const handleStartTripWithOtp = async () => {
    if (!acceptedRide) return;
    if (otpInput.length === 4) {
      try {
        const rideDoc = await getDoc(doc(db, 'rides', acceptedRide.id));
        if (!rideDoc.exists()) throw new Error("Ride not found");
        
        // Match OTP (fallback to '1234' for legacy test rides)
        const expectedOtp = rideDoc.data().otp || rideDoc.data().rideOtp || '1234';
        
        if (otpInput === String(expectedOtp)) {
          await updateDoc(doc(db, 'rides', acceptedRide.id), { 
            rideStatus: 'rideStarted' 
          });
          setOtpError(false);
          setRideStage('in_trip');
          setOtpInput('');
          voiceGuidance.speak(t.voiceTripStarted, mapNavLanguage);
        } else {
          setOtpError(true);
        }
      } catch (e) {
        console.warn("OTP Error", e);
        alert("Error verifying OTP. Please try again.");
      }
    } else {
      setOtpError(true);
    }
  };`;
code = code.replace(oldStartTripCode, newStartTripCode);

// 8. handleEndTrip - ensure DB update BEFORE UI update
const oldEndTripCode = `  const handleEndTrip = async () => {
    setRideStage('bill_payment');
    voiceGuidance.speak(t.voiceReachedDrop, mapNavLanguage);
    if (acceptedRide) {
      try {
        await updateDoc(doc(db, 'rides', acceptedRide.id), { 
          rideStatus: 'rideCompleted' 
        });
      } catch(e) {}
    }
  };`;
const newEndTripCode = `  const handleEndTrip = async () => {
    if (!acceptedRide) return;
    try {
      await updateDoc(doc(db, 'rides', acceptedRide.id), { 
        rideStatus: 'rideCompleted' 
      });
      setRideStage('bill_payment');
      voiceGuidance.speak(t.voiceReachedDrop, mapNavLanguage);
    } catch(e) {
      alert("Error completing trip. Please check connection.");
    }
  };`;
code = code.replace(oldEndTripCode, newEndTripCode);

// 9. handleCompleteRide - ensure driver is made available AFTER successful UI finish
const oldCompleteRideCode = `  const handleCompleteRide = async () => {
    setRideStage('finished');
    voiceGuidance.speak(t.voicePaymentCollected, mapNavLanguage);
    
    // Set driver back to available
    try { 
      await updateDoc(doc(db, 'drivers', driverId), { isAvailable: true }); 
    } catch(e) {}
    
    setTimeout(() => {
      setAcceptedRide(null);
      setRideStage('pickup_nav');
      setIncomingRide(null);
    }, 2000);
  };`;
const newCompleteRideCode = `  const handleCompleteRide = async () => {
    try { 
      await updateDoc(doc(db, 'drivers', driverId), { isAvailable: true }); 
      setRideStage('finished');
      voiceGuidance.speak(t.voicePaymentCollected, mapNavLanguage);
      
      setTimeout(() => {
        setAcceptedRide(null);
        setRideStage('pickup_nav');
        setIncomingRide(null);
      }, 2000);
    } catch(e) {
      alert("Error making driver available. Please try again.");
    }
  };`;
code = code.replace(oldCompleteRideCode, newCompleteRideCode);

fs.writeFileSync('src/App.tsx', code);
