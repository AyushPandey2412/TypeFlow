import { z } from "zod";
const usernameSchema = z.string().trim().min(3, "Username must contain at least 3 characters.").max(40, "Username must contain at most 40 characters.").regex(/^[a-zA-Z0-9_.-]+$/, "Use only letters, numbers, underscores, dots, or hyphens in your username.");
const emailSchema = z.string().trim().email("Enter a valid email address.").transform(value => value.toLowerCase());

export const credentialsSchema = z.object({
  username: z.union([usernameSchema, emailSchema]),
  password: z.string().min(1, "Enter your password.").max(128, "Password must contain at most 128 characters."),
});
export const registrationSchema = z.object({
  username: usernameSchema,
  password: z.string().min(10, "Password must contain at least 10 characters.").max(128, "Password must contain at most 128 characters.").regex(/[A-Za-z]/, "Password must include a letter.").regex(/[0-9]/, "Password must include a number."),
  email: emailSchema,
});
