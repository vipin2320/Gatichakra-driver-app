import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742");

async function run() {
  const snap = await getDocs(collection(db, "rides"));
  const vtypes = new Set();
  const pairs = [];
  snap.forEach(d => {
    const data = d.data();
    vtypes.add(data.vehicleType);
    if (!d.id.startsWith("sim_")) {
      pairs.push({ id: d.id, vehicleType: data.vehicleType, status: data.rideStatus });
    }
  });
  console.log("All unique vehicleType in rides:", Array.from(vtypes));
  console.log("Recent 15 non-sim rides vehicle types:", pairs.slice(-15));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
