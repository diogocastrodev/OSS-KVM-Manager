import { useFieldContext } from "../../FormContext";
import InputWrapper from "../InputWrapper/InputWrapper";

interface InputFieldProps {
  labelText: string;
  inputType: React.HTMLInputTypeAttribute;
  inputName: string;
  inputId: string;
  children?: React.ReactNode;
}

export default function InputField(props: InputFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <>
      <InputWrapper>
        <label
          className="text-(--color-foreground) mb-1"
          htmlFor={props.inputId}
        >
          {props.labelText}
        </label>
        <input
          className={`w-64 h-8 rounded-md bg-(--color-input-background) focus:outline-(--color-input-outline-focus) text-(--color-input-foreground) pl-2 focus:outline-1 outline-1 ${isInvalid ? "outline-(--color-error-outline) " : " outline-(--color-input-outline)"}`}
          type={props.inputType}
          name={props.inputName}
          id={props.inputId}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {/* {isInvalid && (
          <span className="text-red-300">
            {field.state.meta.errors[0]?.message}
          </span>
        )} */}
        <span
          className={`text-(--color-error-foreground) transition-opacity duration-75 ${isInvalid ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"}`}
        >
          {field.state.meta.errors[0]?.message}
        </span>
        {props.children}
      </InputWrapper>
    </>
  );
}
