const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGoOnline = `    setIsOnline(true);
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(driverRef, {
        isOnline: true,
        isAvailable: true,
        termsAccepted: true,
        termsAcceptedAt: termsAcceptedDate,
        complianceVersion: '2026.1'
      }, { merge: true });
    } catch (error) {
      console.warn("Firestore driver online update:", error);
    }`;

const newGoOnline = `    try {
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(driverRef, {
        isOnline: true,
        isAvailable: true,
        termsAccepted: true,
        termsAcceptedAt: termsAcceptedDate,
        complianceVersion: '2026.1'
      }, { merge: true });
      setIsOnline(true);
    } catch (error) {
      console.warn("Firestore driver online update:", error);
      alert("Failed to go online. Please check your network connection.");
    }`;
    
const oldGoOffline = `    setIsOnline(false);
    setIncomingRide(null);
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        isOnline: false,
        isAvailable: false
      });
    } catch (error) {
      console.warn("Firestore driver offline update:", error);
    }`;

const newGoOffline = `    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        isOnline: false,
        isAvailable: false
      });
      setIsOnline(false);
      setIncomingRide(null);
    } catch (error) {
      console.warn("Firestore driver offline update:", error);
      alert("Failed to go offline. Please check your network connection.");
    }`;

code = code.replace(oldGoOnline, newGoOnline);
code = code.replace(oldGoOffline, newGoOffline);

fs.writeFileSync('src/App.tsx', code);
