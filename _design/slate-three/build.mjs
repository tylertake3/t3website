// One self-contained HTML: three.js bundled, brand fonts and the production
// logo embedded as data URIs. No network at runtime.
import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const here = dirname(new URL(import.meta.url).pathname)
const root = join(here, '../..')
const out = join(root, '.agent-browser/artifacts/loading-slate-three/App.html')
const key = process.argv[2] ?? 'mobland'

const fonts = JSON.parse(await readFile(join(here, 'fonts/fonts.json'), 'utf8'))
const face = (fam, wgt, b64) => `@font-face {
  font-family: '${fam}';
  font-style: normal;
  font-weight: ${wgt};
  font-display: block;
  src: url(data:font/woff2;base64,${b64}) format('woff2');
}`
const fontCss = [
  face('Anton', 400, fonts['Anton-400']),
  face('Jost', 500, fonts['Jost-500']),
  face('Jost', 600, fonts['Jost-600']),
  face('Jost', 700, fonts['Jost-700']),
  face('Caveat', 700, fonts['Caveat-700']),
].join('\n')

const logo = await readFile(join(root, `public/assets/production-logos/${key}-c.png`))
const logoUri = `data:image/png;base64,${logo.toString('base64')}`

const result = await build({
  entryPoints: [join(here, 'main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
  write: false,
})
const js = result.outputFiles[0].text.replace("__LOGO__", logoUri)

const shell = await readFile(join(here, 'shell.html'), 'utf8')
const html = shell.replace('/*FONTS*/', () => fontCss).replace('/*BUNDLE*/', () => js)

await mkdir(dirname(out), { recursive: true })
await writeFile(out, html)
console.log('wrote', out, (html.length / 1024).toFixed(0) + 'kb')
