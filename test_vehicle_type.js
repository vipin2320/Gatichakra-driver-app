import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  console.log("Checking recent rides...");
  const q = query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().vehicleType, doc.data().rideStatus);
  });
  process.exit(0);
}
run();
