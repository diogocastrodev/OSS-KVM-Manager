import path from "node:path";

export enum EmailsTemplates {
  REGISTER = "register",
  ACCOUNT = "account",
}

export const loadTemplateFolder = () => {
  return path.resolve(path.join(process.cwd(), "templates"));
};

export const loadEmailTemplateFolder = () => {
  const templatesPath = loadTemplateFolder();
  return path.join(templatesPath, "emails");
};

export const loadEmailTemplatesFolder = (t: EmailsTemplates) => {
  const emailTemplatesPath = loadEmailTemplateFolder();
  return path.join(emailTemplatesPath, t);
};

export const loadEmailTemplateFile = (
  template: EmailsTemplates,
  fileName: string
) => {
  const templateFolder = loadEmailTemplatesFolder(template);
  return path.join(templateFolder, fileName);
};
