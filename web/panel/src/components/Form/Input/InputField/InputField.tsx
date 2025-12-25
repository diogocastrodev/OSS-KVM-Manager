import InputWrapper from "../InputWrapper/InputWrapper";

interface InputFieldProps {
  labelText: string;
  inputType: React.HTMLInputTypeAttribute;
  inputName: string;
  inputId: string;
}

export default function InputField(props: InputFieldProps) {
  return (
    <>
      <InputWrapper>
        <label className="text-gray-200 mb-1" htmlFor={props.inputId}>
          {props.labelText}
        </label>
        <input
          className="w-64 h-8 rounded-md bg-zinc-700 outline-0 outline-zinc-900 focus:outline-blue-700 text-gray-200 pl-2 focus:outline-1"
          type={props.inputType}
          name={props.inputName}
          id={props.inputId}
        />
      </InputWrapper>
    </>
  );
}
