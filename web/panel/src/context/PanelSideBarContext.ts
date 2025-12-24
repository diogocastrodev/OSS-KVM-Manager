import { create } from "zustand";

interface PanelSideBarContextProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
}

export const PanelSideBarContext = create<PanelSideBarContextProps>((set) => ({
  isSideBarOpen: true,
  toggleSideBar: () =>
    set((state) => ({
      isSideBarOpen: !state.isSideBarOpen,
    })),
}));
