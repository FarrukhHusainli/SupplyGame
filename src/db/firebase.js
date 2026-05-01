import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const GAME_REF = () => doc(db, 'games', 'default');

export async function saveStateToDB({ warehouses, customers, pipes, currentPeriod }) {
  try {
    await setDoc(GAME_REF(), { warehouses, customers, pipes, currentPeriod });
  } catch (err) {
    console.warn('[Firebase] Save failed:', err);
  }
}

export async function loadFromDB() {
  try {
    const snap = await getDoc(GAME_REF());
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('[Firebase] Load failed:', err);
    return null;
  }
}

export async function resetDatabase() {
  try {
    await deleteDoc(GAME_REF());
  } catch (err) {
    console.warn('[Firebase] Reset failed:', err);
  }
}
