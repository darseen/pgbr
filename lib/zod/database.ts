import z from "zod";

export const databaseSchema = z.object({
  name: z.string({ error: "Name is required" }),
  url: z.string({ error: "URL is required" }),
});
