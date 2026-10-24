import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "rides"), orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
  process.exit(0);
}
run();
