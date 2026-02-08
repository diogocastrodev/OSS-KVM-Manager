interface props {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: "update" | "delete" | "view" | "ignore";
  buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export default function TableActionButton({
  children,
  onClick,
  className,
  style = "ignore",
  buttonProps,
}: props) {
  const styleClasses = {
    update:
      "bg-(--color-button-update) hover:bg-(--color-button-update-hover) text-(--color-button-update-foreground) hover:text-(--color-button-update-foreground-hover)",
    delete:
      "bg-(--color-button-delete) hover:bg-(--color-button-delete-hover) text-(--color-button-delete-foreground) hover:text-(--color-button-delete-foreground-hover)",
    view: "bg-(--color-button-view) hover:bg-(--color-button-view-hover) text-(--color-button-view-foreground) hover:text-(--color-button-view-foreground-hover)",
    ignore: "",
  };

  return (
    <button
      onClick={style === "ignore" ? undefined : onClick}
      className={`${styleClasses[style]} ${className ?? ""} cursor-pointer px-2 py-1 rounded transition-colors duration-200`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
