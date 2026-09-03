/**
 * department.store.ts — Chekeo V3
 *
 * Store central para la gestión de departamentos y aislamiento de workspaces:
 * - Departamentos: 'cocina' | 'admin'
 * - Estaciones de Cocina: 'prep' (Plancha) | 'sideQuest' (Freidora) | 'summaryK' (Mise en Place)
 * - Secciones de Admin: 'resumenK' (Operación) | 'pedidos' | 'pagos' | 'admin'
 * - Sincronización con URL (?dept=cocina|admin) y persistencia en localStorage
 */

import { create } from 'zustand';

export type ChekeoDepartment = 'cocina' | 'admin';
export type CocinaStation = 'prep' | 'sideQuest' | 'summaryK';
export type AdminSection = 'resumenK' | 'pedidos' | 'pagos' | 'admin';

interface DepartmentState {
  activeDepartment: ChekeoDepartment;
  activeCocinaStation: CocinaStation;
  activeAdminSection: AdminSection;
  soundEnabled: boolean;
  setDepartment: (dept: ChekeoDepartment) => void;
  toggleDepartment: () => void;
  setCocinaStation: (station: CocinaStation) => void;
  setAdminSection: (section: AdminSection) => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'chekeo_active_department';
const SOUND_KEY = 'chekeo_split_flap_sound';

function getInitialDepartment(): ChekeoDepartment {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const deptParam = params.get('dept')?.toLowerCase();
    if (deptParam === 'cocina' || deptParam === 'admin') {
      return deptParam as ChekeoDepartment;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'cocina' || stored === 'admin') {
      return stored as ChekeoDepartment;
    }
  }
  return 'admin';
}

function getInitialSound(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SOUND_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return true;
}

function syncUrlDept(dept: ChekeoDepartment) {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('dept', dept);
    window.history.replaceState({}, '', url.toString());
    localStorage.setItem(STORAGE_KEY, dept);
  }
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  activeDepartment: getInitialDepartment(),
  activeCocinaStation: 'prep',
  activeAdminSection: 'resumenK',
  soundEnabled: getInitialSound(),

  setDepartment: (dept) => {
    syncUrlDept(dept);
    set({ activeDepartment: dept });
  },

  toggleDepartment: () => {
    set((state) => {
      const nextDept: ChekeoDepartment = state.activeDepartment === 'cocina' ? 'admin' : 'cocina';
      syncUrlDept(nextDept);
      return { activeDepartment: nextDept };
    });
  },

  setCocinaStation: (station) => set({ activeCocinaStation: station }),

  setAdminSection: (section) => set({ activeAdminSection: section }),

  toggleSound: () => {
    set((state) => {
      const next = !state.soundEnabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SOUND_KEY, String(next));
      }
      return { soundEnabled: next };
    });
  },

  setSoundEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_KEY, String(enabled));
    }
    set({ soundEnabled: enabled });
  },
}));
