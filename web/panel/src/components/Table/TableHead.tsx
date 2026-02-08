export interface props {
  head: {
    name: string | React.ReactNode;
    actions?: boolean;
    className?: string;
    thProps?: React.ThHTMLAttributes<HTMLTableCellElement>;
  }[];
}

export default function TableHead({ head }: props) {
  return (
    <thead className="bg-(--color-background-primary) h-10 rounded-t-lg">
      <tr>
        {head.map((h, index) => (
          <th
            key={index}
            className={`${h.className ?? ""} ${h.actions ? "w-64" : ""}`}
            {...h.thProps}
          >
            {h.name}
          </th>
        ))}
      </tr>
    </thead>
  );
}
