const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// handleStartTripWithOtp
const startTripRegex = /const handleStartTripWithOtp = async \(\) => \{[\s\S]*?else \{\s*setOtpError\(true\);\s*\}\s*\};/m;
const newStartTrip = `const handleStartTripWithOtp = async () => {
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
code = code.replace(startTripRegex, newStartTrip);

fs.writeFileSync('src/App.tsx', code);
