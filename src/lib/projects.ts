import { type CollectionEntry, getCollection } from 'astro:content';
import type { Status } from '../content.config';

export type Project = CollectionEntry<'projects'>;

export const statusLabel: Record<Status, string> = {
  live: 'Live',
  building: 'Building',
  planned: 'Planned',
  research: 'Research',
  archived: 'Archived',
};

/** Only live work is "on press"; everything else prints out of register. */
export const isInRegister = (status: Status) => status === 'live' || status === 'archived';

export async function getProjects({ featuredOnly = false } = {}) {
  const all = await getCollection('projects');
  return all
    .filter((p) => !featuredOnly || p.data.featured)
    .sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}
