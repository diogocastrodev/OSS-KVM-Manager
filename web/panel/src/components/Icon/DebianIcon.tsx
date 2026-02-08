interface props {
  className?: string;
  alt?: string;
}

export default function DebianIcon({ className, alt }: props) {
  return (
    <img
      src="/icons/debian.png"
      alt={alt || "Debian Icon"}
      className={className || "w-5 h-5"}
    />
  );
}
