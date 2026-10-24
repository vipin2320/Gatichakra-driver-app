import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const ridesSnap = await getDocs(query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(5)));
    
    console.log("--- Latest 5 Rides ---");
    ridesSnap.forEach(doc => {
      console.log("ID:", doc.id, "Data:", JSON.stringify(doc.data()));
    });
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
