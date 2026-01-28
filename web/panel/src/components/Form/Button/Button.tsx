import { useFormContext } from "../FormContext";

interface ButtonProps {
  text: string;
}

export default function Button(props: ButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => {
        const disabled = !canSubmit || isSubmitting;
        return (
          <button
            type="submit"
            disabled={disabled}
            className={`w-32 h-10 outline-2 outline-(--color-button-outline) rounded-md transition-all ${disabled ? "cursor-not-allowed disabled:outline-1 disabled:outline-(--color-error-outline)" : "cursor-pointer hover:outline-0 hover:bg-(--color-button-background-hover)"} text-(--color-button-foreground) hover:text-(--color-button-foreground-hover)`}
          >
            {isSubmitting ? "..." : props.text}
          </button>
        );
      }}
    />
  );
}
