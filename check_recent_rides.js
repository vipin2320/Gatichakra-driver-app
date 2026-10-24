import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const querySnapshot = await getDocs(collection(db, 'rides'));
  console.log("--- Recent 5 Rides Raw Data ---");
  const list = [];
  querySnapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() });
  });
  list.slice(-5).forEach(r => {
    console.log(`ID: ${r.id} | Data:`, JSON.stringify(r));
    console.log("-----------------------");
  });
  process.exit(0);
}
run().catch(console.error);
