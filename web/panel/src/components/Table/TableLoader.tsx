import Loader from "../Loader/Loader";

interface props {
  cols: number;
  children?: React.ReactNode;
}

export default function TableLoader({ cols, children }: props) {
  return (
    <tr>
      <td colSpan={cols} className="py-4">
        <div className="flex flex-row justify-center">
          {children ? children : <Loader />}
        </div>
      </td>
    </tr>
  );
}
