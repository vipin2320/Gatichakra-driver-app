import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742");

async function run() {
  const q = query(collection(db, "rides"), limit(5));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, "=> otp:", doc.data().otp, "rideOtp:", doc.data().rideOtp);
  });
  process.exit(0);
}
run();
