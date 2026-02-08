import { createFormHook } from "@tanstack/react-form";
import InputField from "./Input/InputField/InputField";
import { fieldContext, formContext } from "./FormContext";
import SelectField from "./Input/Select/SelectField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, SelectField },
  formComponents: {},
});
