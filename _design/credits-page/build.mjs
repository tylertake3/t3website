import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const here = dirname(new URL(import.meta.url).pathname)
const root = join(here, '../..')
const out = join(root, '.agent-browser/artifacts/credits-page/App.html')
const key = process.argv[2] ?? 'vision-quest'

const fonts = JSON.parse(await readFile(join(here, 'fonts/fonts.json'), 'utf8'))
const face = (fam, wgt, b64) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wgt};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`
const fontCss = [
  face('Anton', 400, fonts['Anton-400']),
  face('Jost', 500, fonts['Jost-500']),
  face('Jost', 600, fonts['Jost-600']),
  face('Jost', 700, fonts['Jost-700']),
  face('Caveat', 700, fonts['Caveat-700']),
].join('\n')

const b64 = async (p, mime) => `data:${mime};base64,${(await readFile(p)).toString('base64')}`

const KEYS = [
  'vision-quest', 'mobland', 'slow-horses', 'harry-potter',
  'supacell', 'gangs-of-london', 'werwulf', 'deadpool-wolverine',
]
const logos = {}
for (const k of KEYS) {
  logos[k] = await b64(join(root, `public/assets/production-logos/${k}-c.png`), 'image/png')
}
const take3Uri = await b64(join(root, 'public/assets/take3-logo.svg'), 'image/svg+xml')

const TITLES = [
  ['The Crown', 'the-crown'], ['Ted Lasso', 'ted-lasso'], ['Slow Horses', 'slow-horses'],
  ['Barbie', 'barbie'], ['Andor', 'andor'], ['Black Mirror', 'black-mirror'],
  ['Bridgerton', 'bridgerton'], ['The Gentlemen', 'the-gentlemen'], ['3 Body Problem', '3-body-problem'],
  ['Foundation', 'foundation'], ['Invasion', 'invasion'], ['Vera', 'vera'],
  ['One Day', 'one-day'], ['Enola Holmes', 'enola-holmes'], ['Geek Girl', 'geek-girl'],
  ['Polite Society', 'polite-society'], ['Rain Dogs', 'rain-dogs'], ['Blue Lights', 'blue-lights'],
]
const posters = []
for (const [title, slug] of TITLES) {
  posters.push({ title, src: await b64(join(root, `public/posters/${slug}.webp`), 'image/webp') })
}

const STUDIO_KEYS = ['marvel-studios', 'paramount-plus', 'apple-tv', 'hbo', 'netflix', 'sky', 'universal-pictures', 'warner-bros-pictures']
const studios = {}
for (const k of STUDIO_KEYS) {
  const svg = join(root, `public/assets/logos/${k}.svg`)
  const png = join(root, `public/assets/logos/${k}.png`)
  try {
    studios[k] = await b64(svg, 'image/svg+xml')
  } catch {
    studios[k] = await b64(png, 'image/png')
  }
}

const result = await build({
  entryPoints: [join(here, 'main.js')],
  bundle: true, format: 'iife', target: 'es2020', minify: true, legalComments: 'none', write: false,
})
const js = result.outputFiles[0].text
  .replace('__LOGOS__', JSON.stringify(logos))
  .replace('__STUDIOS__', JSON.stringify(studios))
  .replace('"__TAKE3__"', JSON.stringify(take3Uri))
  .replace('__POSTERS__', JSON.stringify(posters))

const shell = await readFile(join(here, 'shell.html'), 'utf8')
const html = shell.replace('/*FONTS*/', () => fontCss).replace('/*BUNDLE*/', () => js)

await mkdir(dirname(out), { recursive: true })
await writeFile(out, html)
console.log('wrote', out, (html.length / 1024 / 1024).toFixed(2) + 'MB')
