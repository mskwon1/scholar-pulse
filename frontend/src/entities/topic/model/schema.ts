import { z } from 'zod';

export const topicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  keywords: z.array(z.string()).max(10, { message: "Maximum 10 keywords allowed" }),
  match_type: z.string().optional(),
  category: z.string().optional(),
  filters: z.object({
    years_limit: z.number({ message: "Limit cannot be empty" }).min(1, "Must be at least 1 year"),
    min_journal_rank: z.string(),
    min_citations: z.number({ message: "Cannot be empty" }).min(0, "Citations cannot be negative"),
  }),
});

export const userConfigSchema = z.object({
  topics: z.array(topicSchema).max(5, { message: "Maximum 5 filters allowed" }),
  delivery_topic_index: z.number().nullable().optional(),
  schedule: z.string(),
  delivery: z.string(),
  receive_email: z.boolean(),
});

export type Topic = z.infer<typeof topicSchema>;
export type UserConfig = z.infer<typeof userConfigSchema>;
