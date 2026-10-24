import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742");

async function run() {
  console.log("Searching all rides for Jamnawala or non-sim_ride...");
  const snap = await getDocs(collection(db, "rides"));
  console.log("Total rides in collection 'rides':", snap.size);
  let found = 0;
  snap.forEach(doc => {
    const d = doc.data();
    const str = JSON.stringify(d);
    if (!doc.id.startsWith("sim_") || str.includes("Jamna") || str.includes("jamna")) {
      found++;
      console.log("======================================");
      console.log("MATCH ID:", doc.id);
      console.log("Data:", JSON.stringify(d, null, 2));
    }
  });
  console.log("Found non-sim or matching rides:", found);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
