import z from "zod";

export const databaseSchema = z.object({
  name: z.string({ error: "Name is required" }),
  url: z.string({ error: "URL is required" }),
});

// On update the connection string is optional: the dashboard never holds the
// plaintext URL (it only ever sees a masked one), so an omitted/empty url means
// "keep the stored credential" rather than "blank it out".
export const updateDatabaseSchema = z.object({
  name: z.string({ error: "Name is required" }),
  url: z.string().optional(),
});
