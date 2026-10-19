import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const STATUSES = ['live', 'building', 'planned', 'research', 'archived'] as const;
export type Status = (typeof STATUSES)[number];

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.mdx' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(80),
      /** The product-page headline. Short and plain, like a tagline on a box. */
      tagline: z.string().max(70),
      /** What's inside: 2 to 4 things it does, shown as a grid on the project page. */
      features: z
        .array(z.object({ title: z.string(), body: z.string().max(160) }))
        .max(4)
        .default([]),
      status: z.enum(STATUSES),
      year: z.number().int(),
      role: z.string(),
      team: z.string().optional(),
      stack: z.array(z.string()).min(1),
      links: z
        .object({
          live: z.url().optional(),
          repo: z.url().optional(),
          demo: z.url().optional(),
          writeup: z.url().optional(),
        })
        .default({}),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      ink: z.enum(['c', 'm', 'y']),
      description: z.string().max(160),
      /** Screenshot shown on the home page and at the top of the case study. Projects without one fall back to a drawn diagram in src/components/covers/<id>.astro. */
      cover: z.object({ src: image(), alt: z.string(), caption: z.string() }).optional(),
      /** Caption for the drawn diagram, used when there is no screenshot. */
      coverCaption: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string(), caption: z.string() })).default([]),
    }),
});

// Stubbed for later. Pages for it are not generated until the first post exists.
const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().max(160),
    draft: z.boolean().default(true),
  }),
});

export const collections = { projects, writing };
