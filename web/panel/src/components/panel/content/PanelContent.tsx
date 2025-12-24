import { PanelSideBarContext } from "@/context/PanelSideBarContext";

interface PanelContentProps {
  children: React.ReactNode;
}

export default function PanelContent({ children }: PanelContentProps) {
  const { isSideBarOpen } = PanelSideBarContext();
  return (
    <>
      <div
        id="panelContent"
        className={`${
          isSideBarOpen ? "ml-72" : "ml-20"
        } px-2 py-4 overflow-auto transition-[margin-left] duration-300 ease-in-out`}
      >
        {children}
      </div>
    </>
  );
}
