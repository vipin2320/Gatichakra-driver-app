const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. handleAcceptRide -> set isAvailable: false
code = code.replace(
  `setAcceptedRide(incomingRide);
        setIncomingRide(null);`,
  `try { await updateDoc(doc(db, 'drivers', driverId), { isAvailable: false }); } catch(e) {}
        setAcceptedRide(incomingRide);
        setIncomingRide(null);`
);

// 2. handleEndRide / finish -> set isAvailable: true
const oldEndRide = `const handleCompleteRide = async () => {
    setRideStage('finished');
    voiceGuidance.speak(t.voicePaymentCollected, mapNavLanguage);
    setTimeout(() => {
      setAcceptedRide(null);
      setRideStage('pickup_nav');
      setIncomingRide(null);
    }, 2000);
  };`;

const newEndRide = `const handleCompleteRide = async () => {
    setRideStage('finished');
    voiceGuidance.speak(t.voicePaymentCollected, mapNavLanguage);
    try { await updateDoc(doc(db, 'drivers', driverId), { isAvailable: true }); } catch(e) {}
    setTimeout(() => {
      setAcceptedRide(null);
      setRideStage('pickup_nav');
      setIncomingRide(null);
    }, 2000);
  };`;
code = code.replace(oldEndRide, newEndRide);

// 3. handleRejectRide (no change needed to isAvailable, but they should remain available)
// 4. Cancel ride by driver -> set isAvailable: true
const oldCancelCode = `const handleCancelRide = async () => {
    if (acceptedRide) {
      try {
        await updateDoc(doc(db, 'rides', acceptedRide.id), {
          rideStatus: 'cancelled_by_driver',
          cancellationReason: cancelReason
        });
      } catch (e) {
        // quiet catch
      }
    }
    setAcceptedRide(null);
    setRideStage('pickup_nav');
    setShowCancelModal(false);
    setCancelReason('');
  };`;
const newCancelCode = `const handleCancelRide = async () => {
    if (acceptedRide) {
      try {
        await updateDoc(doc(db, 'rides', acceptedRide.id), {
          rideStatus: 'cancelled_by_driver',
          cancellationReason: cancelReason
        });
        await updateDoc(doc(db, 'drivers', driverId), { isAvailable: true });
      } catch (e) {
        // quiet catch
      }
    }
    setAcceptedRide(null);
    setRideStage('pickup_nav');
    setShowCancelModal(false);
    setCancelReason('');
  };`;
code = code.replace(oldCancelCode, newCancelCode);

fs.writeFileSync('src/App.tsx', code);
