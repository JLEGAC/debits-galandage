const DATABASE = "preparation-debits-local";
const VERSION = 1;
const STORE = "configuration";
const RECORD = "active";
const FALLBACK_KEY = "preparation-debits.configuration.v1";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function loadLocalConfiguration() {
  try {
    if ("indexedDB" in globalThis) return await transact("readonly", store => store.get(RECORD)) ?? null;
  } catch { /* repli localStorage si IndexedDB est indisponible */ }
  try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "null"); }
  catch { return null; }
}

export async function saveLocalConfiguration(config) {
  try {
    if ("indexedDB" in globalThis) {
      await transact("readwrite", store => store.put(config, RECORD));
      return;
    }
  } catch { /* repli localStorage */ }
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(config));
}

export async function removeLocalConfiguration() {
  try {
    if ("indexedDB" in globalThis) await transact("readwrite", store => store.delete(RECORD));
  } catch { /* nettoyage du repli ci-dessous */ }
  try { localStorage.removeItem(FALLBACK_KEY); } catch { /* stockage local inaccessible */ }
}
