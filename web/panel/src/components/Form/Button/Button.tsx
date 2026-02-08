import { useFormContext } from "../FormContext";
import ButtonNoForm from "./ButtonNoForm";

interface ButtonProps {
  text: string;
  className?: string;
  disabled?: boolean;
}

export default function Button(props: ButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => {
        const disabled = !canSubmit || isSubmitting;

        return (
          <ButtonNoForm
            button={{
              type: "button",
              disabled: props.disabled ?? disabled,
              onClick: (e) => {
                e.preventDefault();
                if (!disabled) form.handleSubmit();
              },
              className: `min-w-32 max-w-fit px-2 h-10 outline-2 outline-(--color-button-outline) rounded-md transition-all ${
                disabled || props.disabled
                  ? "disabled:cursor-not-allowed disabled:outline-1 disabled:outline-(--color-error-outline)"
                  : "cursor-pointer hover:outline-0 hover:bg-(--color-button-background-hover)"
              } text-(--color-button-foreground) hover:text-(--color-button-foreground-hover) ${
                props.className ?? ""
              }`,
            }}
          >
            {isSubmitting ? "..." : props.text}
          </ButtonNoForm>
        );
      }}
    </form.Subscribe>
  );
}
