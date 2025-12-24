import { PanelSideBarContext } from "@/context/PanelSideBarContext";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function PanelSidebar() {
  const { isSideBarOpen, toggleSideBar } = PanelSideBarContext();
  return (
    <>
      <div
        id="panelSideBar"
        className={`fixed left-2 top-2 bottom-2 ${
          isSideBarOpen ? "w-64" : "w-12"
        } bg-zinc-800 rounded-xl flex flex-col p-3 overflow-auto transition-[width] duration-300 ease-in-out`}
      >
        <div onClick={() => toggleSideBar()}>
          <ArrowLeftIcon
            className={`h-6 w-6 text-white transition-transform duration-300 ${
              isSideBarOpen ? "rotate-0" : "rotate-180"
            }`}
          />
        </div>
      </div>
    </>
  );
}
