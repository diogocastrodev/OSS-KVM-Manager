import { z } from "zod";

export const wsCreateSSHTerminalQuery = z.object({
  token: z.string().min(1, "Token is required"),
});

export type WsCreateSSHTerminalQuery = z.infer<typeof wsCreateSSHTerminalQuery>;
