// Bundles main.js (with three inlined, so the mockup needs no network at all)
// and drops it into shell.html, producing one self-contained file.
import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const here = dirname(new URL(import.meta.url).pathname)
const out = join(here, '../../.agent-browser/artifacts/loading-three/App.html')

const result = await build({
  entryPoints: [join(here, 'main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
  write: false,
})

const js = result.outputFiles[0].text
const shell = await readFile(join(here, 'shell.html'), 'utf8')
const html = shell.replace('/*BUNDLE*/', () => js)

await mkdir(dirname(out), { recursive: true })
await writeFile(out, html)
console.log('wrote', out, (html.length / 1024).toFixed(0) + 'kb')
