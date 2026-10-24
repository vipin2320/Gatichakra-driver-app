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
    let ts = 0;
    if (data.createdAt) {
      if (typeof data.createdAt === "string") {
        ts = new Date(data.createdAt).getTime();
      } else if (data.createdAt.seconds) {
        ts = data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1e6;
      }
    }
    rides.push({ id: d.id, parsedTs: ts, ...data });
  });

  rides.sort((a, b) => b.parsedTs - a.parsedTs);

  console.log("Top 15 newest rides overall:");
  rides.slice(0, 15).forEach((r, idx) => {
    console.log(`\n#${idx + 1} ID: ${r.id}`);
    console.log(`Status: ${r.rideStatus}`);
    console.log(`Pickup: ${r.pickupAddress || r.pickupLocation?.address || r.pickup}`);
    console.log(`Destination: ${r.destinationAddress || r.destinationLocation?.address || r.dropAddress}`);
    console.log(`Fare: ${r.estimatedFare}`);
    console.log(`VehicleType: ${r.vehicleType}`);
    console.log(`Parsed Date: ${new Date(r.parsedTs).toISOString()}`);
    console.log(`Raw createdAt:`, r.createdAt);
  });
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
