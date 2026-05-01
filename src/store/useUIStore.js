import { create } from 'zustand';

/**
 * UI state: what's selected in the 3D scene and which modal is open.
 * selectedId: string | null  (name of selected warehouse/customer, or pipe id)
 * selectedType: 'warehouse' | 'customer' | 'pipe' | null
 * openModal: 'warehouses' | 'customers' | 'supply' | 'stock' | null
 */
const useUIStore = create((set) => ({
  selectedId: null,
  selectedType: null,

  openModal: null,

  lightMode: false,

  // { fromId: string, fromPos: [x,y,z] } | null
  pipeDrawing: null,

  select: (id, type) => set({ selectedId: id, selectedType: type }),
  clearSelection: () => set({ selectedId: null, selectedType: null }),

  setModal: (modal) => set({ openModal: modal }),
  closeModal: () => set({ openModal: null }),

  toggleLightMode: () => set((s) => ({ lightMode: !s.lightMode })),

  startPipeDrawing: (fromId, fromPos) => set({ pipeDrawing: { fromId, fromPos }, selectedId: null, selectedType: null }),
  cancelPipeDrawing: () => set({ pipeDrawing: null }),

  // { fromId, toId } | null  — shown after drag-connect to fill lead time
  pendingPipe: null,
  setPendingPipe: (fromId, toId) => set({ pipeDrawing: null, pendingPipe: { fromId, toId } }),
  clearPendingPipe: () => set({ pendingPipe: null }),
}));

export default useUIStore;
