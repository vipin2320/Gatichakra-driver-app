import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(5)));
    const customersSnap = await getDocs(query(collection(db, 'customers'), limit(5)));
    const ridesSnap = await getDocs(query(collection(db, 'rides'), limit(5)));
    
    console.log("--- Users ---");
    usersSnap.forEach(doc => console.log(doc.id, doc.data()));
    
    console.log("--- Customers ---");
    customersSnap.forEach(doc => console.log(doc.id, doc.data()));

    console.log("--- Rides (To see if addresses are saved) ---");
    ridesSnap.forEach(doc => console.log(doc.id, doc.data()));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
