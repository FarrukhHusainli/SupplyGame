import { create } from 'zustand';
import { refreshProjections } from '../simulation/projections';
import { advanceWeekLogic, goBackWeekLogic } from '../simulation/weekAdvance';
import { saveStateToDB, resetDatabase as dbReset } from '../db/firebase';
import { getCustomerGrossDemand } from '../simulation/customer_node/out/gross';

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
  vendors: {},
  pipes: [],

  // ── Time ───────────────────────────────────────────────
  currentPeriod: 1,
  timeBucket: 'Week', // 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'
  timelineLength: 100,
  periodDuration: 5,  // seconds per period (user-configurable)
  isPaused: false,
  lastPeriodTime: 0,

  // ── Projection cache (invalidated each week) ────────────
  _projCache: null,
  lastProjectionPeriod: -1,

  // ── Hydrate from DB ─────────────────────────────────────
  hydrate: (data) => set({ ...data, _projCache: null, lastProjectionPeriod: -1 }),

  // ── Node CRUD ───────────────────────────────────────────
  addWarehouse: (name, position, initialStock = 0) => {
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      warehouses: {
        ...s.warehouses,
        [name]: { position, currentStock: initialStock, initialStock, history: [], createdAtPeriod },
      },
      _projCache: null,
    }));
    get()._persist();
  },

  addCustomer: (name, position) => {
    const demand = Array.from({ length: 12 }, () => getCustomerGrossDemand());
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      customers: { ...s.customers, [name]: { position, demand, history: [], createdAtPeriod } },
    }));
    get()._persist();
  },

  addPipe: (from, to, leadTime) => {
    const id = `${from}->${to}-${Date.now()}`;
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({ pipes: [...s.pipes, { id, from, to, leadTime, createdAtPeriod }], _projCache: null }));
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

  addVendor: (name, position) => {
    const createdAtPeriod = get().currentPeriod;
    set((s) => ({
      vendors: { ...s.vendors, [name]: { position, createdAtPeriod } },
    }));
    get()._persist();
  },

  deleteVendor: (name) => {
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
    set((s) => ({
      pipes: s.pipes.map((p) => p.id === id ? { ...p, leadTime } : p),
      _projCache: null,
    }));
    get()._persist();
  },

  updateNodePosition: (name, nodeType, position) => {
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
