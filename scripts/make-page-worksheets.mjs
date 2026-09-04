/* Builds a blank worksheet per page: the same structure as the real page, with
   every line emptied out, so an agent at the agency can write their own version
   of the page without needing to know anything about how the site is built.

   Run:  node scripts/make-page-worksheets.mjs
   Out:  page-packs/worksheets/*.md and *.html

   The shape and the suggested lengths are read from the live page files, so the
   worksheet always asks for exactly the pieces the page actually has. What it
   never does is show the current words — that is what the review packs are for.
   Someone filling this in should be writing their own version from scratch. */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, labelFor, sectionName, isImage, emptySlotCount, root, SITE } from './lib/page-copy.mjs';
import { mdToHtml } from './lib/md-to-html.mjs';

const pagesDir = join(root, 'src', 'content', 'pages');
const outDir = join(root, 'page-packs', 'worksheets');

/* ------------------------------------------------------------------ wording
   Plain-English explanations of the kinds of line a page is made of. Written
   for someone who books talent for a living, not someone who builds websites. */

const EXPLAIN = {
  'Small label above the heading':
    'A few words in small capitals sitting above the big heading, setting the scene. Think "FOR FILM & TELEVISION".',
  Heading: 'The big words. Short and confident — this is what someone reads first and remembers.',
  'Opening line': 'One or two sentences directly under the heading, saying what this is in plain terms.',
  'Body copy': 'The main paragraph. Say the thing, then stop.',
  Description: 'A sentence or two describing this one item.',
  Label: 'A few words naming this item.',
  Text: 'The line of copy that sits next to the label.',
  'Small note': 'A short line in small type, adding a detail that would clutter the main copy.',
  'Small note underneath': 'A short line in small type, sitting under the block above.',
  Quote: 'What the person actually said, in their words.',
  Name: 'Their name.',
  Role: 'Their job title.',
  Credits: 'The production or company they are known for.',
  'Caption on the photo': 'A short line printed under the photo.',
  'Photo description (read aloud by screen readers)':
    'What the photo shows, in one sentence. Only ever read aloud to someone who cannot see it — so describe, do not sell.',
  'Photo slot — the words shown in the empty grey box':
    'What kind of picture belongs here. Say the shot you want.',
  'Figure number printed under the photo': 'Just a number, like FIG. 01.',
  'Note printed under the photo': 'A short line under the photo.',
  'Links to': 'Which page this button or link should take someone to.',
  'Pull quote — the big line set apart from the rest':
    'One striking sentence, set large and on its own. The line someone would repeat back to you.',
  'The words inside that line shown in bold': 'Just the words that should stand out.',
  'The words before the link': 'This sentence has a link in the middle of it. Write the first part here.',
  'The words that are the link itself': 'The clickable words in the middle of that sentence.',
  'The words after the link': 'And the rest of the sentence, after the clickable bit.',
  'First paragraph': 'The first paragraph of this section.',
  'Second paragraph': 'The second paragraph. Leave it empty if one is enough.',
  Paragraph: 'A paragraph of copy — a few sentences.',
  'Section Label': 'A short name for this block, shown in small type.',
  'Link Label': 'The words on the button or link. Say what happens next: "See the dancers", not "Read more".',
  'Link Text': 'The words on the link.',
  'Count Number': 'Just the figure, like 500+.',
  'Count Label': 'The few words underneath the figure explaining what it counts.',
  'Privacy Note': 'The small reassurance under a form about what happens to someone\'s details.',
  'Optional Label': 'The word shown next to a form field that does not have to be filled in.',
  'Select Placeholder': 'The greyed-out words in a dropdown before someone picks something.',
  'Select Prompt': 'The greyed-out words in a dropdown before someone picks something.',
  'Submit Label': 'The words on the send button. "Send the brief" beats "Submit".',
  'Fields Note': 'A small line explaining something about the form fields.',
  'Empty Note': 'What someone sees when there is nothing to show here yet.',
  'Pending Note': 'A small line explaining that something is still to come.',
  'Hours Note': 'When we are reachable.',
  'Clearance Note': 'A short line about clearances or permissions.',
  'Artwork Note': 'A note about the artwork or logo that goes here.',
  'Poster Placeholder': 'The words shown in an empty poster-shaped box.',
  'Shot Label': 'A few words naming the kind of shot this photo should be.',
  'Shot Note': 'A short line under that photo.',
  'Caption Left': 'The caption on the left-hand side.',
  'Caption Right': 'The caption on the right-hand side.',
  'Previous Label': 'The hidden wording read aloud for the "go back" arrow.',
  'Next Label': 'The hidden wording read aloud for the "go forward" arrow.',
  'Next Button': 'The words on the button that moves someone on.',
  'Play Label': 'The word on the play button.',
  'Pause Label': 'The word on the pause button.',
  'Seen On Label': 'The small label above the row of logos.',
  'Disciplines Label': 'The small label above the list of disciplines.',
  'Credit Label': 'The small label above a credit.',
  'Not Connected Title': 'What someone sees if this part of the page is not working yet.',
  'Not Connected Body': 'The explanation underneath that.',
  'Mark Slot Label': 'What kind of logo or mark belongs in this box.',
  'Mark Slot Note': 'A note about that logo.',
  'Role Flag Label': 'A short label marking who someone is in a picture.',
  'Article Headline': 'A headline for this block, written the way a trade paper would write it.',
  'Article Section': 'The small section name printed above that headline.',
  'Footer Intro': 'The line that introduces the very bottom of the page, just before the contact details.',
  'View Label': 'The word on the link that opens something — usually just "View".',
  'Legend wording — Supporting Artist': 'How we describe a supporting artist in the key under the picture.',
  'Legend wording — SPACT': 'How we describe a SPACT in that key.',
  'Legend wording — Stunt Performer': 'How we describe a stunt performer in that key.',
};

