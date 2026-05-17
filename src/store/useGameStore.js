import { create } from 'zustand';
import { refreshProjections } from '../simulation/projections';
import { advancePeriodLogic, goBackPeriodLogic } from '../simulation/periodAdvance';
import { saveStateToDB, resetDatabase as dbReset, saveInitialToDB, loadInitialFromDB } from '../db/firebase';

/**
 * Central game store.
 * warehouses: { [name]: { position:[x,y,z], currentStock:number, initialStock:number, history:[] } }
 * customers:  { [name]: { position:[x,y,z], history:[] } }
 * pipes:      [{ id, from, to, leadTime }]
 */
const useGameStore = create((set, get) => ({
  // ── Data ───────────────────────────────────────────────
  warehouses: {},
  customers: {},
  vendors: {},
  pipes: [],

  // ── Time ───────────────────────────────────────────────
  currentPeriod: 1,
  timeBucket: 'Week', // 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  timelineLength: 100,
  periodDuration: 5,  // seconds per period (user-configurable)
  isPaused: false,
  lastPeriodTime: 0,

  // ── Projection cache (invalidated each period) ───────────
  _projCache: null,
  lastProjectionPeriod: -1,

  // ── App mode & history ─────────────────────────────────
  // appMode: 'saved' | 'simulation'
  // 'saved'      → every mutation auto-saves to Firebase
  // 'simulation' → mutations are in-memory only; closing & reopening restores last saved state
  appMode: 'saved',
  _history: [],        // undo stack — array of {warehouses,customers,vendors,pipes} snapshots (max 50)
  _simBaseline: null,  // deep-copy of state at the moment simulation was entered

  // ── Hydrate from DB ─────────────────────────────────────
  hydrate: (data) => set({ ...data, _projCache: null, lastProjectionPeriod: -1 }),

  // ── Snapshot helpers ────────────────────────────────────
  /** Deep-copy the four mutable collections (used for undo & simulation baseline). */
  _snapshot: () => {
    const s = get();
    return {
      warehouses: JSON.parse(JSON.stringify(s.warehouses)),
      customers:  JSON.parse(JSON.stringify(s.customers)),
      vendors:    JSON.parse(JSON.stringify(s.vendors)),
      pipes:      JSON.parse(JSON.stringify(s.pipes)),
    };
  },

  /** Push current state onto the undo stack (call BEFORE any mutation). */
  pushHistory: () => {
    const snap = get()._snapshot();
    set((s) => ({ _history: [...s._history.slice(-49), snap] }));
  },

  /** Undo the last pushed snapshot (works in both modes). */
  undo: () => {
    const s = get();
    if (s._history.length === 0) return;
    const prev = s._history[s._history.length - 1];
    set({ ...prev, _history: s._history.slice(0, -1), _projCache: null });
    if (s.appMode === 'saved') get()._persist();
  },

  // ── Simulation mode ─────────────────────────────────────
  /** Switch to Simulation — all changes are in-memory until Save or Discard. */
  enterSimulation: () => {
    const baseline = get()._snapshot();
    set({ appMode: 'simulation', _simBaseline: baseline });
  },

  /**
   * Exit Simulation.
   * save=true  → commit current state to Firebase, switch to saved.
   * save=false → restore the pre-simulation baseline (Firebase already correct), switch to saved.
   */
  exitSimulation: (save) => {
    if (save) {
      set({ appMode: 'saved', _simBaseline: null });
      get()._persist();
    } else {
      const baseline = get()._simBaseline;
      set({
        ...(baseline ?? {}),
        appMode: 'saved',
        _simBaseline: null,
        _history: [],
        _projCache: null,
        lastProjectionPeriod: -1,
      });
      // Firebase already has the correct saved state — no re-write needed.
    }
  },

  // ── Initial state ────────────────────────────────────────
  /** Write current layout to Firebase as the "Initial" snapshot. */
  saveInitialState: async () => {
    const snap = get()._snapshot();
    await saveInitialToDB(snap);
  },

  /**
   * Load the "Initial" snapshot from Firebase and apply it.
   * In saved mode this also auto-saves (overwriting Firebase with the initial layout).
   * Returns false if no initial snapshot exists yet.
   */
  resetToInitial: async () => {
    const initial = await loadInitialFromDB();
    if (!initial) return false;
    get().pushHistory(); // allow undoing the reset
    set({
      warehouses: initial.warehouses ?? {},
      customers:  initial.customers  ?? {},
      vendors:    initial.vendors    ?? {},
      pipes:      initial.pipes      ?? [],
      _projCache: null,
      lastProjectionPeriod: -1,
    });
    if (get().appMode === 'saved') get()._persist();
    return true;
  },

  // ── Node CRUD ───────────────────────────────────────────
  addWarehouse: (name, position, initialStock = 0) => {
    get().pushHistory();
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      warehouses: {
        ...s.warehouses,
        [name]: { position, currentStock: initialStock, initialStock, history: [], inTransit: [], createdAtPeriod },
      },
      _projCache: null,
    }));
    get()._persist();
  },

  addCustomer: (name, position) => {
    get().pushHistory();
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      customers: { ...s.customers, [name]: { position, history: [], backorder: 0, createdAtPeriod } },
    }));
    get()._persist();
  },

  addPipe: (from, to, leadTime) => {
    get().pushHistory();
    const id = `${from}->${to}-${Date.now()}`;
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({ pipes: [...s.pipes, { id, from, to, leadTime, createdAtPeriod }], _projCache: null }));
    get()._persist();
  },

  deleteWarehouse: (name) => {
    get().pushHistory();
    set((s) => {
      const warehouses = { ...s.warehouses };
      delete warehouses[name];
      const pipes = s.pipes.filter((p) => p.from !== name && p.to !== name);
      return { warehouses, pipes, _projCache: null };
    });
    get()._persist();
  },

  deleteCustomer: (name) => {
    get().pushHistory();
    set((s) => {
      const customers = { ...s.customers };
      delete customers[name];
      const pipes = s.pipes.filter((p) => p.from !== name && p.to !== name);
      return { customers, pipes };
    });
    get()._persist();
  },

  addVendor: (name, position) => {
    get().pushHistory();
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      vendors: { ...s.vendors, [name]: { position, createdAtPeriod } },
    }));
    get()._persist();
  },

  deleteVendor: (name) => {
    get().pushHistory();
    set((s) => {
      const vendors = { ...s.vendors };
      delete vendors[name];
      const pipes = s.pipes.filter((p) => p.from !== name && p.to !== name);
      return { vendors, pipes };
    });
    get()._persist();
  },

  renameVendor: (oldName, newName) => {
    set((s) => {
      const vendors = { ...s.vendors };
      vendors[newName] = { ...vendors[oldName] };
      delete vendors[oldName];
      const pipes = s.pipes.map((p) => ({
        ...p,
        from: p.from === oldName ? newName : p.from,
        to:   p.to   === oldName ? newName : p.to,
      }));
      return { vendors, pipes };
    });
    get()._persist();
  },

  deletePipe: (id) => {
    get().pushHistory();
    set((s) => ({ pipes: s.pipes.filter((p) => p.id !== id), _projCache: null }));
    get()._persist();
  },

  renameWarehouse: (oldName, newName) => {
    set((s) => {
      const warehouses = { ...s.warehouses };
      warehouses[newName] = { ...warehouses[oldName] };
      delete warehouses[oldName];
      const pipes = s.pipes.map((p) => ({
        ...p,
        from: p.from === oldName ? newName : p.from,
        to:   p.to   === oldName ? newName : p.to,
      }));
      return { warehouses, pipes, _projCache: null };
    });
    get()._persist();
  },

  renameCustomer: (oldName, newName) => {
    set((s) => {
      const customers = { ...s.customers };
      customers[newName] = { ...customers[oldName] };
      delete customers[oldName];
      const pipes = s.pipes.map((p) => ({
        ...p,
        from: p.from === oldName ? newName : p.from,
        to:   p.to   === oldName ? newName : p.to,
      }));
      return { customers, pipes };
    });
    get()._persist();
  },

  updatePipeLeadTime: (id, leadTime) => {
    get().pushHistory();
    set((s) => ({
      pipes: s.pipes.map((p) => p.id === id ? { ...p, leadTime } : p),
      _projCache: null,
    }));
    get()._persist();
  },

  updateNodePosition: (name, nodeType, position) => {
    get().pushHistory();
    set((s) => {
      if (nodeType === 'warehouse') {
        return { warehouses: { ...s.warehouses, [name]: { ...s.warehouses[name], position } } };
      }
      if (nodeType === 'customer') {
        return { customers: { ...s.customers, [name]: { ...s.customers[name], position } } };
      }
      if (nodeType === 'vendor') {
        return { vendors: { ...s.vendors, [name]: { ...s.vendors[name], position } } };
      }
      return {};
    });
    get()._persist();
  },

  toggleLock: (name, nodeType) => {
    set((s) => {
      if (nodeType === 'warehouse') {
        const node = s.warehouses[name];
        return { warehouses: { ...s.warehouses, [name]: { ...node, locked: !node.locked } } };
      }
      if (nodeType === 'customer') {
        const node = s.customers[name];
        return { customers: { ...s.customers, [name]: { ...node, locked: !node.locked } } };
      }
      if (nodeType === 'vendor') {
        const node = s.vendors[name];
        return { vendors: { ...s.vendors, [name]: { ...node, locked: !node.locked } } };
      }
      return {};
    });
    get()._persist();
  },

  updateStockLevel: (warehouseName, newStock) => {
    get().pushHistory();
    set((s) => ({
      warehouses: {
        ...s.warehouses,
        [warehouseName]: { ...s.warehouses[warehouseName], initialStock: newStock, currentStock: newStock },
      },
      _projCache: null,
    }));
    get()._persist();
  },

  // ── Time controls ────────────────────────────────────────
  setIsPaused: (isPaused) => set({ isPaused }),
  setLastPeriodTime: (t) => set({ lastPeriodTime: t }),
  setTimeBucket: (timeBucket) => set({ timeBucket }),
  setPeriodDuration: (secs) => set({ periodDuration: Math.max(1, parseFloat(secs) || 5) }),
  setTimelineLength: (length) => {
    const val = Math.max(1, parseInt(length) || 1);
    set((s) => ({
      timelineLength: val,
      currentPeriod: s.currentPeriod > val ? val : s.currentPeriod,
    }));
  },

  advancePeriod: () => {
    const s = get();
    const result = advancePeriodLogic(s);
    const nextPeriod = result.currentPeriod ?? s.currentPeriod + 1;
    set({ ...result, currentPeriod: nextPeriod, _projCache: null, lastProjectionPeriod: -1 });
    get()._persist();
  },

  goBackPeriod: () => {
    const s = get();
    const result = goBackPeriodLogic(s);
    const prevPeriod = result.currentPeriod ?? Math.max(1, s.currentPeriod - 1);
    set({ ...result, currentPeriod: prevPeriod, _projCache: null, lastProjectionPeriod: -1 });
    get()._persist();
  },

  // ── Projections ──────────────────────────────────────────
  getProjections: () => {
    const s = get();
    if (s._projCache && s.lastProjectionPeriod === s.currentPeriod) return s._projCache;
    const p = s.currentPeriod;
    const visWarehouses = Object.fromEntries(Object.entries(s.warehouses).filter(([, wh]) => (wh.createdAtPeriod ?? 1) <= p));
    const visCustomers  = Object.fromEntries(Object.entries(s.customers).filter(([, c])  => (c.createdAtPeriod  ?? 1) <= p));
    const visPipes      = s.pipes.filter(pipe => (pipe.createdAtPeriod ?? 1) <= p);
    const cache = refreshProjections(visWarehouses, visCustomers, visPipes, p);
    set({ _projCache: cache, lastProjectionPeriod: p });
    return cache;
  },

  // ── Persistence ──────────────────────────────────────────
  _persist: () => {
    const state = get();
    if (state.appMode !== 'saved') return; // simulation → never auto-save
    saveStateToDB({
      warehouses: state.warehouses,
      customers:  state.customers,
      vendors:    state.vendors,
      pipes:      state.pipes,
      currentPeriod: state.currentPeriod,
    });
  },

  resetGame: async () => {
    if (!window.confirm('Clear all game data and restart?')) return;
    await dbReset();
    set({
      warehouses: {}, customers: {}, vendors: {}, pipes: [],
      currentPeriod: 1, isPaused: false, lastPeriodTime: 0,
      _projCache: null, lastProjectionPeriod: -1,
    });
  },
}));

export default useGameStore;
