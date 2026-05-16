import z from "zod";

export const signUpSchema = z
  .object({
    email: z.string().email({ error: "Email is invalid" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(8, {
      error: "Confirm password must be at least 8 characters",
    }),
    username: z
      .string()
      .min(3, { error: "Username must be at least 3 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