const META_EXPLAIN = {
  Heading: 'The title that shows in a Google result and in the browser tab. Around 60 characters.',
  Description:
    'The grey paragraph under the blue link in a Google result. Around 155 characters, and it should make someone click.',
  'Og Title': 'The headline that appears when this page is pasted into WhatsApp, LinkedIn or a text message.',
  'Og Description': 'The line underneath that preview.',
  'Og Image Alt': 'A description of the preview picture.',
  'Footer Title': 'The big line at the very bottom of the page, just above the contact details.',
  'Footer Intro': 'The line under that, just before the contact details.',
  'Article Headline': 'A headline for this page, written the way a trade paper would write it.',
  'Article Section': 'The small section name printed above that headline.',
};

/* Rough guidance, worked out from how long the current line is, so the team
   writes something that will physically fit where it has to go. */
const lengthHint = (current) => {
  if (typeof current !== 'string') return '';
  const words = current.trim().split(/\s+/).filter(Boolean).length;
  const chars = current.trim().length;
  if (!words) return 'a few words';
  if (chars <= 24) return 'a few words';
  if (words <= 6) return `about ${words} words`;
  if (words <= 20) return `roughly ${Math.max(5, Math.round(words / 5) * 5)} words — one sentence`;
  if (words <= 45) return `roughly ${Math.round(words / 10) * 10} words — two or three sentences`;
  return `roughly ${Math.round(words / 10) * 10} words — a short paragraph`;
};

const BLANK = '_____________________________________________________________';

/* --------------------------------------------------------------- the questions
   Asked once per page, before any of the section-by-section detail. */

