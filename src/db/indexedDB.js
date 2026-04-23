const DB_NAME = 'SupplyGameDB';
const DB_VERSION = 2; // bumped from v1 to match new schema

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Drop old stores if they exist (v1 migration)
      ['nodes', 'pipes', 'config'].forEach((s) => {
        if (db.objectStoreNames.contains(s)) db.deleteObjectStore(s);
      });
      // New schema
      if (!db.objectStoreNames.contains('gameState')) {
        db.createObjectStore('gameState', { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Persist current game state to IndexedDB.
 * @param {{ warehouses, customers, pipes, currentWeek }} state
 */
export async function saveStateToDB(state) {
  try {
    const db = await openDB();
    const tx = db.transaction('gameState', 'readwrite');
    tx.objectStore('gameState').put({ key: 'state', ...state });
  } catch (err) {
    console.warn('[DB] Save failed:', err);
  }
}

/**
 * Load game state from IndexedDB.
 * @returns {{ warehouses, customers, pipes, currentWeek } | null}
 */
export async function loadFromDB() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('gameState', 'readonly');
      const req = tx.objectStore('gameState').get('state');
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('[DB] Load failed:', err);
    return null;
  }
}

/**
 * Wipe all game data from IndexedDB.
 */
export async function resetDatabase() {
  try {
    const db = await openDB();
    const tx = db.transaction('gameState', 'readwrite');
    tx.objectStore('gameState').clear();
    await new Promise((res) => (tx.oncomplete = res));
  } catch (err) {
    console.warn('[DB] Reset failed:', err);
  }
}
