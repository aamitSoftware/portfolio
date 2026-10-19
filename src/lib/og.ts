import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const require = createRequire(import.meta.url);
const fontFile = (w: number) => readFile(require.resolve(`@fontsource/archivo/files/archivo-latin-${w}-normal.woff`));

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 800; style: 'normal' }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([fontFile(400), fontFile(800)]).then(([regular, heavy]) => [
    { name: 'Archivo', data: regular, weight: 400, style: 'normal' },
    { name: 'Archivo', data: heavy, weight: 800, style: 'normal' },
  ]));

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

const PAPER = '#f5f6f4';
const PLATES = ['#00a0e3', '#e5007d', '#ffe600'];

/** A press-proof card: the title printed as three plates, crop marks at the corners. */
export async function renderOg({
  title,
  subtitle,
  inRegister,
}: {
  title: string;
  subtitle: string;
  inRegister: boolean;
}) {
  const d = inRegister ? 0 : 5;
  const offsets = [
    [-d, -d * 0.4],
    [d * 0.9, d * 0.7],
    [d * 0.2, -d],
  ];
  const size = title.length > 12 ? 104 : 140;

  const plate = (color: string, [x, y]: number[]) =>
    h(
      'div',
      {
        position: 'absolute',
        left: x,
        top: y,
        color,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 0.9,
        letterSpacing: -2,
        mixBlendMode: 'multiply',
      },
      title,
    );

  const line = (pos: Record<string, number>, w: number, ht: number) =>
    h('div', { position: 'absolute', width: w, height: ht, background: '#000', ...pos });
  const cropMarks = [
    line({ left: 40, top: 66 }, 28, 1),
    line({ left: 66, top: 40 }, 1, 28),
    line({ left: 1132, top: 66 }, 28, 1),
    line({ left: 1133, top: 40 }, 1, 28),
    line({ left: 40, top: 563 }, 28, 1),
    line({ left: 66, top: 562 }, 1, 28),
    line({ left: 1132, top: 563 }, 28, 1),
    line({ left: 1133, top: 562 }, 1, 28),
  ];

  // Satori adds padding to the declared size, so the content box is positioned explicitly.
  const tree = h(
    'div',
    { width: 1200, height: 630, display: 'flex', position: 'relative', background: PAPER, fontFamily: 'Archivo' },
    [
      ...cropMarks,
      h(
        'div',
        {
          position: 'absolute',
          left: 96,
          top: 84,
          width: 1008,
          height: 462,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
        [
          h('div', { fontSize: 30, color: '#55595e', display: 'flex' }, 'Amit Asher'),
          h(
            'div',
            { display: 'flex', position: 'relative', height: size * 1.05, width: '100%' },
            PLATES.map((c, i) => plate(c, offsets[i])),
          ),
          h('div', { fontSize: 34, color: '#000', maxWidth: 1000, lineHeight: 1.3, display: 'flex' }, subtitle),
        ],
      ),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: await loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
