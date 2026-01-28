import { useState } from "react";

interface props {
  delay?: number;
  content: React.ReactNode;
  children: React.ReactNode;
  direction?: "top" | "bottom" | "left" | "right" | "auto";
}

function Tooltip({
  delay = 500,
  content,
  children,
  direction = "auto",
}: props) {
  let timeout: NodeJS.Timeout;
  const [visible, setVisible] = useState(false);

  const showTooltip = () => {
    timeout = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setVisible(false);
  };

  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      className="relative"
    >
      {visible && (
        <div
          className={`flex flex-col absolute bg-(--color-background-primary) border border-(--color-border) rounded-md p-2 shadow-lg z-10 w-max max-w-xs
                ${direction === "top" && "bottom-full mb-2 left-1/2 transform -translate-x-1/2"}
                ${direction === "bottom" && "top-full mt-2 left-1/2 transform -translate-x-1/2"}
                ${direction === "left" && "right-full mr-2 top-1/2 transform -translate-y-1/2"}
                ${direction === "right" && "left-full ml-2 top-1/2 transform -translate-y-1/2"}
                ${direction === "auto" && "top-full mt-2 left-1/2 transform -translate-x-1/2"}
            `}
        >
          {content}
        </div>
      )}
      {children}
    </div>
  );
}

export default Tooltip;
