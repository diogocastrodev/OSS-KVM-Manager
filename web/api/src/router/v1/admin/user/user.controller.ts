import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  RegisterUserAdminReplyBodyType,
  RegisterUserAdminRequestBodyType,
} from "./user.schema";
import db from "@/db/database";
import { passwordHash } from "@/utils/password";
import { v4 as uuidv4 } from "uuid";
import { sendEmail, sendRegisterEmail } from "@/utils/email";

export const registerUserAdmin = async (
  req: FastifyRequest<{
    Body: RegisterUserAdminRequestBodyType;
  }>,
  reply: FastifyReply<{
    Reply: RegisterUserAdminReplyBodyType;
  }>
) => {
  const { email } = req.body;

  const hash = await passwordHash(uuidv4());

  const checkEmail = await db
    .selectFrom("users")
    .where("email", "=", email)
    .select(["id"])
    .executeTakeFirst();

  if (checkEmail) {
    return reply.status(400).send({
      message: "Email already in use",
    });
  }

  const emailVefToken = uuidv4();

  const newUser = await db
    .insertInto("users")
    .values({
      name: "TBD",
      email,
      password: hash,
      emailVerificationToken: emailVefToken,
    })
    // .returning(["id", "email", "emailVerificationToken"])
    .executeTakeFirstOrThrow();

  if (!newUser) {
    return reply.status(500).send({
      message: "Failed to create user",
    });
  }

  try {
    await sendRegisterEmail(email, emailVefToken);
  } catch (error) {
    console.error("Error sending registration email:", error);
    await db.deleteFrom("users").where("email", "=", email).execute();
    return reply.status(500).send({
      message: "Failed to send registration email",
    });
  }
  return reply.status(200).send({
    message: "User registered successfully",
  });
};
