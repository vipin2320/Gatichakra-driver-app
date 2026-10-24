const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Transaction-based Accept Ride
const oldAcceptCode = `  const handleAcceptRide = async () => {
    notificationService.stopRinging();
    notificationService.playSuccessChime();

    if (incomingRide) {
      try {
        const rideRef = doc(db, 'rides', incomingRide.id);
        await updateDoc(rideRef, {
          rideStatus: 'driverAssigned',
          driverId: driverId,
          driverName: 'Ramesh Kumar',
          driverPhone: phoneNumber,
          driverVehicleNumber: 'UP 16 AB 1234',
          driverVehicleModel: 'Maruti Swift Dzire',
          driverCurrentLatitude: driverLat,
          driverCurrentLongitude: driverLng,
          acceptedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Direct update fallback:", e);
      }
      setAcceptedRide(incomingRide);
      setIncomingRide(null);
      setRideStage('pickup_nav');`;

const newAcceptCode = `  const handleAcceptRide = async () => {
    notificationService.stopRinging();
    notificationService.playSuccessChime();

    if (incomingRide) {
      try {
        const rideRef = doc(db, 'rides', incomingRide.id);
        await runTransaction(db, async (transaction) => {
          const rideDoc = await transaction.get(rideRef);
          if (!rideDoc.exists()) {
            throw "Ride does not exist!";
          }
          if (rideDoc.data().rideStatus !== 'searching') {
            throw "Ride is no longer available.";
          }
          transaction.update(rideRef, {
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
          });
        });
        setAcceptedRide(incomingRide);
        setIncomingRide(null);
        setRideStage('pickup_nav');
      } catch (e) {
        alert(typeof e === 'string' ? e : "Error accepting ride");
        setIncomingRide(null);
      }
`;
code = code.replace(oldAcceptCode, newAcceptCode);

// 2. Add vehicle type checking to the listener
const oldListenerCode = `        if (data.rejectedBy !== driverId) {
          rides.push({`;
const newListenerCode = `        if (data.rejectedBy !== driverId) {
          if (data.vehicleType && data.vehicleType !== driverVehicleType) return;
          rides.push({`;
code = code.replace(oldListenerCode, newListenerCode);

// 3. Arrived at pickup
const oldArrivedCode = `onClick={() => {
                    setRideStage('at_pickup_otp');
                    voiceGuidance.speak(t.voiceArrivedPickup, mapNavLanguage);
                  }}`;
const newArrivedCode = `onClick={async () => {
                    setRideStage('at_pickup_otp');
                    voiceGuidance.speak(t.voiceArrivedPickup, mapNavLanguage);
                    if (acceptedRide) {
                      try {
                        await updateDoc(doc(db, 'rides', acceptedRide.id), { rideStatus: 'driverArrived' });
                      } catch(e) {}
                    }
                  }}`;
code = code.replace(oldArrivedCode, newArrivedCode);

// 4. Start trip with OTP
const oldStartTripCode = `  const handleStartTripWithOtp = () => {
    if (otpInput.length === 4) {
      setOtpError(false);
      setRideStage('in_trip');
      setOtpInput('');
      voiceGuidance.speak(t.voiceTripStarted, mapNavLanguage);
    } else {
      setOtpError(true);
    }
  };`;
const newStartTripCode = `  const handleStartTripWithOtp = async () => {
    if (otpInput.length === 4) {
      setOtpError(false);
      setRideStage('in_trip');
      setOtpInput('');
      voiceGuidance.speak(t.voiceTripStarted, mapNavLanguage);
      if (acceptedRide) {
        try {
          await updateDoc(doc(db, 'rides', acceptedRide.id), { rideStatus: 'rideStarted' });
        } catch(e) {}
      }
    } else {
      setOtpError(true);
    }
  };`;
code = code.replace(oldStartTripCode, newStartTripCode);

// 5. End trip (Bill Payment)
const oldEndTripCode = `onClick={() => {
                    setRideStage('bill_payment');
                    voiceGuidance.speak(t.voiceReachedDrop, mapNavLanguage);
                  }}`;
const newEndTripCode = `onClick={async () => {
                    setRideStage('bill_payment');
                    voiceGuidance.speak(t.voiceReachedDrop, mapNavLanguage);
                    if (acceptedRide) {
                      try {
                        await updateDoc(doc(db, 'rides', acceptedRide.id), { rideStatus: 'rideCompleted' });
                      } catch(e) {}
                    }
                  }}`;
code = code.replace(oldEndTripCode, newEndTripCode);

fs.writeFileSync('src/App.tsx', code);
