import TableBody from "./TableBody";
import TableHead, { props as TableHeadProps } from "./TableHead";
import TableLoader from "./TableLoader";

interface props {
  head: TableHeadProps["head"];
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function Table({ head, isLoading, children }: props) {
  return (
    <table className="w-full text-center rounded-md overflow-hidden">
      <TableHead head={head} />
      <TableBody>
        {isLoading ? <TableLoader cols={head.length} /> : children}
      </TableBody>
    </table>
  );
}
