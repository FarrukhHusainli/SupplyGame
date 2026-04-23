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

  select: (id, type) => set({ selectedId: id, selectedType: type }),
  clearSelection: () => set({ selectedId: null, selectedType: null }),

  setModal: (modal) => set({ openModal: modal }),
  closeModal: () => set({ openModal: null }),
}));

export default useUIStore;
