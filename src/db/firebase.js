import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const GAME_REF    = () => doc(db, 'games', 'default');
const INITIAL_REF = () => doc(db, 'games', 'initial');

export async function saveStateToDB({ warehouses, customers, vendors, pipes, currentPeriod }) {
  try {
    await setDoc(GAME_REF(), { warehouses, customers, vendors: vendors ?? {}, pipes, currentPeriod });
  } catch (err) {
    console.warn('[Firebase] Save failed:', err);
  }
}

/** Save the current layout as the "Initial" snapshot (the Reset target). */
export async function saveInitialToDB(snapshot) {
  try {
    await setDoc(INITIAL_REF(), snapshot);
  } catch (err) {
    console.warn('[Firebase] Save initial failed:', err);
  }
}

/** Load the "Initial" snapshot, or null if none has been set. */
export async function loadInitialFromDB() {
  try {
    const snap = await getDoc(INITIAL_REF());
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('[Firebase] Load initial failed:', err);
    return null;
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
