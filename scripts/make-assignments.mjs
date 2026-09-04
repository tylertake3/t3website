/* Builds the "who is doing what" sheet, plus one short sheet per person listing
   only their own pages — so nobody has to work out which of seventeen documents
   is theirs.

   Run:  node scripts/make-assignments.mjs
   Out:  page-packs/who-is-doing-what.md / .html
         page-packs/for-<name>.md / .html

   Owners are set in scripts/lib/page-copy.mjs. Add or change a name there and
   re-run; everything below follows from it. */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES, root, SITE } from './lib/page-copy.mjs';
import { mdToHtml } from './lib/md-to-html.mjs';

const pagesDir = join(root, 'src', 'content', 'pages');
const outDir = join(root, 'page-packs');

/* Work not covered by a page of the website. Kept here so it does not quietly
   fall off the list just because there is nothing to link it to. */
const OFF_SITE = [
  {
    name: 'Social media',
    owner: 'Zoe',
    note: 'Not a page on the website. Nothing to fill in here — the worksheets only cover pages that exist on the site. Worth agreeing separately what this covers: the words used across our own channels, or a page on the site pointing at them.',
  },
];

/* How much is left to write on each page, so the sheets can be honest about
   which ones are a bigger job than they look. */
const gapCount = (slug) => {
  const file = join(pagesDir, `${slug}.json`);
  if (!existsSync(file)) return 0;
  const raw = readFileSync(file, 'utf8');
  return (raw.match(/"TODO:\s*(copy|content|artwork|clearance)\b/gi) || []).length;
};

const slugs = Object.keys(PAGES).sort((a, b) => PAGES[a].order - PAGES[b].order);
const rows = slugs.map((slug) => {
  const info = PAGES[slug];
  const num = String(info.order).padStart(2, '0');
  return {
    slug,
    num,
    ...info,
    gaps: gapCount(slug),
    worksheet: `worksheets/${num}-${slug}-worksheet.html`,
    pack: `${num}-${slug}.html`,
    live: `live-pages/${info.route === '/' ? '' : `${info.route.slice(1)}/`}index.html`,
  };
});

const people = [...new Set(rows.map((r) => r.owner).filter(Boolean)), ...OFF_SITE.map((o) => o.owner)].filter(
  (p, i, a) => a.indexOf(p) === i,
);

const nameFile = (who) => `for-${who.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

/* ------------------------------------------------------- who is doing what */

const W = [];
W.push('# Who is writing which page');
W.push('');
W.push('Each person has their own short sheet listing only their pages — that is the one to send them.');
W.push('');
W.push('| Page | Address | Who | Their sheet | The worksheet to fill in | Blank sections on it |');
W.push('| --- | --- | --- | --- | --- | --- |');
for (const r of rows.filter((r) => r.owner)) {
  W.push(
    `| **${r.name}** | \`${r.route}\` | ${r.owner} | [${r.owner}'s sheet](${nameFile(r.owner)}.html) | [open](${r.worksheet}) | ${r.gaps || '—'} |`,
  );
}
W.push('');
W.push('## Not yet allocated');
W.push('');
const spare = rows.filter((r) => !r.owner);
if (spare.length) {
  W.push(`${spare.length} pages still need someone:`);
  W.push('');
  W.push('| Page | Address | Blank sections | Worth knowing |');
  W.push('| --- | --- | --- | --- |');
  const why = {
    index: 'The homepage. Probably one to do together rather than hand to one person.',
    artists: 'Half written, and it speaks to artists as much as clients.',
    'stunt-performers': 'Sits right next to the SPACT pages — may suit whoever does those.',
    specialists: 'Carries the strongest selling idea on the site, and is mostly unwritten.',
    'what-is-a-spact': 'An explainer rather than a sales page. Needs someone who can explain the term cold.',
    join: 'The most unwritten page on the site, and the only one aimed squarely at artists.',
    contact: 'Short, but the company details still need supplying.',
    laural: 'Should wait until Laural is genuinely live for productions.',
  };
  for (const r of spare) {
    W.push(`| **${r.name}** | \`${r.route}\` | ${r.gaps || '—'} | ${why[r.slug] || ''} |`);
  }
  W.push('');
} else {
  W.push('Every page has someone on it.');
  W.push('');
}

if (OFF_SITE.length) {
  W.push('## Jobs that are not a page on the site');
  W.push('');
  for (const o of OFF_SITE) {
    W.push(`**${o.name} — ${o.owner}**`);
    W.push('');
    W.push(o.note);
    W.push('');
  }
}

W.push('## The two biggest jobs on the list');
W.push('');
W.push('**Join the roster** and **Our artists** between them have most of the missing copy on the site,');
W.push('and both talk to performers rather than productions — a different voice from everything else.');
W.push('Neither has anyone on it yet.');
W.push('');
W.push('## Reviews still to gather');
W.push('');
W.push('Nearly every page wants a review on it and most have none. Each worksheet ends with a table for');
W.push('names — who to ask, and whether they are a client or an artist. Those names are worth as much as');
W.push('the writing.');
W.push('');

