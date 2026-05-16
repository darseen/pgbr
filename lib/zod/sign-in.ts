import z from "zod";

export const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});

export type SignInSchema = z.infer<typeof signInSchema>;
