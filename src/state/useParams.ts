import { create } from 'zustand';
import type { SimParams } from '../types';

interface AppState extends SimParams {
  setParams: (params: Partial<SimParams>) => void;
}

const defaultParams: SimParams = {
  N: 10,
  meanChildren: 2.0,
  sdChildren: 1.0,
  partnerRate: 0.7,
  seed: 42,
};

// Initialize from URL search params
const getInitialState = (): SimParams => {
  if (typeof window === 'undefined') return defaultParams;
  const params = new URLSearchParams(window.location.search);
  const getNum = (key: string, def: number) => {
    const v = params.get(key);
    return v !== null && !isNaN(Number(v)) ? Number(v) : def;
  };
  return {
    N: getNum('N', defaultParams.N),
    meanChildren: getNum('mu', defaultParams.meanChildren),
    sdChildren: getNum('sd', defaultParams.sdChildren),
    partnerRate: getNum('p', defaultParams.partnerRate),
    seed: getNum('seed', defaultParams.seed),
  };
};

let urlUpdateTimeout: ReturnType<typeof setTimeout>;

export const useParamsStore = create<AppState>((set) => ({
  ...getInitialState(),
  setParams: (newParams) => set((state) => {
    const updated = { ...state, ...newParams };
    // Update URL debounced
    if (typeof window !== 'undefined') {
      clearTimeout(urlUpdateTimeout);
      urlUpdateTimeout = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('N', updated.N.toString());
        url.searchParams.set('mu', updated.meanChildren.toString());
        url.searchParams.set('sd', updated.sdChildren.toString());
        url.searchParams.set('p', updated.partnerRate.toString());
        url.searchParams.set('seed', updated.seed.toString());
        window.history.replaceState({}, '', url.toString());
      }, 300);
    }
    return updated;
  }),
}));
