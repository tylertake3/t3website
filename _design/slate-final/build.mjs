import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
const here = dirname(new URL(import.meta.url).pathname)
const root = join(here, '../..')
const out = join(root, '.agent-browser/artifacts/loading-slate-final/App.tsx')
const key = process.argv[2] ?? 'mobland'
const buf = await readFile(join(root, `public/assets/production-logos/${key}${process.argv[3] === 'colour' ? '' : '-c'}.png`))
const tpl = await readFile(join(here, 'template.tsx'), 'utf8')
const src = tpl.replace("/*LOGO*/ ''", `'data:image/png;base64,${buf.toString('base64')}'`)
await mkdir(dirname(out), { recursive: true })
await writeFile(out, src)
console.log('wrote', out, (src.length / 1024).toFixed(0) + 'kb')
