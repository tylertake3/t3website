import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

/*
  Take 3 — first-visit slate, Three.js cut.

  The slate is a real DOM element (so the type stays perfectly crisp) lifted
  into a three.js CSS3D scene: it hangs in space with a gentle float, leans
  toward the cursor, and on the clap it kicks, then falls away downstage
  while the site fades up behind it.
*/

const LOGO = '__LOGO__'

const stage = document.getElementById('stage')
const cue = document.getElementById('cue')
const roll = document.getElementById('creditRoll')
const backBody = document.querySelector('.backBody')
const slateEl = document.getElementById('slate')
const flash = document.getElementById('flash')
const site = document.getElementById('site')
const replayBtn = document.getElementById('replay')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.getElementById('prodLogo').src = LOGO
document.getElementById('backLogo').src = LOGO

/* teeth for the arm */
document.querySelector('.armTeeth').innerHTML = Array.from({ length: 13 })
  .map(() => '<span></span>')
  .join('')

/* today's date, written on the board */
{
  const d = new Date()
  document.getElementById('date').textContent = [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()),
  ].join(' · ')
}

/* ---------------- seven-segment timecode ---------------- */

const SEGS = {
  a: '8,5.5 13.5,0 46.5,0 52,5.5 46.5,11 13.5,11',
  b: '49,13.5 54.5,8 60,13.5 60,41 54.5,46.5 49,41',
  c: '49,63 54.5,57.5 60,63 60,90.5 54.5,96 49,90.5',
  d: '8,98.5 13.5,93 46.5,93 52,98.5 46.5,104 13.5,104',
  e: '0,63 5.5,57.5 11,63 11,90.5 5.5,96 0,90.5',
  f: '0,13.5 5.5,8 11,13.5 11,41 5.5,46.5 0,41',
  g: '8,52 13.5,46.5 46.5,46.5 52,52 46.5,57.5 13.5,57.5',
}
const SEG_KEYS = Object.keys(SEGS)
const GLYPHS = [
  'abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg',
]

const tcEl = document.getElementById('tc')
const digitEls = []
for (let i = 0; i < 8; i++) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '-2 -2 64 108')
  svg.innerHTML = SEG_KEYS.map((k) => `<polygon data-s="${k}" points="${SEGS[k]}"/>`).join('')
  tcEl.appendChild(svg)
  digitEls.push(svg)
  if (i === 1 || i === 3 || i === 5) {
    const c = document.createElement('span')
    c.className = 'dot'
    c.innerHTML = '<i></i><i></i>'
    tcEl.appendChild(c)
  }
}

const shown = Array(8).fill(-1)
function paintDigit(pos, n) {
  if (shown[pos] === n) return
  shown[pos] = n
  const on = GLYPHS[n]
  for (const poly of digitEls[pos].children)
    poly.classList.toggle('on', on.includes(poly.dataset.s))
}

let locked = false
function tickClock() {
  if (locked) return
  const d = new Date()
  const f = Math.floor((d.getMilliseconds() / 1000) * 24)
  const s = [d.getHours(), d.getMinutes(), d.getSeconds(), f]
    .map((n) => String(n).padStart(2, '0'))
    .join('')
  for (let i = 0; i < 8; i++) paintDigit(i, +s[i])
}
tickClock()
const clockId = setInterval(tickClock, 1000 / 24)

/* ---------------- the scene ---------------- */

const W = () => window.innerWidth
const H = () => window.innerHeight

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(34, W() / H(), 1, 6000)
camera.position.set(0, 0, 1240)

const renderer = new CSS3DRenderer()
renderer.setSize(W(), H())
document.getElementById('css3d').appendChild(renderer.domElement)

const slate3d = new CSS3DObject(slateEl)
scene.add(slate3d)

window.addEventListener('resize', () => {
  camera.aspect = W() / H()
  /* keep the whole slate in frame on narrow screens */
  camera.fov = W() / H() < 1 ? 52 : 34
  camera.updateProjectionMatrix()
  renderer.setSize(W(), H())
})
window.dispatchEvent(new Event('resize'))

/* pointer parallax — the slate leans toward the cursor */
const pointer = { x: 0, y: 0 }
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / W()) * 2 - 1
  pointer.y = (e.clientY / H()) * 2 - 1
})

/* ---------------- scroll drives the turn ---------------- */

const state = { t0: performance.now(), p: 0, eased: 0 }

replayBtn.style.display = 'none'
site.remove()

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

/* ---------------- easing ---------------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeIn = (x) => x * x * x
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/* ---------------- the loop ---------------- */

const BASE_RX = -0.045 // a whisper of downward tilt, like it's held up to camera
const BASE_RZ = -0.008

const TURN_END = 0.42 // the slate has fully turned by here

function frame(now) {
  requestAnimationFrame(frame)

  const t = (now - state.t0) / 1000
  /* the scroll position, smoothed so the turn never feels notchy */
  state.p += (scrollProgress() - state.p) * 0.12

  const p = state.p
  const turn = clamp01(p / TURN_END)
  const rollP = clamp01((p - TURN_END) / (1 - TURN_END))

  /* the arm closes as the turn begins — you can't flip an open slate */
  stage.classList.toggle('is-clapped', turn > 0.06)
  if (turn > 0.06) locked = true

  /* the turn itself: half a rotation, pushing away and back as it goes */
  const swing = easeInOut(turn)
  slate3d.rotation.y = swing * Math.PI
  slate3d.position.z = -260 * Math.sin(turn * Math.PI)
  slate3d.rotation.x = BASE_RX + 0.06 * Math.sin(turn * Math.PI)

  /* the idle float and cursor lean only while it faces us */
  const idle = 1 - turn
  const floatY = reduced ? 0 : Math.sin(t * 0.7) * 7 * idle
  slate3d.position.y = floatY
  slate3d.rotation.z = BASE_RZ + (reduced ? 0 : Math.sin(t * 0.55 + 1.2) * 0.006 * idle)
  if (idle > 0.02 && !reduced) {
    slate3d.rotation.y += pointer.x * 0.085 * idle
    slate3d.rotation.x += -pointer.y * 0.05 * idle
  }

  /* once turned, the credits roll up behind the window */
  if (roll && backBody) {
    const over = Math.max(0, roll.scrollHeight - backBody.clientHeight)
    roll.style.transform = `translate3d(0, ${-over * easeInOut(rollP)}px, 0)`
  }

  cue.style.opacity = String(1 - clamp01(p / 0.08))

  renderer.render(scene, camera)
}
requestAnimationFrame(frame)

/* stop the 24fps clock when the tab is hidden */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(clockId)
})
