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
  currentWeek: 1,
  isPaused: false,
  lastWeekTime: 0,

  // ── Projection cache (invalidated each week) ────────────
  _projCache: null,
  lastProjectionWeek: -1,

  // ── Hydrate from DB ─────────────────────────────────────
  hydrate: (data) => set({ ...data, _projCache: null, lastProjectionWeek: -1 }),

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
  setLastWeekTime: (t) => set({ lastWeekTime: t }),

  advanceWeek: () => {
    const s = get();
    const next = advanceWeekLogic(s);
    set({ ...next, _projCache: null, lastProjectionWeek: -1 });
    get()._persist();
  },

  goBackWeek: () => {
    const s = get();
    const prev = goBackWeekLogic(s);
    set({ ...prev, _projCache: null, lastProjectionWeek: -1 });
    get()._persist();
  },

  // ── Projections ──────────────────────────────────────────
  getProjections: () => {
    const s = get();
    if (s._projCache && s.lastProjectionWeek === s.currentWeek) return s._projCache;
    const cache = refreshProjections(s.warehouses, s.customers, s.pipes, s.currentWeek);
    set({ _projCache: cache, lastProjectionWeek: s.currentWeek });
    return cache;
  },

  // ── Persistence ──────────────────────────────────────────
  _persist: () => {
    const { warehouses, customers, pipes, currentWeek } = get();
    saveStateToDB({ warehouses, customers, pipes, currentWeek });
  },

  resetGame: async () => {
    if (!window.confirm('Clear all game data and restart?')) return;
    await dbReset();
    set({
      warehouses: {}, customers: {}, pipes: [],
      currentWeek: 1, isPaused: false, lastWeekTime: 0,
      _projCache: null, lastProjectionWeek: -1,
    });
  },
}));

export default useGameStore;
