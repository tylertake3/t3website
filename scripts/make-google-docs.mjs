/* Builds ONE document per person, ready to drop into Google Docs.

   Run:  node scripts/make-google-docs.mjs
   Out:  page-packs/google-docs/<Name> — Take 3 website copy.docx

   The earlier folders (review packs, worksheets, saved pages) are a lot to hand
   to someone who just wants to write. This is the simple version: each person
   gets a single file with only their own pages in it, a short brief at the top,
   and a box to type in under every question. Opened in Google Docs it has a
   working outline down the left-hand side, so they can jump between sections. */

import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, labelFor, sectionName, isImage, emptySlotCount, root, SITE } from './lib/page-copy.mjs';
import { writeDocx } from './lib/docx.mjs';

const pagesDir = join(root, 'src', 'content', 'pages');
const outDir = join(root, 'page-packs', 'google-docs');

/* Work that is not a page of the website. */
const OFF_SITE = [
  {
    name: 'Social media',
    owner: 'Zoe',
    note: 'There is no social media page on the website, so there is nothing to fill in here. Worth agreeing separately whether this means the words we use on our own channels, or a page on the site pointing at them.',
  },
];

/* --------------------------------------------------------------- explanations
   What each kind of line on a page actually is, in plain terms. */

const EXPLAIN = {
  'Small label above the heading': 'The few words in small capitals above the big heading.',
  Heading: 'The big words. Short and confident.',
  'Opening line': 'One or two sentences under the heading, in plain terms.',
  'Body copy': 'The main paragraph.',
  Description: 'A sentence or two about this one item.',
  Label: 'A few words naming this item.',
  Text: 'The line that sits next to the label.',
  'Small note': 'A short line in small type.',
  'Small note underneath': 'A short line underneath.',
  Quote: 'What the person actually said.',
  Name: 'Their name.',
  Role: 'Their job title.',
  Credits: 'What they are known for.',
  'Caption on the photo': 'The short line printed under the photo.',
  'Photo description (read aloud by screen readers)':
    'What the photo shows. Only read aloud to someone who cannot see it, so describe rather than sell.',
  'Photo slot — the words shown in the empty grey box': 'What kind of picture belongs here.',
  'Figure number printed under the photo': 'Just a number, like FIG. 01.',
  'Note printed under the photo': 'A short line under the photo.',
  'Pull quote — the big line set apart from the rest': 'One striking sentence, set large on its own.',
  'The words before the link': 'This sentence has a link in the middle. The first part goes here.',
  'The words that are the link itself': 'The clickable words in the middle.',
  'The words after the link': 'The rest of the sentence.',
  'First paragraph': 'The first paragraph.',
  'Second paragraph': 'The second paragraph. Leave it out if one is enough.',
  Paragraph: 'A few sentences.',
  'Link Label': 'The words on the button. Say what happens next — "See the dancers", not "Read more".',
  'Submit Label': 'The words on the send button. "Send the brief" beats "Submit".',
  'Count Number': 'Just the figure, like 500+.',
  'Count Label': 'The words under that figure.',
};

const META_NOTE =
  'None of this shows on the page. It is what appears in a Google result, and when someone pastes the link into WhatsApp or LinkedIn — often the first thing anyone reads about us.';

const lengthHint = (current) => {
  if (typeof current !== 'string') return '';
  const words = current.trim().split(/\s+/).filter(Boolean).length;
  if (!words || current.trim().length <= 24) return 'a few words';
  if (words <= 6) return `about ${words} words`;
  if (words <= 20) return 'one sentence';
  if (words <= 45) return 'two or three sentences';
  return 'a short paragraph';
};

/* ------------------------------------------------------------------ the form */

function formFor(value) {
  const fields = [];
  const groups = [];

  const collect = (node, into) => {
    if (node === null || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && /^TODO\b/i.test(v.trim())) {
        const tagged = v.trim().replace(/^TODO:?\s*/i, '');
        const [, kind = '', text = tagged] = tagged.match(/^([a-z]+)\s+—\s+([\s\S]+)$/i) || [];
        if (kind && !['copy', 'content', 'artwork', 'clearance'].includes(kind.toLowerCase())) continue;
        into.push({ brief: text.trim() });
        continue;
      }
      const label = labelFor(k);
      if (label === null) continue;
      if (Array.isArray(v)) {
        const first = v[0];
        if (typeof first === 'object' && first !== null) {
          const sub = [];
          collect(first, sub);
          groups.push({ name: sectionName(k), count: v.length, fields: sub });
        } else {
          groups.push({ name: sectionName(k), count: v.length, simple: true });
        }
        continue;
      }
      if (typeof v === 'object' && v !== null) {
        collect(v, into);
        continue;
      }
      if (isImage(v)) continue;
      into.push({ label, hint: lengthHint(v) });
    }
  };

  collect(value, fields);
  return { fields, groups };
}

/* --------------------------------------------------------------- the document */

