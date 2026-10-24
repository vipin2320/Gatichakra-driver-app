import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const savedLocs = await getDocs(query(collection(db, 'savedLocations'), limit(1)));
    const addresses = await getDocs(query(collection(db, 'addresses'), limit(1)));
    
    console.log("--- savedLocations ---");
    savedLocs.forEach(doc => console.log(doc.id, doc.data()));
    
    console.log("--- addresses ---");
    addresses.forEach(doc => console.log(doc.id, doc.data()));
    
    process.exit(0);
  } catch (e) {
    console.log("Error or no collection");
    process.exit(1);
  }
}
check();
