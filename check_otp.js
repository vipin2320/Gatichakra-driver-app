import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
db.settings({ databaseId: 'ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742' });

async function run() {
  const snap = await db.collection('rides').limit(5).get();
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().otp, doc.data().rideOtp);
  });
  process.exit(0);
}
run();
