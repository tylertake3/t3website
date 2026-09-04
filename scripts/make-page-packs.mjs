/* Builds one "page pack" per page of the site, for people reviewing the words
   and photos without opening the code.

   Run:  node scripts/make-page-packs.mjs
   Out:  page-packs/*.md   (plain text, opens anywhere)
         page-packs/*.html (open in a browser, select all, paste into Google Docs
                            or Word and the headings and tables survive)

   Everything here is read from the real page files, so a re-run always matches
   what the site currently says. */

import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, LABELS, SECTION_NAMES, humanise, labelFor, sectionName, isImage, isTodo, emptySlotCount, root, SITE } from './lib/page-copy.mjs';

const pagesDir = join(root, 'src', 'content', 'pages');
const outDir = join(root, 'page-packs');

/* --------------------------------------------------------------- photo sizes */

const fileSize = (webPath) => {
  const p = join(root, 'public', webPath.replace(/^\//, ''));
  if (!existsSync(p)) return null;
  const kb = statSync(p).size / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
};

/* ------------------------------------------------------------ block rendering
   Walks a page's content and turns it into an ordered list of blocks that both
   the Markdown and the HTML writer can render. */

function blocksFor(value, depth = 3) {
  const out = [];

  const pushField = (key, val) => {
    const label = labelFor(key);
    if (label === null) return; // internal positioning value, not copy
    if (isImage(val)) {
      out.push({ t: 'photo', label, path: val });
      return;
    }
    if (typeof val === 'string' && val.trim() === '') {
      out.push({ t: 'field', label, value: '(empty)', empty: true });
      return;
    }
    out.push({ t: 'field', label, value: String(val), todo: isTodo(val) });
  };

  const walk = (node, d) => {
    if (node === null || node === undefined) return;

    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) {
          out.push({ t: 'item', n: i + 1 });
          walk(item, d + 1);
        } else {
          out.push({ t: 'bullet', value: String(item), todo: isTodo(item) });
        }
      });
      return;
    }

    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (Array.isArray(v)) {
          out.push({ t: 'heading', d, text: sectionName(k), count: v.length });
          walk(v, d);
        } else if (typeof v === 'object' && v !== null) {
          out.push({ t: 'heading', d, text: sectionName(k) });
          walk(v, d + 1);
        } else {
          pushField(k, v);
        }
      }
      return;
    }

    pushField('text', node);
  };

  walk(value, depth);
  return out;
}

/* ------------------------------------------------------------------ markdown */

const NOTE_PROMPT =
  '> **Your notes:** anything to reword, cut, or say differently? Any photo you would swap?\n>\n> _(type here)_';

