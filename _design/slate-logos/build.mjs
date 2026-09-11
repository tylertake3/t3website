// Embeds the real production logos (and the Take 3 mark) into the mockup as
// data URIs, so the artifact is one self-contained file with no network calls.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const here = dirname(new URL(import.meta.url).pathname)
const root = join(here, '../..')
const logoDir = join(root, 'public/assets/production-logos')
const out = join(root, '.agent-browser/artifacts/loading-slate-logos/App.tsx')

const KEYS = [
  'mobland',
  'harry-potter',
  'slow-horses',
  'werwulf',
  'supacell',
  'vision-quest',
  'deadpool-wolverine',
  'gangs-of-london',
]

const entries = []
for (const k of KEYS) {
  // the "-c" files are the on-dark variants, which is what the black plate wants
  const buf = await readFile(join(logoDir, `${k}-c.png`))
  entries.push(`  '${k}': 'data:image/png;base64,${buf.toString('base64')}',`)
}

const take3 = await readFile(join(root, 'public/assets/take3-logo.svg'))
const take3Uri = `data:image/svg+xml;base64,${take3.toString('base64')}`

const tpl = await readFile(join(here, 'template.tsx'), 'utf8')
const src = tpl
  .replace('/*LOGOS*/ {}', `{\n${entries.join('\n')}\n}`)
  .replace("/*TAKE3*/ ''", `'${take3Uri}'`)

await mkdir(dirname(out), { recursive: true })
await writeFile(out, src)
console.log('wrote', out, (src.length / 1024).toFixed(0) + 'kb')