const pageQuestions = (info) => {
  const Q = [];
  Q.push('## First, the whole page');
  Q.push('');
  Q.push('Answer these before you write a single line. If you get these right the rest writes itself.');
  Q.push('');
  Q.push('**1. Who is reading this page?** Picture one real person — a producer you have dealt with, an');
  Q.push('artist who emailed you last week. Name them if it helps.');
  Q.push('');
  Q.push(`_Our current thinking: ${info.audience}. Agree? Change it if not._`);
  Q.push('');
  Q.push(`> ${BLANK}`);
  Q.push('>');
  Q.push(`> ${BLANK}`);
  Q.push('');
  Q.push('**2. What do you want them to do when they finish reading?** One thing only. Call us, send a');
  Q.push('brief, apply, or just believe we can handle it.');
  Q.push('');
  Q.push(`> ${BLANK}`);
  Q.push('');
  Q.push('**3. What is the one thing this page must get across?** If they remember nothing else.');
  Q.push('');
  Q.push(`> ${BLANK}`);
  Q.push('');
  Q.push('**4. What do people actually ask you about this?** The questions you answer on the phone every');
  Q.push('week. If the page does not answer them, it is not finished.');
  Q.push('');
  Q.push(`> ${BLANK}`);
  Q.push('>');
  Q.push(`> ${BLANK}`);
  Q.push('>');
  Q.push(`> ${BLANK}`);
  Q.push('');
  Q.push('**5. Should this page have pages underneath it?**');
  Q.push('');
  Q.push('Sometimes one page is trying to do the work of three. If part of this page deserves its own');
  Q.push('page — with its own photos, its own examples, its own address someone could be sent straight');
  Q.push('to — say so here. A rough rule: if you would ever email someone a link to just that bit, it');
  Q.push('should probably be its own page.');
  Q.push('');
  Q.push('| A page underneath this one | What would be on it | Who would you send it to |');
  Q.push('| --- | --- | --- |');
  Q.push('|  |  |  |');
  Q.push('|  |  |  |');
  Q.push('|  |  |  |');
  Q.push('');
  Q.push('_Nothing to add? Write "none" and move on — most pages do not need any._');
  Q.push('');
  Q.push('**6. Is this page even needed?** Say so if you think it should be merged into another one, or');
  Q.push('dropped. Better to hear it now.');
  Q.push('');
  Q.push(`> ${BLANK}`);
  Q.push('');
  Q.push('---');
  Q.push('');
  return Q;
};

/* ------------------------------------------------------- section fields → form */

/** Flattens one section of a page into the questions a worksheet should ask.
 *  Groups the repeated blocks (list items, cards, disciplines) so the worksheet
 *  can hand out one small form per item plus spares. */
function formFor(value) {
  const fields = [];
  const groups = [];
  let photoSlots = 0;

  const collect = (node, into) => {
    if (node === null || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      /* A "todo" is a note left by whoever built the page saying what is still
         needed here. That note is the best brief a writer could be given, so it
         gets shown as one rather than as another blank line. */
      if (typeof v === 'string' && /^TODO\b/i.test(v.trim())) {
        /* These notes come tagged with what kind of gap they are. Only the ones
           a person at the agency can actually answer belong on a worksheet —
           the rest are jobs for whoever builds the page. */
        const tagged = v.trim().replace(/^TODO:?\s*/i, '');
        const [, kind = '', text = tagged] = tagged.match(/^([a-z]+)\s+—\s+([\s\S]+)$/i) || [];
        const asked = ['copy', 'content', 'artwork', 'clearance'].includes(kind.toLowerCase());
        if (!asked && kind) continue;
        into.push({ brief: text.trim(), kind: kind.toLowerCase(), where: labelFor(k) });
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
          groups.push({ name: sectionName(k), count: v.length, simple: true, sample: first });
        }
        continue;
      }

      if (typeof v === 'object' && v !== null) {
        collect(v, into);
        continue;
      }

      if (isImage(v)) {
        photoSlots += 1;
        continue;
      }
      into.push({ label, hint: lengthHint(v) });
    }
  };

  collect(value, fields);
  return { fields, groups, photoSlots };
}

