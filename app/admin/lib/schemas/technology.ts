import { z } from "zod";

export const technologySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  icon: z.string().trim(),
});
export type TechnologyInput = z.infer<typeof technologySchema>;
