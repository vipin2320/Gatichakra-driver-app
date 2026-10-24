import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Initialize Firebase Admin with explicit databaseId
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
db.settings({ databaseId: 'ai-studio-gatichakra-5a38b21e-1674-4c9e-af51-9e54bfaa4742' });

async function run() {
  try {
    const snapshot = await db.collection('rides').orderBy('createdAt', 'desc').limit(5).get();
    snapshot.forEach(doc => {
      console.log(doc.id, '=> type:', doc.data().vehicleType, 'status:', doc.data().rideStatus);
    });
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}
run();
