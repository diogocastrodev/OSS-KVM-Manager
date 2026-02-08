interface props {
  trProps?: React.HTMLAttributes<HTMLTableRowElement>;
  children: React.ReactNode;
}

export default function TableRow({ children, trProps }: props) {
  return (
    <tr className="even:bg-(--color-background-selected)" {...trProps}>
      {children}
    </tr>
  );
}
