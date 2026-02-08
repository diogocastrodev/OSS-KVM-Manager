interface props {
  children: React.ReactNode;
  capitalize?: boolean;
  actions?: boolean;
  className?: string;
}

export default function TableItem({
  children,
  capitalize,
  actions,
  className,
}: props) {
  return (
    <td
      className={`h-10 ${className ?? ""} ${capitalize ? "capitalize" : ""} ${actions ? "flex flex-row justify-center items-center gap-x-2" : ""}`}
    >
      {children}
    </td>
  );
}
