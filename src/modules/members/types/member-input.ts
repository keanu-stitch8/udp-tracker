import { z } from "zod";

export const memberInputSchema = z.object({
  email: z
    .string({ error: "Isi email Google-nya." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Email tidak valid.")),
});

export type MemberInput = z.input<typeof memberInputSchema>;
