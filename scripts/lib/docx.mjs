/* A very small Word-file writer, so the worksheets can be handed over as real
   documents rather than web pages someone has to copy and paste out of.

   Why hand-rolled: a .docx is a zip of XML, and the only alternative on this
   machine (textutil) throws away tables and heading styles, which is most of
   what makes these worksheets readable. This writes real Heading 1/2/3 styles
   and real tables, so Google Docs shows a working document outline down the
   side and the tables stay tables.

   Takes a list of blocks:
     { h: 1|2|3, text }        heading
     { p: text }               paragraph
     { p: text, box: true }    paragraph in a shaded box (a "write here" space)
     { p: text, quiet: true }  smaller grey paragraph (guidance)
     { bullet: text }          bulleted line
     { number: text }          numbered line
     { rule: true }            horizontal rule
     { table: [[cell, ...], ...], head: true }
     { blank: n }              n empty writing lines
   Inline **bold** is honoured inside text; nothing else is. */

import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Splits a line on **bold** and returns the Word runs for it. */
const runs = (text, { size, colour, italic } = {}) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  return parts
    .map((part) => {
      const bold = /^\*\*[\s\S]+\*\*$/.test(part);
      const body = bold ? part.slice(2, -2) : part;
      const props = [
        bold ? '<w:b/>' : '',
        italic ? '<w:i/>' : '',
        size ? `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>` : '',
        colour ? `<w:color w:val="${colour}"/>` : '',
      ].join('');
      return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(body)}</w:t></w:r>`;
    })
    .join('');
};

const para = (text, opts = {}) => {
  const { style, box, quiet, indent, spacingAfter } = opts;
  const props = [];
  if (style) props.push(`<w:pStyle w:val="${style}"/>`);
  if (box) {
    props.push('<w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="D9D9D9"/><w:left w:val="single" w:sz="6" w:space="4" w:color="D9D9D9"/><w:bottom w:val="single" w:sz="6" w:space="4" w:color="D9D9D9"/><w:right w:val="single" w:sz="6" w:space="4" w:color="D9D9D9"/></w:pBdr>');
    props.push('<w:shd w:val="clear" w:color="auto" w:fill="FAFAFA"/>');
  }
  if (indent) props.push(`<w:ind w:left="${indent}"/>`);
  if (spacingAfter !== undefined) props.push(`<w:spacing w:after="${spacingAfter}"/>`);
  const rpr = quiet ? { size: 19, colour: '5A5A5A' } : {};
  return `<w:p>${props.length ? `<w:pPr>${props.join('')}</w:pPr>` : ''}${runs(text, rpr)}</w:p>`;
};

const listPara = (text, numId) =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr>${runs(text)}</w:p>`;

const rule = () =>
  '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="DDDDDD"/></w:pBdr></w:pPr></w:p>';

const table = (rows, head) => {
  const width = Math.floor(9360 / (rows[0]?.length || 1));
  const body = rows
    .map((cells, r) => {
      const isHead = head && r === 0;
      return `<w:tr>${cells
        .map(
          (c) =>
            `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${
              isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' : ''
            }</w:tcPr>${para(isHead ? `**${c}**` : c || ' ', { spacingAfter: 40 })}</w:tc>`,
        )
        .join('')}</w:tr>`;
    })
    .join('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/><w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/></w:tblBorders></w:tblPr>${body}</w:tbl><w:p/>`;
};

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr>
    <w:rFonts w:ascii="Helvetica" w:hAnsi="Helvetica" w:cs="Helvetica"/>
    <w:sz w:val="22"/><w:szCs w:val="22"/>
  </w:rPr></w:rPrDefault>
  <w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="200"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="0"/><w:spacing w:before="360" w:after="140"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="1"/><w:spacing w:before="300" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="27"/><w:szCs w:val="27"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:outlineLvl w:val="2"/><w:spacing w:before="240" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="23"/><w:szCs w:val="23"/><w:color w:val="333333"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="60"/><w:ind w:left="360"/></w:pPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>
</w:styles>`;

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

/** Writes the blocks to a .docx at `outPath`. */
export function writeDocx(outPath, title, blocks) {
  const body = blocks
    .map((b) => {
      if (b.rule) return rule();
      if (b.table) return table(b.table, b.head);
      if (b.bullet !== undefined) return listPara(b.bullet, 1);
      if (b.number !== undefined) return listPara(b.number, 2);
      if (b.blank) return Array.from({ length: b.blank }, () => para(' ', { box: true })).join('');
      if (b.h !== undefined) return para(b.text, { style: b.h === 0 ? 'Title' : `Heading${b.h}` });
      return para(b.p ?? '', { box: b.box, quiet: b.quiet });
    })
    .join('\n');

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${body}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>
</w:body></w:document>`;

  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(title)}</dc:title></cp:coreProperties>`;

  /* Assembled on disk and zipped, so nothing here needs a zip library. */
  const stage = mkdtempSync(join(tmpdir(), 'docx-'));
  try {
    mkdirSync(join(stage, '_rels'));
    mkdirSync(join(stage, 'word', '_rels'), { recursive: true });
    mkdirSync(join(stage, 'docProps'));
    writeFileSync(join(stage, '[Content_Types].xml'), CONTENT_TYPES);
    writeFileSync(join(stage, '_rels', '.rels'), RELS);
    writeFileSync(join(stage, 'word', 'document.xml'), document);
    writeFileSync(join(stage, 'word', 'styles.xml'), STYLES);
    writeFileSync(join(stage, 'word', 'numbering.xml'), NUMBERING);
    writeFileSync(join(stage, 'word', '_rels', 'document.xml.rels'), DOC_RELS);
    writeFileSync(join(stage, 'docProps', 'core.xml'), core);
    execFileSync('zip', ['-q', '-r', '-X', outPath, '[Content_Types].xml', '_rels', 'word', 'docProps'], {
      cwd: stage,
    });
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
