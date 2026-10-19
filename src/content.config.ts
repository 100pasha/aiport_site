import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const helpSchema = z.object({
  title: z.string(),
  description: z.string(),
  updated: z.coerce.date(),
  service_id: z.string().optional(),
  client_id: z.string().optional(),
  topic: z.string().optional(),
  home: z.boolean().default(false),
});
export const collections = {
  services: defineCollection({
    loader: glob({ pattern: '*.md', base: './content/help/services' }),
    schema: helpSchema,
  }),
  ai: defineCollection({
    loader: glob({ pattern: '*.md', base: './content/help/ai' }),
    schema: helpSchema,
  }),
  faq: defineCollection({
    loader: glob({ pattern: '*.md', base: './content/help/faq' }),
    schema: helpSchema,
  }),
  blog: defineCollection({
    loader: glob({ pattern: '*.md', base: './content/blog' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      cover: z.string(),
      tags: z.array(z.string()),
    }),
  }),
};