function toMarkdown(slug, page, info) {
  const photos = [];
  const todos = [];
  const L = [];
  const emptySlots = emptySlotCount(slug);

  L.push(`# ${info.name}`);
  L.push('');
  L.push(`**Address on the site:** \`${info.route}\`  `);
  L.push(`**Live page:** ${SITE}${info.route === '/' ? '' : info.route}  `);
  L.push(
    `**The page as it looks today:** [open it](live-pages/${info.route === '/' ? '' : `${info.route.slice(1)}/`}index.html) _(in the \`live-pages\` folder next to this document)_  `,
  );
  L.push(`**Page ${info.order} of ${Object.keys(PAGES).length}**`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('## What this page is for');
  L.push('');
  L.push(info.purpose);
  L.push('');
  L.push(`**Who it is talking to:** ${info.audience}`);
  L.push('');
  L.push(`**Reviews on this page:** ${info.reviews}${info.reviewNote ? ` ${info.reviewNote}` : ''}`);
  L.push('');
  L.push(
    emptySlots
      ? `**Photography:** ${emptySlots} empty photo slot${emptySlots === 1 ? '' : 's'} on this page — grey boxes waiting for a real picture. They are named in the sections below.`
      : '**Photography:** no empty slots — every picture position on this page has a photo in it.',
  );
  L.push('');
  L.push('## How to use this document');
  L.push('');
  L.push('Open the live page alongside this, and work down the sections in order — they are in the');
  L.push('same order as the page itself. Every word on the page is here. Type your notes straight');
  L.push('into the boxes, or use comments if you are in Google Docs.');
  L.push('');
  L.push('- **Copy** — reword anything in the quoted lines. Keep roughly the same length unless you say otherwise.');
  L.push('- **Photos** — every photo slot is listed with its file name. Say what you would put there instead.');
  L.push('- **Design** — if a section would work better as something else, describe it or sketch it. Nothing here is fixed.');
  L.push('');
  L.push('---');
  L.push('');

  const sections = Object.entries(page);
  let n = 0;
  for (const [key, value] of sections) {
    n += 1;
    L.push(`## ${n}. ${sectionName(key)}`);
    L.push('');

    const blocks = blocksFor(value);
    const localPhotos = [];

    for (const b of blocks) {
      if (b.t === 'heading') {
        if (L[L.length - 1] !== '') L.push('');
        L.push(`${'#'.repeat(Math.min(b.d, 6))} ${b.text}${b.count ? ` _(${b.count} items)_` : ''}`);
        L.push('');
      } else if (b.t === 'item') {
        if (L[L.length - 1] !== '') L.push('');
        L.push(`**Item ${b.n}**`);
        L.push('');
      } else if (b.t === 'bullet') {
        L.push(`- ${b.value}${b.todo ? '  ← **needs writing**' : ''}`);
        if (b.todo) todos.push(b.value);
      } else if (b.t === 'photo') {
        localPhotos.push(b);
        photos.push({ ...b, section: sectionName(key) });
      } else if (b.t === 'field') {
        const val = b.value.split('\n').join(' / ');
        if (b.empty) {
          L.push(`- **${b.label}:** _(nothing set)_`);
        } else if (b.todo) {
          todos.push(val);
          L.push(`- **${b.label}:** ${val}  ← **needs writing**`);
        } else {
          L.push(`- **${b.label}:** ${val}`);
        }
      }
    }
    L.push('');

    if (localPhotos.length) {
      L.push(`### Photos in this section (${localPhotos.length})`);
      L.push('');
      L.push('| Where | File | Size | Would you change it? |');
      L.push('| --- | --- | --- | --- |');
      for (const p of localPhotos) {
        const file = p.path.split('/').pop();
        L.push(`| ${p.label} | \`${file}\` | ${fileSize(p.path) || '—'} |  |`);
      }
      L.push('');
    }

    L.push(NOTE_PROMPT);
    L.push('');
    L.push('---');
    L.push('');
  }

  L.push('## Everything still to be written on this page');
  L.push('');
  if (todos.length) {
    todos.forEach((t) => L.push(`- ${t.slice(0, 200)}`));
  } else {
    L.push('Nothing outstanding — every line on this page has real copy in it.');
  }
  L.push('');
  L.push(`## All photos on this page (${photos.length})`);
  L.push('');
  if (photos.length) {
    L.push('| Section | Where | File |');
    L.push('| --- | --- | --- |');
    photos.forEach((p) => L.push(`| ${p.section} | ${p.label} | \`${p.path.split('/').pop()}\` |`));
  } else {
    L.push('No photos are chosen for this page yet.');
  }
  if (emptySlots) {
    L.push('');
    L.push(
      `Plus **${emptySlots} empty photo slot${emptySlots === 1 ? '' : 's'}** still to be filled — look for "Photo slot" in the sections above.`,
    );
  }
  L.push('');
  L.push('## Anything else about this page');
  L.push('');
  L.push('> _(type here — design ideas, sections you would add or remove, pages it should link to)_');
  L.push('');

  return { md: L.join('\n'), photoCount: photos.length, todoCount: todos.length, emptySlots };
}

import { mdToHtml } from './lib/md-to-html.mjs';


/* ---------------------------------------------------------------------- main */

mkdirSync(outDir, { recursive: true });

const summary = [];
const slugs = Object.keys(PAGES).sort((a, b) => PAGES[a].order - PAGES[b].order);

for (const slug of slugs) {
  const file = join(pagesDir, `${slug}.json`);
  if (!existsSync(file)) {
    console.warn(`skipped ${slug} — no content file`);
    continue;
  }
  const page = JSON.parse(readFileSync(file, 'utf8'));
  const info = PAGES[slug];
  const { md, photoCount, todoCount, emptySlots } = toMarkdown(slug, page, info);
  const num = String(info.order).padStart(2, '0');
  writeFileSync(join(outDir, `${num}-${slug}.md`), md);
  writeFileSync(join(outDir, `${num}-${slug}.html`), mdToHtml(md, info.name));
  summary.push({ slug, num, ...info, photoCount, todoCount, emptySlots });
}

/* index */
const I = [];
I.push('# Take 3 — page-by-page review packs');
I.push('');
I.push('One document per page of the website. Each one lists every word on that page,');
I.push('every photo slot, what the page is for, who it is talking to, and which kind of');
I.push('review belongs on it — with space to write notes against each section.');
I.push('');
I.push('There are three things in this folder, for three different jobs:');
I.push('');
I.push('- **The review packs** (the files listed below) — every word currently on each page, with room');
I.push('  to note what you would change. Use these to react to what is there.');
I.push('- **`worksheets`** — the same pages with all the words taken out, so you can write your own');
I.push('  version from scratch. Start at `worksheets/index.html`. Use these to write, not react.');
I.push('- **`live-pages`** — the real pages as they look today, saved to open offline. Start at');
I.push('  `live-pages/browse.html`. Use these to see the design.');
I.push('');
I.push('If you are handing this to someone for the first time, point them at the **worksheets**. A blank');
I.push('page in their own words is worth more than notes in the margin of ours.');
I.push('');
I.push('## Who is doing what');
I.push('');
I.push('**[Who is writing which page](who-is-doing-what.html)** — the full list, including the pages');
I.push('nobody is on yet.');
I.push('');
I.push('Each person also has a short sheet covering only their own pages. That is the one to send them,');
I.push('rather than this whole folder:');
I.push('');
for (const who of [...new Set(summary.map((s) => s.owner).filter(Boolean))]) {
  const theirs = summary.filter((s) => s.owner === who).map((s) => s.name).join(', ');
  I.push(`- **[${who}](for-${who.toLowerCase()}.html)** — ${theirs}`);
}
I.push('');
I.push('## The quickest way to get going');
I.push('');
I.push('1. **Open `index.html`** (this page) in a browser and click through to the page you have been given.');
I.push('2. **Open the live page next to it** — the address is at the top of every pack. Seeing the real');
I.push('   page while you read the words is the whole point.');
I.push('3. **Get it into something you can type in.** In the browser: select all, copy, then paste into');
I.push('   a new Google Doc or Word document. Headings, tables and the note boxes all survive the paste,');
I.push('   and you can leave comments the normal way. One document per page keeps it clean.');
I.push('4. **Write in the note boxes** under each section, and fill in the "would you change it?" column');
I.push('   in the photo tables.');
I.push('');
I.push('If you would rather not use Google Docs, the matching `.md` file is the same content as plain');
I.push('text and opens in anything.');
I.push('');
I.push('## If you want to redesign a page rather than just reword it');
I.push('');
I.push('Two good options, depending on how far you want to go:');
I.push('');
I.push('- **Screenshot straight into Canva.** Open the live page, take a full-page screenshot');
I.push('  (in Chrome: right-click → Inspect → Cmd+Shift+P → type "screenshot" → "Capture full size');
I.push('  screenshot"; on a Mac, Shift+Cmd+4 grabs any part of the screen). Drop that image into a');
I.push('  Canva design, lock it as the background, and draw over the top — move blocks around, swap in');
I.push('  a photo you prefer, retype a headline. It is the fastest way to say "this would look better');
I.push('  like *this*".');
I.push('- **Sketch it and describe it.** A rough drawing plus a sentence in the note box works just as');
I.push('  well and takes two minutes. Nothing needs to be pretty to be useful.');
I.push('');
I.push('Either way, send back the document plus any images. Nothing you do here can break the website —');
I.push('the real pages only change once someone deliberately makes the change.');
I.push('');
I.push('## What to look for');
I.push('');
I.push('- **Does it sound like us?** Confident, plain, no fluff. Read it aloud — if you would not say it');
I.push('  on the phone to a producer, flag it.');
I.push('- **Is it true?** Numbers, credits and claims all need to be right.');
I.push('- **Is anything missing?** A question a client or artist would ask that the page does not answer.');
I.push('- **Photos.** Every pack lists the pictures in place and the empty slots waiting for one. Say what');
I.push('  should go in each — a specific shoot, a production, a type of shot.');
I.push('- **Reviews.** Each pack says whether the reviews on that page should be clients talking about us,');
I.push('  or artists talking about being represented. If you know the right person to ask for one, say so.');
I.push('');
I.push('## The pages');
I.push('');
I.push('| # | Page | Address | Talking to | Reviews | Photos in place | Photos needed | Copy still to write |');
I.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const s of summary) {
  const who = s.audience.split('—')[0].trim();
  const rev = s.reviews.startsWith('CLIENT')
    ? 'Client'
    : s.reviews.startsWith('ARTIST')
      ? 'Artist'
      : s.reviews.startsWith('Mixed') || s.reviews.startsWith('Either')
        ? 'Either'
        : 'None';
  I.push(
    `| ${s.num} | [${s.name}](${s.num}-${s.slug}.html) | \`${s.route}\` | ${who} | ${rev} | ${s.photoCount || '—'} | ${s.emptySlots || '—'} | ${s.todoCount || '—'} |`,
  );
}
I.push('');
I.push('## Two things worth deciding as a group');
I.push('');
I.push('1. **Where the artist voices go.** Right now every review on the site is a client');
I.push('   talking about the agency. The Join and Our Artists pages are the ones crying out');
I.push('   for performers talking about being represented.');
I.push('2. **Which photos are placeholders.** Several pages have no real photography set yet.');
I.push('   Those are marked in each pack.');
I.push('');

writeFileSync(join(outDir, 'README.md'), I.join('\n'));
writeFileSync(join(outDir, 'index.html'), mdToHtml(I.join('\n'), 'Take 3 — page review packs'));

console.log(`Wrote ${summary.length} page packs to page-packs/`);
for (const s of summary) console.log(`  ${s.num}-${s.slug}  · ${s.photoCount} photos · ${s.todoCount} to write`);
