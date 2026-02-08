interface props {
  button: React.ButtonHTMLAttributes<HTMLButtonElement>;
  children?: React.ReactNode;
}

export default function ButtonNoForm(props: props) {
  return (
    <button
      type={props.button.type ?? "button"}
      className={`min-w-32 max-w-fit px-2 h-10 outline-2 outline-(--color-button-outline) rounded-md transition-all ${
        props.button.disabled
          ? "disabled:cursor-not-allowed disabled:outline-1 disabled:outline-(--color-error-outline)"
          : "cursor-pointer hover:outline-0 hover:bg-(--color-button-background-hover)"
      } text-(--color-button-foreground) hover:text-(--color-button-foreground-hover) ${
        props.button.className ?? ""
      }`}
      {...props.button}
    >
      {props.children}
    </button>
  );
}
