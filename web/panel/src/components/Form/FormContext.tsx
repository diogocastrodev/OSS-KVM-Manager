import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import InputField from "./Input/InputField/InputField";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
