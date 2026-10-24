import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(collection(db, 'drivers'));
  console.log("--- Driver Profiles ---");
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Name: ${data.name} | VehicleType: ${data.vehicleType} | Online: ${data.isOnline} | Available: ${data.isAvailable} | Approved: ${data.isApproved}`);
  });
  process.exit(0);
}
run().catch(console.error);
