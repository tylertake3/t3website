import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const here = dirname(new URL(import.meta.url).pathname)
const root = join(here, '../..')
const out = join(root, '.agent-browser/artifacts/clapper-ideas/index.html')

const fonts = JSON.parse(await readFile(join(root, '_design/slate-three/fonts/fonts.json'), 'utf8'))
const face = (fam, wgt, b64) =>
  `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wgt};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`
const fontCss = [
  face('Anton', 400, fonts['Anton-400']),
  face('Jost', 500, fonts['Jost-500']),
  face('Jost', 600, fonts['Jost-600']),
  face('Caveat', 700, fonts['Caveat-700']),
  face('Chalk', 400, fonts['Permanent Marker-400']),
].join('\n')

const uri = async (p, mime) =>
  `data:${mime};base64,${(await readFile(join(root, p))).toString('base64')}`

/* Four real productions, with the light-ink title mark for the black band and
   the dark-ink studio mark for the white card — the same rule the site uses. */
const PRODUCTIONS = [
  { key: 'slow-horses', title: 'Slow Horses', studio: 'apple-tv', studioExt: 'svg',
    roll: 'C117', slate: '208 B', lens: '75mm', stop: '2', res: '4K', fps: '25',
    shutter: '172.8', ct: '5600', ei: '1600', unit: 'Second Unit', city: 'London', logoH: 72 },
  { key: 'gangs-of-london', title: 'Gangs of London', studio: 'sky', studioExt: 'png',
    roll: 'A052', slate: 'GOL 77', lens: '40mm', stop: '2.3', res: '4.5K', fps: '25',
    shutter: '180', ct: '3200', ei: '1000', unit: 'Main Unit', city: 'London', logoH: 69 },
  { key: 'supacell', title: 'Supacell', studio: 'netflix', studioExt: 'svg',
    roll: 'D009', slate: 'SC 41', lens: '50mm', stop: '2.8', res: '6K', fps: '25',
    shutter: '172.8', ct: '3800', ei: '1250', unit: 'Main Unit', city: 'London', logoH: 54 },
  { key: 'werwulf', title: 'Werwulf', studio: 'universal-pictures', studioExt: 'svg',
    roll: 'A003', slate: 'WW 61', lens: '21mm', stop: '1.9', res: '6K', fps: '24',
    shutter: '172.8', ct: '2900', ei: '2000', unit: 'Main Unit', city: 'Ireland', logoH: 81 },
]

const deck = []
for (const p of PRODUCTIONS) {
  deck.push({
    ...p,
    logo: await uri(`public/assets/production-logos/${p.key}-c.png`, 'image/png'),
    /* the light-ink cut too, for the chalk and digital slates where the band is pale */
    logoDark: await uri(`public/assets/production-logos/${p.key}.png`, 'image/png'),
    studioLogo: await uri(
      `public/assets/logos/${p.studio}.${p.studioExt}`,
      p.studioExt === 'svg' ? 'image/svg+xml' : 'image/png',
    ),
  })
}

const shell = await readFile(join(here, 'shell.html'), 'utf8')
const html = shell
  .replace('/*FONTS*/', fontCss)
  .replace('__DECK__', JSON.stringify(deck))

await mkdir(dirname(out), { recursive: true })
await writeFile(out, html)
console.log('wrote', out, Math.round(html.length / 1024) + 'KB')
