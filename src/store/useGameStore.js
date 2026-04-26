import { create } from 'zustand';
import { refreshProjections } from '../simulation/projections';
import { advanceWeekLogic, goBackWeekLogic } from '../simulation/weekAdvance';
import { saveStateToDB, resetDatabase as dbReset } from '../db/indexedDB';

/**
 * Central game store.
 * warehouses: { [name]: { position:[x,y,z], currentStock:number, initialStock:number, history:[] } }
 * customers:  { [name]: { position:[x,y,z], demand:[{original,supplied},...], history:[] } }
 * pipes:      [{ id, from, to, leadTime }]
 */
const useGameStore = create((set, get) => ({
  // ── Data ───────────────────────────────────────────────
  warehouses: {},
  customers: {},
  pipes: [],

  // ── Time ───────────────────────────────────────────────
  currentPeriod: 1,
  timeBucket: 'Week', // 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  timelineLength: 100,
  isPaused: false,
  lastPeriodTime: 0,

  // ── Projection cache (invalidated each week) ────────────
  _projCache: null,
  lastProjectionPeriod: -1,

  // ── Hydrate from DB ─────────────────────────────────────
  hydrate: (data) => set({ ...data, _projCache: null, lastProjectionPeriod: -1 }),

  // ── Node CRUD ───────────────────────────────────────────
  addWarehouse: (name, position, initialStock = 0) => {
    set((s) => ({
      warehouses: {
        ...s.warehouses,
        [name]: { position, currentStock: initialStock, initialStock, history: [] },
      },
      _projCache: null,
    }));
    get()._persist();
  },

  addCustomer: (name, position) => {
    const demand = Array.from({ length: 12 }, () => ({ original: 100, supplied: 0 }));
    set((s) => ({
      customers: { ...s.customers, [name]: { position, demand, history: [] } },
    }));
    get()._persist();
  },

  addPipe: (from, to, leadTime) => {
    const id = `${from}->${to}-${Date.now()}`;
    set((s) => ({ pipes: [...s.pipes, { id, from, to, leadTime }], _projCache: null }));
    get()._persist();
  },

  deleteWarehouse: (name) => {
    set((s) => {
      const warehouses = { ...s.warehouses };
      delete warehouses[name];
      const pipes = s.pipes.filter((p) => p.from !== name && p.to !== name);
      return { warehouses, pipes, _projCache: null };
    });
    get()._persist();
  },

  deleteCustomer: (name) => {
    set((s) => {
      const customers = { ...s.customers };
      delete customers[name];
      const pipes = s.pipes.filter((p) => p.from !== name && p.to !== name);
      return { customers, pipes };
    });
    get()._persist();
  },

  deletePipe: (id) => {
    set((s) => ({ pipes: s.pipes.filter((p) => p.id !== id), _projCache: null }));
    get()._persist();
  },

  updateStockLevel: (warehouseName, newStock) => {
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
  setTimelineLength: (length) => {
    const val = Math.max(1, parseInt(length) || 1);
    set((s) => ({
      timelineLength: val,
      currentPeriod: s.currentPeriod > val ? val : s.currentPeriod,
    }));
  },

  advancePeriod: () => {
    const s = get();
    const result = advanceWeekLogic(s);
    // Ensure currentPeriod is updated even if logic returns currentWeek
    const nextPeriod = result.currentPeriod || result.currentWeek || s.currentPeriod + 1;
    
    set({ ...result, currentPeriod: nextPeriod, _projCache: null, lastProjectionPeriod: -1 });
    get()._persist();
  },

  goBackPeriod: () => {
    const s = get();
    const result = goBackWeekLogic(s);
    // Ensure currentPeriod is updated even if logic returns currentWeek
    const prevPeriod = result.currentPeriod || result.currentWeek || Math.max(1, s.currentPeriod - 1);

    set({ ...result, currentPeriod: prevPeriod, _projCache: null, lastProjectionPeriod: -1 });
    get()._persist();
  },

  // ── Projections ──────────────────────────────────────────
  getProjections: () => {
    const s = get();
    if (s._projCache && s.lastProjectionPeriod === s.currentPeriod) return s._projCache;
    const cache = refreshProjections(s.warehouses, s.customers, s.pipes, s.currentPeriod);
    set({ _projCache: cache, lastProjectionPeriod: s.currentPeriod });
    return cache;
  },

  // ── Persistence ──────────────────────────────────────────
  _persist: () => {
    const state = get();
    saveStateToDB({ 
      warehouses: state.warehouses, 
      customers: state.customers, 
      pipes: state.pipes, 
      currentPeriod: state.currentPeriod 
    });
  },

  resetGame: async () => {
    if (!window.confirm('Clear all game data and restart?')) return;
    await dbReset();
    set({
      warehouses: {}, customers: {}, pipes: [],
      currentPeriod: 1, isPaused: false, lastPeriodTime: 0,
      _projCache: null, lastProjectionPeriod: -1,
    });
  },
}));

export default useGameStore;