writeFileSync(join(outDir, 'who-is-doing-what.md'), W.join('\n'));
writeFileSync(join(outDir, 'who-is-doing-what.html'), mdToHtml(W.join('\n'), 'Who is writing which page'));

/* ----------------------------------------------------------- one per person */

for (const who of people) {
  const mine = rows.filter((r) => r.owner === who);
  const extra = OFF_SITE.filter((o) => o.owner === who);
  const P = [];

  P.push(`# ${who} — your pages`);
  P.push('');
  const tail = extra.length ? ` There is also a note on ${extra.map((o) => o.name.toLowerCase()).join(' and ')} further down.` : '';
  P.push(
    mine.length === 1
      ? `One page to write.${tail}`
      : `${mine.length} pages to write. They are related, so doing them together is easier than it looks — a lot of what you work out on the first one carries into the second.${tail}`,
  );
  P.push('');
  P.push('## What we are asking for');
  P.push('');
  P.push('Your version of each page, in your own words. Not corrections to ours — a fresh go at it. We');
  P.push('will take the best of what comes back, so nothing is wasted and nothing you write goes straight');
  P.push('onto the website.');
  P.push('');
  P.push('**You do not need to know anything about websites or design.** Every question is about talent,');
  P.push('productions and how we actually work. Write it the way you would say it to a producer on the');
  P.push('phone, and skip anything you are unsure about — a blank box tells us the page is unclear, which');
  P.push('is useful in itself.');
  P.push('');
  P.push('Roughly half an hour a page.');
  P.push('');
  P.push('## Your pages');
  P.push('');
  P.push('| Page | Look at it first | Then fill this in | Blank sections | Reviews it needs |');
  P.push('| --- | --- | --- | --- | --- |');
  for (const r of mine) {
    const rev = r.reviews.startsWith('CLIENT')
      ? 'Client'
      : r.reviews.startsWith('ARTIST')
        ? 'Artist'
        : r.reviews.startsWith('Mixed') || r.reviews.startsWith('Either')
          ? 'Either'
          : 'None';
    P.push(`| **${r.name}** | [see the page](${r.live}) | [your worksheet](${r.worksheet}) | ${r.gaps || '—'} | ${rev} |`);
  }
  P.push('');

  for (const r of mine) {
    P.push(`### ${r.name}`);
    P.push('');
    P.push(`**Address:** \`${r.route}\` — ${SITE}${r.route === '/' ? '' : r.route}`);
    P.push('');
    P.push(`**What the page is for:** ${r.purpose}`);
    P.push('');
    P.push(`**Who it is talking to:** ${r.audience}`);
    P.push('');
    P.push(`**Reviews it should carry:** ${r.reviews}${r.reviewNote ? ` ${r.reviewNote}` : ''}`);
    P.push('');
    if (r.gaps) {
      P.push(
        `**${r.gaps} part${r.gaps === 1 ? '' : 's'} of this page ${r.gaps === 1 ? 'has' : 'have'} nothing written at all.** They are listed at the top of your worksheet under "Start here". Those are the ones worth your time.`,
      );
    } else {
      P.push('**Every section on this page already has words in it** — so this one is about improving what');
      P.push('is there, and saying what is missing.');
    }
    P.push('');
    P.push(`**Also worth answering:** whether this page should have pages underneath it. Question 5 on your`);
    P.push('worksheet. If part of it deserves its own page — its own photos, its own examples, its own');
    P.push('address you could send someone straight to — say so.');
    P.push('');
  }

  if (extra.length) {
    for (const o of extra) {
      P.push(`### ${o.name}`);
      P.push('');
      P.push(o.note);
      P.push('');
    }
  }

  P.push('## How to fill one in');
  P.push('');
  P.push('1. **Open the page first** — the "see the page" link above. It works with no internet connection.');
  P.push('2. **Open your worksheet.** To type into it: open it in a browser, select everything, copy, and');
  P.push('   paste into a blank Google Doc or Word document.');
  P.push('3. **Answer "First, the whole page" before writing anything else.** Who is reading it, what');
  P.push('   should they do next, what must they take away. Everything else gets easier after that.');
  P.push('4. **Work down the sections.** For each one: keep it, move it, or bin it — then write your');
  P.push('   version. Saying what to cut is as useful as writing new words.');
  P.push('5. **Finish with the missing sections.** What do you explain to people over and over that the');
  P.push('   page never mentions? That part is worth more than all the rewriting.');
  P.push('');
  P.push('If you want to change how something **looks** rather than what it says: screenshot the page,');
  P.push('drop it into Canva, and move things around on top of it. Send the picture back.');
  P.push('');
  P.push('Anything unclear, ask — if a question in there does not make sense, that is our fault, not yours.');
  P.push('');

  writeFileSync(join(outDir, `${nameFile(who)}.md`), P.join('\n'));
  writeFileSync(join(outDir, `${nameFile(who)}.html`), mdToHtml(P.join('\n'), `${who} — your pages`));
}

console.log(`Wrote who-is-doing-what and ${people.length} personal sheets (${people.join(', ')})`);