function docFor(who, mine, extra) {
  const B = [];
  const push = (...b) => B.push(...b);

  push({ h: 0, text: `${who} — the words for your pages` });
  push({
    p: `**Take 3 website.** ${mine.length === 1 ? 'One page' : `${mine.length} pages`} to write, and they are yours.`,
  });
  push({ p: 'Roughly half an hour a page. Type straight into the grey boxes.' });

  push({ h: 1, text: 'Read this first' });
  push({
    p: 'We want **your version** of each page, in your own words — not corrections to ours. We will take the best of what comes back, so nothing is wasted, and nothing you write goes straight onto the website.',
  });
  push({
    p: '**You do not need to know anything about websites or design.** Every question below is about talent, productions and how we actually work. If you book artists for a living you already know the answers.',
  });
  push({ bullet: 'Write it the way you would say it on the phone to a producer. If you would not say it out loud, do not write it.' });
  push({ bullet: 'Skip anything you are unsure about. A blank box tells us the page is unclear, which is useful on its own.' });
  push({ bullet: 'Saying what to cut is as valuable as writing new words.' });
  push({ bullet: 'The lengths are a guide so the words fit the space. Go over if you have something better to say.' });
  push({ p: 'Anything in here that does not make sense is our fault, not yours — just ask.', quiet: true });

  /* Their pages at a glance. */
  push({ h: 1, text: 'Your pages' });
  push({
    table: [
      ['Page', 'Look at it here', 'Blank sections'],
      ...mine.map((r) => [
        r.name,
        `${SITE}${r.route === '/' ? '' : r.route}`,
        r.gaps ? String(r.gaps) : 'none — all written',
      ]),
    ],
    head: true,
  });
  push({
    p: 'Open a page in a browser while you work on it. Everything below is in the same order as the page itself.',
    quiet: true,
  });

  for (const r of mine) {
    push({ rule: true });
    push({ h: 1, text: r.name });
    push({ p: `**The page:** ${SITE}${r.route === '/' ? '' : r.route}` });
    push({ p: `**What it is for:** ${r.purpose}` });
    push({ p: `**Who it talks to:** ${r.audience}` });

    /* Blank sections first — the highest-value boxes on the sheet. */
    const gaps = [];
    for (const [key, value] of Object.entries(r.page)) {
      if (value === null || typeof value !== 'object') continue;
      const { fields, groups } = formFor(value);
      for (const f of [...fields, ...groups.flatMap((g) => g.fields || [])]) {
        if (f.brief) gaps.push({ section: sectionName(key), brief: f.brief });
      }
    }

    if (gaps.length) {
      push({ h: 2, text: 'Start here — the blank parts of this page' });
      push({
        p: `${gaps.length === 1 ? 'One part of this page has' : `${gaps.length} parts of this page have`} nothing written at all. If you only do one thing, do ${gaps.length === 1 ? 'this' : 'these'} — the words do not exist yet, so anything you write is a straight gain.`,
      });
      for (const g of gaps) {
        push({ h: 3, text: `${g.section}` });
        push({ p: `**What it needs:** ${g.brief}` });
        push({ blank: 4 });
      }
    }

    /* The whole-page questions. */
    push({ h: 2, text: 'About the page as a whole' });
    push({ p: 'Answer these before writing anything else. Get them right and the rest writes itself.' });

    push({ p: '**Who is reading this page?** Picture one real person — a producer you have dealt with, an artist who emailed last week.' });
    push({ p: `Our current thinking: ${r.audience}. Change it if you disagree.`, quiet: true });
    push({ blank: 2 });

    push({ p: '**What do you want them to do when they finish reading?** One thing only.' });
    push({ blank: 1 });

    push({ p: '**What is the one thing this page must get across?** If they remember nothing else.' });
    push({ blank: 1 });

    push({ p: '**What do people actually ask you about this?** The questions you answer on the phone every week. If the page does not answer them, it is not finished.' });
    push({ blank: 3 });

    push({ p: '**Should this page have pages underneath it?** If part of it deserves its own page — its own photos, its own examples, its own link you could send someone — say so. Rough rule: if you would ever email someone a link to just that bit, it should be its own page.' });
    push({
      table: [
        ['A page underneath this one', 'What would be on it', 'Who you would send it to'],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
      head: true,
    });
    push({ p: 'Nothing to add? Write "none" and move on — most pages do not need any.', quiet: true });

    /* Section by section. */
    push({ h: 2, text: 'Section by section' });
    push({
      p: 'For each one: keep it, move it, or bin it — then write your version. Delete the options that do not apply.',
      quiet: true,
    });

    let n = 0;
    for (const [key, value] of Object.entries(r.page)) {
      if (value === null || typeof value !== 'object') continue;
      n += 1;
      const isMeta = key === 'meta';
      const { fields, groups } = formFor(value);

      push({ h: 3, text: `${n}. ${sectionName(key)}` });
      if (isMeta) push({ p: META_NOTE, quiet: true });

      push({ p: 'Keep it   /   Move it elsewhere on the page   /   Remove it' });
      push({ p: 'In one line, what is this section for?' });
      push({ blank: 1 });

      for (const f of fields) {
        if (f.brief) {
          push({ p: `**Nothing is written here yet.** What it needs: ${f.brief}` });
          push({ blank: 4 });
          continue;
        }
        const explain = isMeta ? '' : EXPLAIN[f.label] || '';
        push({ p: `**${f.label}**${f.hint ? ` — ${f.hint}` : ''}` });
        if (explain) push({ p: explain, quiet: true });
        push({ blank: 1 });
      }

      for (const g of groups) {
        if (g.simple) {
          push({ p: `**${g.name}** — a list of short entries. ${g.count} on the page now; add or remove as many as you like.` });
          push({ table: [[g.name], ...Array.from({ length: Math.max(g.count, 3) + 2 }, () => [''])], head: true });
        } else {
          push({
            p: `**${g.name}** — ${g.count} of these on the page now. Fill in as many as you think it should have, and leave the rest.`,
          });
          const cols = g.fields.filter((f) => !f.brief).map((f) => f.label);
          if (cols.length) {
            push({
              table: [cols, ...Array.from({ length: g.count + 2 }, () => cols.map(() => ''))],
              head: true,
            });
          }
        }
      }

      push({ p: '**Anything to add to this section?** A line, a fact, a reassurance you always end up giving people.' });
      push({ blank: 2 });
    }

    /* Photos, reviews, missing sections. */
    const slots = emptySlotCount(r.slug);
    push({ h: 2, text: 'Photos' });
    push({
      p: slots
        ? `This page has **${slots} empty grey ${slots === 1 ? 'box' : 'boxes'}** waiting for a real photograph, and any picture already on it can be swapped.`
        : 'Every picture position on this page has a photo in it, but any of them can be swapped.',
    });
    push({
      p: 'Describe the shot you would put there. "Wide shot of six dancers mid-lift, on set, night" is far more useful than "something dynamic". If we already own the photo, name it.',
      quiet: true,
    });
    push({
      table: [
        ['Where on the page', 'What the photo should show', 'Do we already have it?'],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
      head: true,
    });

    push({ h: 2, text: 'Reviews' });
    push({ p: `**What this page needs:** ${r.reviews}${r.reviewNote ? ` ${r.reviewNote}` : ''}` });
    push({
      p: 'A **client** review is a production talking about working with us — it makes another production trust us with a booking. An **artist** review is a performer talking about being represented — it makes another artist want to join. Names are enough; we will chase the quote.',
      quiet: true,
    });
    push({
      table: [
        ['Who to ask', 'Client or artist', 'What they would say about us'],
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ],
      head: true,
    });

    push({ h: 2, text: 'Sections that should be on this page but are not' });
    push({
      p: 'The most valuable part of this whole document. What is missing? Prices, turnaround times, what we need from a client before we can start, an FAQ, a case study, insurance and clearances — whatever you find yourself explaining again and again.',
    });
    for (let i = 1; i <= 3; i += 1) {
      push({ p: `**${i}. Call it:**` });
      push({ blank: 1 });
      push({ p: 'Where on the page, and why it needs to be there:' });
      push({ blank: 1 });
      push({ p: 'What it says:' });
      push({ blank: 3 });
    }

    push({ h: 2, text: 'How the page looks' });
    push({
      p: 'You do not have to be a designer to be useful here. If something is hard to read, or the important bit is buried too far down, or you scrolled past the thing that matters — say so. "I did not see the phone number" is a real problem worth knowing about.',
    });
    push({
      p: 'To show rather than tell: screenshot the page, drop it into Canva, and move things around on top of it. Send us the picture.',
      quiet: true,
    });
    push({ blank: 3 });
  }

  for (const o of extra) {
    push({ rule: true });
    push({ h: 1, text: o.name });
    push({ p: o.note });
    push({ blank: 2 });
  }

  push({ rule: true });
  push({ h: 1, text: 'Finished?' });
  push({ p: 'Nothing to send — it saves as you type. Just tell us when you are done, or share it back.' });
  push({ p: `Written by **${who}**` });
  push({ p: 'Date:' });
  push({ blank: 1 });

  return B;
}

/* ---------------------------------------------------------------------- main */

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const rows = Object.keys(PAGES)
  .sort((a, b) => PAGES[a].order - PAGES[b].order)
  .map((slug) => {
    const file = join(pagesDir, `${slug}.json`);
    if (!existsSync(file)) return null;
    const raw = readFileSync(file, 'utf8');
    return {
      slug,
      ...PAGES[slug],
      page: JSON.parse(raw),
      gaps: (raw.match(/"TODO:\s*(copy|content|artwork|clearance)\b/gi) || []).length,
    };
  })
  .filter(Boolean);

const people = [...new Set([...rows.map((r) => r.owner), ...OFF_SITE.map((o) => o.owner)])].filter(Boolean);

for (const who of people) {
  const mine = rows.filter((r) => r.owner === who);
  const extra = OFF_SITE.filter((o) => o.owner === who);
  const out = join(outDir, `${who} — Take 3 website copy.docx`);
  writeDocx(out, `${who} — Take 3 website copy`, docFor(who, mine, extra));
  console.log(`  ${who}: ${mine.length} page${mine.length === 1 ? '' : 's'}${extra.length ? ' + social media note' : ''}`);
}

console.log(`Wrote ${people.length} documents to page-packs/google-docs/`);
