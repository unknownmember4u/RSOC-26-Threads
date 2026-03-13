import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '@/config/firebaseConfig';

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

export async function getLatestData() {
  const snap = await getDocs(query(collection(db, 'processed_data'), orderBy('timestamp', 'desc'), limit(10)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPredictions() {
  const snap = await getDocs(collection(db, 'predictions'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAlerts() {
  const snap = await getDocs(query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(50)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getClusters() {
  const snap = await getDocs(collection(db, 'clusters'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getLiveData() {
  const snap = await getDocs(query(collection(db, 'live_data'), orderBy('timestamp', 'desc'), limit(10)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
