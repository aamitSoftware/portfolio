import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOg } from '../../lib/og';
import { getProjects, isInRegister } from '../../lib/projects';

export const getStaticPaths = (async () => {
  const projects = await getProjects();
  return [
    {
      params: { path: 'index' },
      props: {
        title: 'Amit Asher',
        subtitle: 'Backend and full-stack engineer. .NET, React, real-time systems, AI-agent security.',
        inRegister: true,
      },
    },
    ...projects.map((p) => ({
      params: { path: `work/${p.id}` },
      props: { title: p.data.title, subtitle: p.data.summary, inRegister: isInRegister(p.data.status) },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as Parameters<typeof renderOg>[0]);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
