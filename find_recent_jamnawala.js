import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742");

async function run() {
  const snap = await getDocs(collection(db, "rides"));
  console.log("Total rides:", snap.size);
  const rides = [];
  snap.forEach(d => {
    const data = d.data();
    rides.push({ id: d.id, ...data });
  });

  // Filter for Jamnawala
  const jamnaRides = rides.filter(r => {
    const s = JSON.stringify(r);
    return s.toLowerCase().includes("jamna");
  });
  console.log("Jamnawala rides count:", jamnaRides.length);
  jamnaRides.forEach(r => {
    console.log("=========================================");
    console.log("ID:", r.id);
    console.log("Status:", r.rideStatus);
    console.log("Pickup:", r.pickupAddress, r.pickupLocation);
    console.log("Destination:", r.destinationAddress, r.destinationLocation);
    console.log("Fare:", r.estimatedFare, r.fare);
    console.log("VehicleType:", r.vehicleType);
    console.log("createdAt:", r.createdAt);
    console.log("OTP:", r.otp, r.rideOtp);
    console.log("rejectedBy:", r.rejectedBy);
  });
}
run().catch(console.error);