const askField = (f, meta) => {
  /* An empty section with a brief attached: the most useful box on the sheet. */
  if (f.brief) {
    const L = ['**This part of the page is empty — nothing has been written for it yet.**', ''];
    if (f.where && f.where !== 'Todo') {
      L.push(`**Which bit:** ${f.where}`, '');
    }
    L.push(`**What it needs:** ${f.brief}`, '');
    L.push('This is the one worth your time. Write it however you would say it out loud.', '');
    for (let i = 0; i < 4; i += 1) {
      L.push(`> ${BLANK}`);
      if (i < 3) L.push('>');
    }
    L.push('');
    return L;
  }
  const explain = (meta ? META_EXPLAIN[f.label] : EXPLAIN[f.label]) || '';
  const L = [];
  L.push(`**${f.label}**${f.hint ? ` — _${f.hint}_` : ''}`);
  if (explain) {
    L.push('');
    L.push(explain);
  }
  L.push('');
  L.push(`> ${BLANK}`);
  L.push('');
  return L;
};

/* ------------------------------------------------------------------- worksheet */

function worksheet(slug, page, info) {
  const emptySlots = emptySlotCount(slug);
  const L = [];

  L.push(`# ${info.name} — your version`);
  L.push('');
  if (info.owner) {
    L.push(`## ${info.owner} — this one is yours`);
    L.push('');
  }
  L.push(`**Page ${info.order} of ${Object.keys(PAGES).length}**  `);
  L.push(`**Where it lives:** \`${info.route}\`  `);
  L.push(`**See the page as it is now:** ${SITE}${info.route === '/' ? '' : info.route}  `);
  L.push(
    `**Or open the saved copy:** [click here](../live-pages/${info.route === '/' ? '' : `${info.route.slice(1)}/`}index.html)  `,
  );
  L.push('');
  L.push('---');
  L.push('');
  L.push('## Read this bit first');
  L.push('');
  L.push('This is a blank version of the page. Every place the page has words, there is an empty box');
  L.push('here for you to write your own.');
  L.push('');
  L.push('**You do not need to know anything about websites to fill this in.** You know what productions');
  L.push('ask for and how we actually work — that is the whole skill needed here. Write it the way you');
  L.push('would say it to a producer on the phone.');
  L.push('');
  L.push('Six things to hold on to:');
  L.push('');
  L.push('1. **Write your version, not a correction of ours.** We will take the best of what comes back.');
  L.push('   Do not worry about matching what is there now.');
  L.push('2. **Plain words win.** If you would not say it out loud, do not write it. No "bespoke',
  );
  L.push('   solutions", no "passionate about excellence".');
  L.push('3. **The lengths are a guide, not a rule.** Each box says roughly how long it should be so it');
  L.push('   fits on the page. Go over if you have something better to say — we can make it fit.');
  L.push('4. **Skip anything you are unsure about.** A half-finished worksheet is genuinely useful. Blank');
  L.push('   boxes tell us where the page is confusing.');
  L.push('5. **Cross things out.** If a whole section should not exist, tick "remove it" and move on.');
  L.push('   Saying what to cut is as valuable as writing new words.');
  L.push('6. **Add anything missing.** There is space at the end of every section, and at the end of the');
  L.push('   document, for sections that are not there at all yet.');
  L.push('');
  L.push('If you would rather do it in Google Docs or Word: open the `.html` version of this file in a');
  L.push('browser, select everything, copy, and paste it into a blank document. You can then type');
  L.push('straight into it.');
  L.push('');
  L.push('---');
  L.push('');

  /* Anything on this page with nothing written for it yet, pulled to the front:
     these are the boxes where a filled-in answer changes the page most. */
  const gaps = [];
  for (const [key, value] of Object.entries(page)) {
    if (value === null || typeof value !== 'object') continue;
    const { fields, groups } = formFor(value);
    const briefs = [...fields, ...groups.flatMap((g) => g.fields || [])].filter((f) => f.brief);
    for (const b of briefs) gaps.push({ section: sectionName(key), brief: b.brief });
  }

  if (gaps.length) {
    L.push('## Start here: the parts of this page that are blank');
    L.push('');
    L.push(
      `${gaps.length === 1 ? 'One section of this page has' : `${gaps.length} parts of this page have`} nothing written for ${gaps.length === 1 ? 'it' : 'them'} at all. If you only do one thing with this worksheet, do ${gaps.length === 1 ? 'this one' : 'these'} — the words simply do not exist yet, so anything you write is a straight gain.`,
    );
    L.push('');
    for (const g of gaps) {
      L.push(`- **${g.section}** — ${g.brief}`);
    }
    L.push('');
    L.push('Each one has its own box further down, in the section it belongs to.');
    L.push('');
    L.push('---');
    L.push('');
  }

  L.push(...pageQuestions(info));

  /* --- section by section --- */
  const sections = Object.entries(page);
  let n = 0;
  for (const [key, value] of sections) {
    n += 1;
    const isMeta = key === 'meta';
    /* Some entries are a note to whoever builds the page, not page copy. */
    if (value === null || typeof value !== 'object') {
      n -= 1;
      continue;
    }
    const { fields, groups, photoSlots } = formFor(value);
    const name = sectionName(key);

    L.push(`## Section ${n}: ${name}`);
    L.push('');

    if (isMeta) {
      L.push('**None of this shows on the page itself.** It is the text that appears when the page comes up');
      L.push('in a Google search, or when someone pastes the link into WhatsApp or LinkedIn. Worth getting');
      L.push('right — for a lot of people it is the first thing they ever read about us.');
      L.push('');
    }

    L.push('**Should this section exist?**');
    L.push('');
    L.push('☐  Keep it — I have written my version below  ');
    L.push('☐  Keep it, but move it somewhere else on the page (say where): ' + BLANK + '  ');
    L.push('☐  Remove it — because: ' + BLANK);
    L.push('');
    L.push('**In one line, what is this section for?** _(if you cannot answer, that tells us something)_');
    L.push('');
    L.push(`> ${BLANK}`);
    L.push('');

    if (fields.length) {
      L.push('### The words');
      L.push('');
      for (const f of fields) L.push(...askField(f, isMeta));
    }

    for (const g of groups) {
      L.push(`### ${g.name}`);
      L.push('');
      if (g.simple) {
        L.push(`A list of short entries — there are **${g.count}** on the page now. Add or remove as many as`);
        L.push('you like; the page copes with any number.');
        L.push('');
        const rows = Math.max(g.count, 3) + 2;
        for (let i = 1; i <= rows; i += 1) L.push(`${i}. ${BLANK}`);
        L.push('');
      } else {
        L.push(`**${g.count}** of these on the page now. Fill in as many as you think it should have —`);
        L.push('there are a couple of spare ones at the end, and you can ignore any you do not need.');
        L.push('');
        const boxes = g.count + 2;
        for (let i = 1; i <= boxes; i += 1) {
          L.push(`**${g.name.replace(/s$/, '')} ${i}**${i > g.count ? ' _(spare — only if you want another)_' : ''}`);
          L.push('');
          for (const f of g.fields) {
            L.push(`- **${f.label}:** ${BLANK}`);
          }
          L.push('');
        }
      }
    }

    const pictures = photoSlots + (n === 1 ? 0 : 0);
    if (pictures || /photo|figure|slot|roster|portrait|plate/i.test(key)) {
      L.push('### Photos in this section');
      L.push('');
      L.push('Describe the picture you would put here — the shot, the production, the feeling. "Wide shot of');
      L.push('six dancers mid-lift, on set, night" is far more useful than "something dynamic". If you know');
      L.push('a specific photo we already own, name it.');
      L.push('');
      const count = Math.max(pictures, 1);
      for (let i = 1; i <= count; i += 1) {
        L.push(`**Photo ${i}** — what should it show?`);
        L.push('');
        L.push(`> ${BLANK}`);
        L.push('');
      }
    }

    L.push('**Anything to add to this section?** A line, a fact, a reassurance you always end up giving');
    L.push('people. Write it here even if you are not sure where it goes.');
    L.push('');
    L.push(`> ${BLANK}`);
    L.push('>');
    L.push(`> ${BLANK}`);
    L.push('');
    L.push('---');
    L.push('');
  }

  /* --- reviews --- */
  L.push('## Reviews on this page');
  L.push('');
  L.push(`**What this page needs:** ${info.reviews}`);
  if (info.reviewNote) {
    L.push('');
    L.push(info.reviewNote);
  }
  L.push('');
  L.push('There are two kinds and they do different jobs:');
  L.push('');
  L.push('- A **client review** is a production talking about working with us. It makes another production');
  L.push('  trust us with a booking.');
  L.push('- An **artist review** is a performer talking about being represented by us. It makes another');
  L.push('  artist want to join the roster.');
  L.push('');
  L.push('Who should we be asking, and what would you want them to say? Names are enough — we will chase');
  L.push('the quote.');
  L.push('');
  L.push('| Who to ask | Client or artist | What they would say about us |');
  L.push('| --- | --- | --- |');
  L.push('|  |  |  |');
  L.push('|  |  |  |');
  L.push('|  |  |  |');
  L.push('|  |  |  |');
  L.push('');
  L.push('---');
  L.push('');

  /* --- photos overall --- */
  L.push('## Photos across the whole page');
  L.push('');
  if (emptySlots) {
    L.push(`There are **${emptySlots} empty grey boxes** on this page waiting for a real photograph. On top of`);
    L.push('that, any picture already there can be swapped.');
  } else {
    L.push('Every picture position on this page has a photo in it, but any of them can be swapped.');
  }
  L.push('');
  L.push('| Where on the page | What the photo should show | Do we already have it? |');
  L.push('| --- | --- | --- |');
  for (let i = 0; i < 5; i += 1) L.push('|  |  |  |');
  L.push('');
  L.push('---');
  L.push('');

  /* --- new sections --- */
  L.push('## Sections that should be on this page but are not');
  L.push('');
  L.push('The most valuable part of this whole document. What is missing? A price explanation, a');
  L.push('turnaround time, a list of what we need from a client before we can start, an FAQ, a case');
  L.push('study, insurance and clearances — whatever you find yourself explaining again and again.');
  L.push('');
  for (let i = 1; i <= 3; i += 1) {
    L.push(`**New section ${i}**`);
    L.push('');
    L.push(`- **Call it:** ${BLANK}`);
    L.push(`- **Where on the page:** ${BLANK}`);
    L.push(`- **Why it needs to be there:** ${BLANK}`);
    L.push('- **What it says:**');
    L.push('');
    L.push(`> ${BLANK}`);
    L.push('>');
    L.push(`> ${BLANK}`);
    L.push('>');
    L.push(`> ${BLANK}`);
    L.push('');
  }
  L.push('---');
  L.push('');

  /* --- design and anything else --- */
  L.push('## How it looks');
  L.push('');
  L.push('You do not have to be a designer to be useful here. If a section is hard to read, if something');
  L.push('important is buried too far down, if you scrolled past the bit that matters — say so. "I did not');
  L.push('see the phone number" is a real problem worth knowing about.');
  L.push('');
  L.push('If you want to show rather than tell: take a screenshot of the page, drop it into Canva, and');
  L.push('move things around on top of it. Send us the picture.');
  L.push('');
  L.push(`> ${BLANK}`);
  L.push('>');
  L.push(`> ${BLANK}`);
  L.push('>');
  L.push(`> ${BLANK}`);
  L.push('');
  L.push('## Anything else at all');
  L.push('');
  L.push('Half-thoughts welcome.');
  L.push('');
  L.push(`> ${BLANK}`);
  L.push('>');
  L.push(`> ${BLANK}`);
  L.push('>');
  L.push(`> ${BLANK}`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('**Done?** Save it, put your name and the date at the top, and send it back. Thank you — this is');
  L.push('the part nobody else can do for us.');
  L.push('');
  L.push(`Filled in by: ${info.owner ? `**${info.owner}**` : BLANK}`);
  L.push('');
  L.push('Date: ' + BLANK);
  L.push('');

  return L.join('\n');
}

/* ---------------------------------------------------------------------- main */

mkdirSync(outDir, { recursive: true });

const done = [];
const slugs = Object.keys(PAGES).sort((a, b) => PAGES[a].order - PAGES[b].order);

for (const slug of slugs) {
  const file = join(pagesDir, `${slug}.json`);
  if (!existsSync(file)) continue;
  const page = JSON.parse(readFileSync(file, 'utf8'));
  const info = PAGES[slug];
  const md = worksheet(slug, page, info);
  const num = String(info.order).padStart(2, '0');
  writeFileSync(join(outDir, `${num}-${slug}-worksheet.md`), md);
  writeFileSync(join(outDir, `${num}-${slug}-worksheet.html`), mdToHtml(md, `${info.name} — your version`));
  done.push({ num, slug, ...info, sections: Object.keys(page).length });
}

/* ------------------------------------------------------------------- contents */

const I = [];
I.push('# Write your own version of the site');
I.push('');
I.push('One blank worksheet per page. Same sections as the real page, all the words taken out, with a');
I.push('box under each one for you to write your own.');
I.push('');
I.push('## You do not need to be a designer');
I.push('');
I.push('Everything in here is a question about talent, productions and how we work — not about');
I.push('websites. If you book artists for a living you already know the answers.');
I.push('');
I.push('## How to do it');
I.push('');
I.push('1. **Take one page.** Not the whole site. One page is about half an hour.');
I.push('2. **Open the real page first** so you can see what it currently does. Every worksheet links to');
I.push('   it at the top, and there is a saved copy in the `live-pages` folder that works offline.');
I.push('3. **Open the worksheet.** Use the `.html` file if you want to type into it: open it in a');
I.push('   browser, select all, copy, paste into a blank Google Doc or Word document.');
I.push('4. **Answer "First, the whole page" before anything else.** Who is reading it, what should they');
I.push('   do next, what must they take away. The rest gets much easier once those are down.');
I.push('5. **Work down the sections.** For each one: keep it, move it, or bin it — then write your version.');
I.push('6. **Do not stall on a box.** Skip it. Blanks tell us where the page is unclear.');
I.push('7. **Finish with the missing sections.** What do you explain to people over and over that the');
I.push('   page never mentions? That part is worth more than all the rewriting.');
I.push('');
I.push('## What happens to it');
I.push('');
I.push('Send it back and we take the best of it. Nothing you write goes straight onto the website, so');
I.push('there is no way to get it wrong — a rough answer in your own words beats a polished one that');
I.push('sounds like everybody else.');
I.push('');
I.push('## The worksheets');
I.push('');
I.push('| # | Page | Who is writing it | Blank worksheet | See the page now | Reviews it needs |');
I.push('| --- | --- | --- | --- | --- | --- |');
for (const d of done) {
  const rev = d.reviews.startsWith('CLIENT')
    ? 'Client'
    : d.reviews.startsWith('ARTIST')
      ? 'Artist'
      : d.reviews.startsWith('Mixed') || d.reviews.startsWith('Either')
        ? 'Either'
        : 'None';
  const live = `../live-pages/${d.route === '/' ? '' : `${d.route.slice(1)}/`}index.html`;
  I.push(
    `| ${d.num} | **${d.name}** | ${d.owner ? `**${d.owner}**` : '_not allocated_'} | [fill this in](${d.num}-${d.slug}-worksheet.html) | [look at it](${live}) | ${rev} |`,
  );
}
I.push('');
I.push('## If you only have time for one');
I.push('');
I.push('**Join the roster** and **Our artists** are the two that need the most work — both are half');
I.push('written, and both are aimed at performers rather than productions, so they need a completely');
I.push('different voice from the rest of the site.');
I.push('');
I.push('## One more thing worth asking yourself');
I.push('');
I.push('Every worksheet asks whether that page should have pages underneath it. Please answer it. The');
I.push('site can have as many pages as it needs, and the pages we are missing are usually the ones');
I.push('somebody on the phone asks for every week.');
I.push('');

writeFileSync(join(outDir, 'README.md'), I.join('\n'));
writeFileSync(join(outDir, 'index.html'), mdToHtml(I.join('\n'), 'Write your own version of the site'));

console.log(`Wrote ${done.length} worksheets to page-packs/worksheets/`);
