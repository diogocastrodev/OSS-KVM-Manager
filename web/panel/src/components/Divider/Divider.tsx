interface props {
  className?: string;
}

export default function Divider({ className }: props) {
  return (
    <div
      className={`border-b-2 border-b-(--color-background-primary) my-2 ${className}`}
    ></div>
  );
}
