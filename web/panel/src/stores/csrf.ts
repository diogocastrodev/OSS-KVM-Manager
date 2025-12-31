import { create } from "zustand";

type CsrfState = {
  token: string | null;
  setToken: (t: string | null) => void;
};

export const useCsrfStore = create<CsrfState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
