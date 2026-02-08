interface props {
  size?: number;
  className?: string;
}

export default function Loader({ size, className }: props) {
  return (
    <div
      className={`${`w-${size || 8} h-${size || 8}`} animate-spin ${`border-r-${size ? size / 2 : 4}`} rounded-full border-(--color-background-selected) ${className || ""}`}
    ></div>
  );
}
