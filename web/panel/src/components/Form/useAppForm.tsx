import { createFormHook } from "@tanstack/react-form";
import InputField from "./Input/InputField/InputField";
import { fieldContext, formContext } from "./FormContext";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: {},
});
