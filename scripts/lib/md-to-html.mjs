/* Turns the Markdown these scripts produce into a styled page that can be read
   in a browser, or pasted straight into Google Docs or Word with its headings,
   tables and note boxes intact. Deliberately handles only the small amount of
   Markdown used here rather than the whole language. */

/* ---------------------------------------------------------------------- HTML */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function mdToHtml(md, title) {
  const lines = md.split('\n');
  const out = [];
  let inTable = false;
  let inQuote = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };
  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
    }
  };

  /* Code spans are pulled out first so a file name containing underscores does
     not get read as italics halfway through. */
  const inline = (s) => {
    const held = [];
    let t = esc(s).replace(/`([^`]+)`/g, (_, c) => {
      held.push(c);
      return `\u0000${held.length - 1}\u0000`;
    });
    t = t
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/(^|\s)_([^_]+)_(?=$|[\s.,)])/g, '$1<em>$2</em>')
      .replace(/\s\s$/, '<br>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${held[i]}</code>`);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^\|/.test(line)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (/^[-\s|:]+$/.test(line)) continue;
      if (!inTable) {
        closeList();
        closeQuote();
        out.push('<table><thead><tr>' + cells.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>');
        inTable = true;
      } else {
        out.push('<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
      }
      continue;
    }
    closeTable();

    if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) {
        out.push('<blockquote>');
        inQuote = true;
      }
      const t = line.replace(/^>\s?/, '');
      out.push(t ? `<p>${inline(t)}</p>` : '');
      continue;
    }
    closeQuote();

    if (/^- /.test(line)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    closeList();

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^---\s*$/.test(line)) {
      out.push('<hr>');
      continue;
    }
    if (line.trim() === '') continue;
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  closeQuote();
  closeTable();

  /* A hard line break at the end of a paragraph has nothing to break to. */
  const body = out.join('\n').replace(/<br><\/p>/g, '</p>');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  body { font: 16px/1.65 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color:#111;
         max-width: 46rem; margin: 3rem auto; padding: 0 1.5rem; }
  h1 { font-size: 2.1rem; margin: 0 0 .4rem; letter-spacing: -.02em; }
  h2 { font-size: 1.4rem; margin: 2.4rem 0 .6rem; padding-top: .4rem; }
  h3 { font-size: 1.08rem; margin: 1.5rem 0 .4rem; color:#333; }
  h4,h5,h6 { font-size: .98rem; margin: 1.1rem 0 .3rem; color:#555; }
  p { margin: .5rem 0; }
  ul { margin: .5rem 0 .9rem; padding-left: 1.2rem; }
  li { margin: .25rem 0; }
  code { background:#f2f2f2; padding: .1rem .3rem; border-radius: 3px; font-size: .88em; }
  hr { border:0; border-top:1px solid #e2e2e2; margin: 2rem 0; }
  blockquote { border-left:3px solid #d8d8d8; background:#fafafa; margin:1rem 0;
               padding:.6rem 1rem; color:#444; }
  table { border-collapse: collapse; width:100%; margin: .8rem 0 1.2rem; font-size:.93rem; }
  th, td { border:1px solid #ddd; padding:.45rem .6rem; text-align:left; vertical-align:top; }
  th { background:#f6f6f6; }
  strong { color:#000; }
</style></head><body>
${body}
</body></html>`;
}
