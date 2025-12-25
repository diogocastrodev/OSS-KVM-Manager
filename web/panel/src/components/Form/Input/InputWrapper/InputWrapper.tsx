interface InputWrapperProps {
  children: React.ReactNode;
}

export default function InputWrapper({ children }: InputWrapperProps) {
  return (
    <>
      <div className="flex flex-col">{children}</div>
    </>
  );
}
