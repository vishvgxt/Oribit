import { makeInitialState, safeMergeState, normalizeLegacyTasks, SCHEMA_VERSION } from './domain.js';
const DB_NAME = 'orbit-jee-student-os';
const DB_VERSION = 1;
const STORE = 'documents';
const STATE_KEY = 'primary-state';
const RECOVERY_PREFIX = 'recovery-snapshot-';
const FALLBACK_KEY = 'orbit-jee-state-v3';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB is unavailable in this browser.'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local database.'));
  });
}
function requestPromise(request) { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error || new Error('Database operation failed.')); }); }
async function idbGet(key) { const db = await openDB(); try { return await requestPromise(db.transaction(STORE, 'readonly').objectStore(STORE).get(key)); } finally { db.close(); } }
async function idbPut(key, value) { const db = await openDB(); try { await requestPromise(db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)); } finally { db.close(); } }

export const StorageService = {
  mode: 'indexeddb',
  async load() {
    try {
      const stored = await idbGet(STATE_KEY);
      if (stored) { this.mode = 'indexeddb'; return safeMergeState(stored); }
    } catch (error) { console.warn('IndexedDB unavailable; trying localStorage fallback.', error); }
    try {
      const fallback = localStorage.getItem(FALLBACK_KEY);
      if (fallback) { this.mode = 'localstorage'; return safeMergeState(JSON.parse(fallback)); }
    } catch (error) { console.warn('Could not read local backup.', error); }
    const state = makeInitialState();
    try { const oldTheme = localStorage.getItem('orbit-theme'); if (oldTheme === 'light' || oldTheme === 'dark') state.settings.theme = oldTheme; } catch {}
    // Preserve the legacy array before migrating it. Never delete the source key.
    try {
      const legacyText = localStorage.getItem('orbit-tasks-v1');
      if (legacyText) {
        const legacy = JSON.parse(legacyText);
        const backupKey = `orbit-tasks-v1-backup-${new Date().toISOString().replace(/[:.]/g,'-')}`;
        localStorage.setItem(backupKey, legacyText);
        state.tasks = normalizeLegacyTasks(legacy);
        state.migratedLegacy = true;
        state.audit.push({ id: `migration_${Date.now()}`, at: new Date().toISOString(), action: 'legacy-task-migration', detail: `Migrated ${state.tasks.length} tasks from orbit-tasks-v1; original preserved at ${backupKey}.` });
      }
    } catch (error) { console.error('Legacy migration failed; source data remains untouched.', error); throw new Error('Legacy task migration could not be completed. Your original orbit-tasks-v1 data was left unchanged. Export or copy it before retrying.'); }
    await this.save(state);
    return state;
  },
  async save(state) {
    const payload = { ...state, version: SCHEMA_VERSION, savedAt: new Date().toISOString() };
    try { await idbPut(STATE_KEY, payload); this.mode = 'indexeddb';
      // Maintain a small best-effort fallback copy; do not let a stale snapshot masquerade as current.
      try { const serialized = JSON.stringify(payload); if (serialized.length <= 1_500_000) localStorage.setItem(FALLBACK_KEY, serialized); else localStorage.removeItem(FALLBACK_KEY); } catch { try { localStorage.removeItem(FALLBACK_KEY); } catch {} }
      return; }
    catch (error) {
      console.warn('IndexedDB save failed; using localStorage fallback.', error);
      try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload)); this.mode = 'localstorage'; return; }
      catch (fallbackError) { throw new Error(`Saving failed. Browser storage may be full or disabled. Export a backup and free space. (${fallbackError.message})`); }
    }
  },
  async backup() {
    const state = await this.load();
    return { app: 'Orbit JEE Student OS', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: state };
  },
  async clearAll(blankState) {
    try {
      const db = await openDB();
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          const store = tx.objectStore(STORE);
          store.clear();
          store.put({ ...blankState, version: SCHEMA_VERSION, savedAt: new Date().toISOString() }, STATE_KEY);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error || new Error('Could not clear local database.'));
          tx.onabort = () => reject(tx.error || new Error('Local data clearing was aborted.'));
        });
        this.mode = 'indexeddb';
      } finally { db.close(); }
    } catch (error) {
      try { localStorage.setItem(FALLBACK_KEY, JSON.stringify({ ...blankState, version: SCHEMA_VERSION, savedAt: new Date().toISOString() })); this.mode = 'localstorage'; }
      catch (fallbackError) { throw new Error(`Could not clear local data safely. ${fallbackError.message}`); }
    }
    try {
      for (const key of Object.keys(localStorage)) {
        if (key === FALLBACK_KEY || key === 'orbit-tasks-v1' || key === 'orbit-theme' || key === 'orbit-jee-latest-recovery-key' || key.startsWith('orbit-tasks-v1-backup-') || key.startsWith(`orbit-jee-${RECOVERY_PREFIX}`)) localStorage.removeItem(key);
      }
    } catch {}
    // The cleared blank workspace remains in IndexedDB when available. Restore it after clearing localStorage keys.
    if (this.mode === 'indexeddb') await idbPut(STATE_KEY, { ...blankState, version: SCHEMA_VERSION, savedAt: new Date().toISOString() });
  },
  async importBackup(parsed, mode = 'merge') {
    if (!parsed || typeof parsed !== 'object' || parsed.app !== 'Orbit JEE Student OS' || !parsed.data || typeof parsed.data !== 'object') throw new Error('This file is not a valid Orbit JEE Student OS backup.');
    if (![2,3].includes(Number(parsed.schemaVersion || parsed.data.version))) throw new Error('Unsupported backup schema version. Export a fresh backup from the current app version.');
    const allowedArrays = ['subjects','chapters','topics','goals','tasks','sessions','modules','attempts','notes','revisions','revisionEvents','tests','calendarEvents','audit'];
    for (const key of allowedArrays) {
      if (parsed.data[key] !== undefined && !Array.isArray(parsed.data[key])) throw new Error(`Invalid backup: “${key}” must be a list.`);
      if (Array.isArray(parsed.data[key]) && parsed.data[key].some(row => !row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !row.id)) throw new Error(`Invalid backup: every “${key}” record must be an object with an ID.`);
      if (Array.isArray(parsed.data[key])) { const ids = parsed.data[key].map(row => row.id); if (new Set(ids).size !== ids.length) throw new Error(`Invalid backup: duplicate IDs were found in “${key}”.`); }
    }
    if (parsed.data.activityTypes !== undefined && (!Array.isArray(parsed.data.activityTypes) || parsed.data.activityTypes.some(x => typeof x !== 'string'))) throw new Error('Invalid backup: activity types must be a list of text labels.');
    const imported = safeMergeState(parsed.data);
    const current = await this.load();
    // Keep an independent recovery snapshot so a replacement cannot overwrite it.
    const recoveryKey = `${RECOVERY_PREFIX}${new Date().toISOString().replace(/[:.]/g,'-')}`;
    const snapshot = { ...current, audit: [...current.audit, { id: `backup_${Date.now()}`, at: new Date().toISOString(), action: 'pre-import-backup', detail: `Recovery snapshot saved as ${recoveryKey}.` }] };
    try { await idbPut(recoveryKey, snapshot); } catch { try { localStorage.setItem(`orbit-jee-${recoveryKey}`, JSON.stringify(snapshot)); } catch (error) { throw new Error(`Could not save a recovery snapshot; import cancelled. ${error.message}`); } }
    try { localStorage.setItem('orbit-jee-latest-recovery-key', recoveryKey); } catch {}
    let next = imported;
    if (mode === 'merge') {
      next = safeMergeState(current);
      for (const key of ['subjects','chapters','topics','goals','tasks','sessions','modules','attempts','notes','revisions','revisionEvents','tests','calendarEvents','audit']) {
        const seen = new Set(next[key].map(x => x.id));
        next[key] = [...next[key], ...imported[key].filter(x => x && x.id && !seen.has(x.id))];
      }
      next.profile = { ...next.profile, ...imported.profile };
      next.settings = { ...next.settings, ...imported.settings };
    }
    next.audit.push({ id: `import_${Date.now()}`, at: new Date().toISOString(), action: 'backup-import', detail: `Imported backup using ${mode} mode.` });
    await this.save(next);
    return next;
  },
  async restoreLatestRecovery() {
    let key = null;
    try { key = localStorage.getItem('orbit-jee-latest-recovery-key'); } catch {}
    if (!key) throw new Error('No recovery snapshot is recorded in this browser.');
    let snapshot = null;
    try { snapshot = await idbGet(key); } catch {}
    if (!snapshot) {
      try { const raw = localStorage.getItem(`orbit-jee-${key}`); if (raw) snapshot = JSON.parse(raw); } catch {}
    }
    if (!snapshot || typeof snapshot !== 'object') throw new Error('The latest recovery snapshot could not be found. Export a backup before making more changes.');
    const restored = safeMergeState(snapshot);
    restored.audit.push({ id: `recovery_${Date.now()}`, at: new Date().toISOString(), action: 'restored-pre-import-snapshot', detail: `Restored ${key}.` });
    await this.save(restored);
    return restored;
  },
  hasRecoverySnapshot() {
    try { return Boolean(localStorage.getItem('orbit-jee-latest-recovery-key')); } catch { return false; }
  }
};
