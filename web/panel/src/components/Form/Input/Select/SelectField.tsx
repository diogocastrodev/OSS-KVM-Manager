import { useEffect } from "react";
import { useFieldContext } from "../../FormContext";
import InputWrapper from "../InputWrapper/InputWrapper";

interface SelectFieldProps {
  labelText: string;
  inputName: string;
  inputId: string;
  children?: React.ReactNode;
  options: Array<{ value: string; label: string }>;
  selectedValue?: string;
}

export default function SelectField(props: SelectFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  useEffect(() => {
    if (
      props.selectedValue !== undefined &&
      props.selectedValue !== field.state.value
    ) {
      field.handleChange(props.selectedValue);
    }
  }, [props.selectedValue]);

  return (
    <InputWrapper>
      <label className="text-(--color-foreground) mb-1" htmlFor={props.inputId}>
        {props.labelText}
      </label>

      <div
        className={`flex flex-row items-center w-64 h-8 rounded-md bg-(--color-input-background)
        focus:outline-(--color-input-outline-focus) text-(--color-input-foreground) pl-2
        focus:outline-1 outline-1 ${
          isInvalid
            ? "outline-(--color-error-outline)"
            : "outline-(--color-input-outline)"
        }`}
      >
        {props.children}
        <select
          className="w-full mr-1 bg-(--color-input-background) text-(--color-input-foreground) focus:outline-none"
          name={props.inputName}
          id={props.inputId}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <span
        className={`text-(--color-error-foreground) transition-opacity duration-75 ${
          isInvalid ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
        }`}
      >
        {field.state.meta.errors[0]?.message}
      </span>
    </InputWrapper>
  );
}
