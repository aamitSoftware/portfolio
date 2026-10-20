// Records the Bubble.up product reel and re-shoots its stills from the public demo (demo data only).
//   node scripts/record-bubbleup.mjs            stills + video
//   node scripts/record-bubbleup.mjs --stills   stills only
// Output: src/assets/projects/bubble-up/*.png (2x) and public/media/bubbleup-reel.{mp4,webm} + poster.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import ffmpeg from 'ffmpeg-static';

const DEMO = 'https://demo.bubbleup.online/demo';
const VIEW = { width: 1440, height: 900 };
const STILLS = 'src/assets/projects/bubble-up';
const MEDIA = 'public/media';
const FRAMES = '.scratch/reel-frames';
const stillsOnly = process.argv.includes('--stills');

// Headless Chrome draws no pointer, so the reel gets a simple one that follows real mouse events.
const cursorScript = () => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText =
      'position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:transform 40ms linear';
    c.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 2l7.5 19 2.6-7.4L20.5 11z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.append(c);
    addEventListener(
      'mousemove',
      (e) => (c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`),
      true,
    );
    addEventListener(
      'mousedown',
      (e) => {
        const r = document.createElement('div');
        r.style.cssText = `position:fixed;left:${e.clientX - 18}px;top:${e.clientY - 18}px;width:36px;height:36px;border-radius:50%;border:2px solid #0088ff;z-index:2147483646;pointer-events:none;animation:__ripple 450ms ease-out forwards`;
        document.body.append(r);
        setTimeout(() => r.remove(), 500);
      },
      true,
    );
    const s = document.createElement('style');
    s.textContent = '@keyframes __ripple{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}';
    document.head.append(s);
  });
};

async function openDemo(browser, withCursor) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 });
  if (withCursor) await ctx.addInitScript(cursorScript);
  const page = await ctx.newPage();
  await page.goto(DEMO, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Start demo' }).click();
  await page.waitForURL(/\/groups/, { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page
    .getByRole('button', { name: /skip tutorial/i })
    .click()
    .catch(() => {});
  await page.waitForTimeout(800);
  return { ctx, page };
}

// The matching quiz pops up on every screen. After the reel answers it once, keep it out of the way.
const suppressCheckIn = (page) =>
  page.evaluate(() => {
    const hide = () => {
      for (const el of document.querySelectorAll('body *')) {
        if (el.children.length < 12 && /^QUICK CHECK-IN/i.test(el.textContent?.trim() ?? '')) {
          let box = el;
          while (box.parentElement && box.getBoundingClientRect().width < 300) box = box.parentElement;
          box.style.visibility = 'hidden';
        }
      }
    };
    hide();
    new MutationObserver(hide).observe(document.body, { childList: true, subtree: true });
  });

const openHub = async (page) => {
  await page.locator('button', { hasText: 'CS101 Night Owls' }).last().click();
  await page.waitForTimeout(2500);
};

async function shootStills(browser) {
  const { ctx, page } = await openDemo(browser, false);
  await suppressCheckIn(page);
  await openHub(page);
  await page.screenshot({ path: join(STILLS, 'hub.png') });
  await ctx.close();
  console.log('stills saved to', STILLS);
}

/** Moves the pointer in visible steps and clicks, so the cursor travels like a person's hand. */
async function point(page, locator, { click = true, steps = 22 } = {}) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) throw new Error('target not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await page.waitForTimeout(220);
  if (click) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function recordReel(browser) {
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  const { ctx, page } = await openDemo(browser, true);
  await page.mouse.move(VIEW.width * 0.6, VIEW.height * 0.4);

  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = join(FRAMES, `${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 2880, maxHeight: 1800 });

  // 1. Home, then the matching quiz: answer one quick check-in.
  //    Its questions are random, so pick the first answer inside the card rather than matching text.
  await page.waitForTimeout(1400);
  const option = page
    .getByText(/quick check-in/i)
    .first()
    .locator('xpath=ancestor::div[.//button][1]')
    .getByRole('button')
    .first();
  if (await option.isVisible().catch(() => false)) {
    await point(page, option);
    await page.waitForTimeout(1300);
  }
  await suppressCheckIn(page);

  // 2. Browse the catalog: Academy, a department, a course.
  await point(page, page.getByRole('link', { name: 'Academy' }));
  await page.waitForTimeout(1300);
  await point(page, page.getByRole('button', { name: /Science Department/ }));
  await page.waitForTimeout(800);
  await point(page, page.getByRole('button', { name: /Introduction to Computer Science/ }).last());
  await page.waitForTimeout(900);
  await point(page, page.getByRole('button', { name: /Open course/ }).last());
  await page.waitForURL(/\/courses\//, { timeout: 20000 });
  await page.waitForTimeout(1500);

  // 3. Look up a study group for that course.
  const search = page.getByPlaceholder('Search by name');
  await point(page, search);
  await page.keyboard.type('Recursion', { delay: 95 });
  await page.waitForTimeout(1100);

  // 4. Join it and open it.
  const card = page.locator('div', { hasText: 'Recursion Club' });
  await point(page, card.getByRole('button', { name: 'Join' }).last());
  await page.waitForTimeout(1300);
  await point(page, page.getByRole('button', { name: /Open in My Bubbles/ }).first());
  await page.waitForTimeout(1600);
  // It lands back on Home with the new Bubble in the sidebar; open it from there.
  await point(page, page.locator('button', { hasText: 'Recursion Club' }).last());
  await page.waitForTimeout(2400);

  // 5. Say hi to the new group; the message lands over WebSocket.
  const box = page.getByRole('textbox').last();
  if (await box.isVisible().catch(() => false)) {
    await point(page, box);
    await page.keyboard.type('Hey Recursion Club! Anyone up for a whiteboard session tonight?', { delay: 36 });
    await page.waitForTimeout(350);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2600);
  }

  await cdp.send('Page.stopScreencast');
  await ctx.close();
  console.log(`captured ${frames.length} frames`);

  // Screencast frames arrive only when the page repaints, so each frame is held until the next one.
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const dur = i + 1 < frames.length ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.5;
    lines.push(
      `file '${frames[i].file.replaceAll('\\', '/').replace(/^\.scratch\/reel-frames\//, '')}'`,
      `duration ${dur.toFixed(4)}`,
    );
  }
  lines.push(
    `file '${frames
      .at(-1)
      .file.replaceAll('\\', '/')
      .replace(/^\.scratch\/reel-frames\//, '')}'`,
  );
  writeFileSync(join(FRAMES, 'list.txt'), lines.join('\n'));

  mkdirSync(MEDIA, { recursive: true });
  const base = [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(FRAMES, 'list.txt'),
    '-vf',
    'fps=30,scale=1600:1000:flags=lanczos',
    '-an',
  ];
  execFileSync(
    ffmpeg,
    [
      ...base,
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      join(MEDIA, 'bubbleup-reel.mp4'),
    ],
    { stdio: 'inherit' },
  );
  execFileSync(
    ffmpeg,
    [...base, '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', join(MEDIA, 'bubbleup-reel.webm')],
    { stdio: 'inherit' },
  );
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i',
      frames[0].file,
      '-vf',
      'scale=1600:1000:flags=lanczos',
      '-q:v',
      '3',
      join(MEDIA, 'bubbleup-reel-poster.jpg'),
    ],
    { stdio: 'inherit' },
  );
  console.log('reel saved to', MEDIA);
}

const browser = await chromium.launch();
try {
  await shootStills(browser);
  if (!stillsOnly) await recordReel(browser);
} finally {
  await browser.close();
}
