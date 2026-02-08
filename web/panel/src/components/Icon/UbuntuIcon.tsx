interface props {
  className?: string;
  alt?: string;
}

export default function UbuntuIcon({ className, alt }: props) {
  return (
    <img
      src="/icons/ubuntu.png"
      alt={alt || "Ubuntu Icon"}
      className={className || "w-5 h-5"}
    />
  );
}
