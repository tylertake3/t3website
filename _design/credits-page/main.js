import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

/*
  Take 3 — credits page.

  The slate is built as a real slab in three.js: front face, back face and six
  edge panels, so when it turns you see its thickness. The arm is its own slab
  on a hinge. Scroll turns it; the back carries the casting record; keep
  scrolling and the page hands over to the poster wall.
*/

const LOGOS = __LOGOS__
const STUDIOS = __STUDIOS__
const TAKE3 = '__TAKE3__'
const POSTERS = __POSTERS__

/* what gets marked on the board for each production. the numbers are the
   camera's, not ours — they only need to be plausible and to change. */
const PRODUCTIONS = [
  { key: 'vision-quest', release: '2026', studio: 'marvel-studios', kind: 'Series', slate: 'VQ 27', roll: 'A001', lens: '45mm', stop: '2.8', res: '6K', crop: '100', shutter: '172.8', ct: '4500', ei: '1280', fps: '24', unit: 'Main Unit', city: 'Pinewood' },
  { key: 'mobland', release: '30 · 03 · 2025', studio: 'paramount-plus', kind: 'Series', slate: 'MOB 14', roll: 'B032', lens: '32mm', stop: '4', res: '4.6K', crop: '90', shutter: '180', ct: '3200', ei: '800', fps: '25', unit: 'Main Unit', city: 'London' },
  { key: 'slow-horses', release: '01 · 04 · 2022', studio: 'apple-tv', kind: 'Series', slate: '208 B', roll: 'C117', lens: '75mm', stop: '2', res: '4K', crop: '100', shutter: '172.8', ct: '5600', ei: '1600', fps: '25', unit: 'Second Unit', city: 'London' },
  { key: 'harry-potter', release: '2027', studio: 'hbo', kind: 'Series', slate: 'HP 6', roll: 'A214', lens: '28mm', stop: '5.6', res: '8K', crop: '100', shutter: '180', ct: '4300', ei: '640', fps: '24', unit: 'Main Unit', city: 'Leavesden' },
  { key: 'supacell', release: '27 · 06 · 2024', studio: 'netflix', kind: 'Series', slate: 'SC 41', roll: 'D009', lens: '50mm', stop: '2.8', res: '6K', crop: '95', shutter: '172.8', ct: '3800', ei: '1250', fps: '25', unit: 'Main Unit', city: 'London' },
  { key: 'gangs-of-london', release: '23 · 04 · 2020', studio: 'sky', kind: 'Series', slate: 'GOL 77', roll: 'A052', lens: '40mm', stop: '2.3', res: '4.5K', crop: '100', shutter: '180', ct: '3200', ei: '1000', fps: '25', unit: 'Main Unit', city: 'London' },
  { key: 'werwulf', release: '25 · 12 · 2026', studio: 'universal-pictures', kind: 'Feature', slate: 'WW 61', roll: 'A003', lens: '21mm', stop: '1.9', res: '6K', crop: '100', shutter: '172.8', ct: '2900', ei: '2000', fps: '24', unit: 'Main Unit', city: 'Ireland' },
  { key: 'deadpool-wolverine', release: '26 · 07 · 2024', studio: 'marvel-studios', kind: 'Feature', slate: '3101', roll: 'B076', lens: '35mm', stop: '4', res: '8K', crop: '100', shutter: '180', ct: '5000', ei: '800', fps: '24', unit: 'Second Unit', city: 'London' },
]

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* the back is the agency's record, so it carries our mark, not the film's */
document.getElementById('backLogo').src = TAKE3
document.getElementById('navLogo').src = TAKE3

const V = (id) => document.getElementById(id)
let prodIndex = Math.floor(Math.random() * PRODUCTIONS.length)

function writeProduction(p) {
  V('prodLogo').src = LOGOS[p.key]
  V('prodLogo').alt = p.key
  V('studioLogo').src = STUDIOS[p.studio]
  V('studioLogo').alt = p.studio
  V('date').textContent = p.release
  V('vRoll').innerHTML = `<span class="red">${p.roll[0]}</span>${p.roll.slice(1)}`
  V('vSlate').textContent = p.slate
  V('vLens').textContent = p.lens
  V('vStop').textContent = p.stop
  V('vRes').textContent = p.res
  V('vShutter').textContent = p.shutter
  V('vCt').textContent = p.ct
  V('vEi').textContent = p.ei
  V('vFps').textContent = p.fps
  V('vUnit').textContent = p.unit
  V('vCity').textContent = p.city
}
writeProduction(PRODUCTIONS[prodIndex])

/* the poster wall */
document.getElementById('posterGrid').innerHTML = POSTERS.map(
  (p) => `<img src="${p.src}" alt="${p.title}" loading="lazy" />`,
).join('')

/* teeth on the fixed rail — the arm's own are built with its faces */
document.querySelector('.railFace .teeth').innerHTML = Array.from({ length: 11 })
  .map(() => '<span></span>')
  .join('')

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
const GLYPHS = ['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg']

function buildDigits(host, n) {
  const els = []
  for (let i = 0; i < n; i++) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '-2 -2 64 108')
    svg.innerHTML = SEG_KEYS.map((k) => `<polygon data-s="${k}" points="${SEGS[k]}"/>`).join('')
    host.appendChild(svg)
    els.push(svg)
    if (i === 1 || i === 3 || i === 5) {
      const c = document.createElement('span')
      c.className = 'dot'
      c.innerHTML = '<i></i><i></i>'
      host.appendChild(c)
    }
  }
  return els
}

const digitEls = buildDigits(document.getElementById('tc'), 8)
const shownDigits = Array(8).fill(-1)

let held = false
function tick() {
  if (held) return
  const d = new Date()
  const f = Math.floor((d.getMilliseconds() / 1000) * 24)
  const s = [d.getHours(), d.getMinutes(), d.getSeconds(), f]
    .map((n) => String(n).padStart(2, '0'))
    .join('')

  for (let i = 0; i < 8; i++) {
    const n = +s[i]
    if (shownDigits[i] === n) continue
    shownDigits[i] = n
    const on = GLYPHS[n]
    for (const poly of digitEls[i].children) poly.classList.toggle('on', on.includes(poly.dataset.s))
  }
  /* the header carries the same clock, as it does everywhere else on the site */
  document.getElementById('navClock').textContent =
    `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}:${s.slice(6, 8)}`
}
tick()
let clockId = setInterval(tick, 1000 / 24)
document.addEventListener('visibilitychange', () => {
  clearInterval(clockId)
  if (!document.hidden) clockId = setInterval(tick, 1000 / 24)
})

/* ---------------- the scene ---------------- */

const stage = document.getElementById('stage')
const shadowEl = document.getElementById('groundShadow')
const cue = null
const heroCopy = document.getElementById('heroCopy')
const roll = document.getElementById('roll')
const backBody = document.getElementById('backBody')

const W = () => stage.clientWidth
const H = () => stage.clientHeight

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(34, W() / H(), 1, 8000)
camera.position.set(0, 0, 1420)

const renderer = new CSS3DRenderer()
renderer.setSize(W(), H())
document.getElementById('css3d').appendChild(renderer.domElement)

/* ---- measure the two faces, then build the slab around them ---- */

const frontEl = document.getElementById('front')
const backEl = document.getElementById('back')

const BOARD_W = 760
const DEPTH = 26 // the thickness you see when it turns
const ARM_H = 34
const ARM_D = 22
const GAP = 5 // between arm and board
const OPEN = 0.3 // ~17°, the stick's rest position

function edge({ w, h, dark = false, vert = false }) {
  const el = document.createElement('div')
  el.className = `edge${dark ? ' dark' : ''}${vert ? ' vert' : ''}`
  el.style.width = `${w}px`
  el.style.height = `${h}px`
  return new CSS3DObject(el)
}

/* a slab: front + back + four edges, centred on its own origin */
const FACES = []

function slab(frontObj, backObj, w, h, d, dark) {
  const g = new THREE.Group()

  frontObj.position.z = d / 2
  g.add(frontObj)

  backObj.position.z = -d / 2
  backObj.rotation.y = Math.PI
  g.add(backObj)

  const left = edge({ w: d, h, dark, vert: true })
  left.position.x = -w / 2
  left.rotation.y = -Math.PI / 2
  g.add(left)

  const right = edge({ w: d, h, dark, vert: true })
  right.position.x = w / 2
  right.rotation.y = Math.PI / 2
  g.add(right)

  const top = edge({ w, h: d, dark })
  top.position.y = h / 2
  top.rotation.x = Math.PI / 2
  g.add(top)

  const bottom = edge({ w, h: d, dark })
  bottom.position.y = -h / 2
  bottom.rotation.x = -Math.PI / 2
  g.add(bottom)

  FACES.push(frontObj, backObj, left, right, top, bottom)
  return g
}

/* the board slab — height comes from the real markup, once the fonts are in */
let boardH = Math.round(frontEl.getBoundingClientRect().height) || 470

const frontObj = new CSS3DObject(frontEl)
const backObj = new CSS3DObject(backEl)
const boardSlab = slab(frontObj, backObj, BOARD_W, boardH, DEPTH, false)
const boardEdges = boardSlab.children.slice(2) // left, right, top, bottom

/* the arm slab, on its own hinge at the left end */
function armFace() {
  const el = document.createElement('div')
  el.className = 'armFace'
  el.innerHTML =
    '<div class="armTeeth">' +
    Array.from({ length: 11 }).map(() => '<span></span>').join('') +
    '</div>'
  return new CSS3DObject(el)
}
const armSlab = slab(armFace(), armFace(), BOARD_W, ARM_H, ARM_D, true)

/* the hinge: a fixed leaf bolted to the board, a moving leaf that is part of
   the stick, and one pin they both turn about. the pin sits on the seam. */
const HINGE_Z = 3
const mk = (id) => new CSS3DObject(document.getElementById(id))

const leafFixedF = mk('leafFixedF')
const leafFixedB = mk('leafFixedB')
const leafMoveF = mk('leafMoveF')
const leafMoveB = mk('leafMoveB')
const pinF = mk('pinF')
const pinB = mk('pinB')
leafFixedB.rotation.y = Math.PI
leafMoveB.rotation.y = Math.PI
pinB.rotation.y = Math.PI
FACES.push(leafFixedF, leafFixedB, leafMoveF, leafMoveB, pinF, pinB)

const leafFixed = new THREE.Group()
leafFixed.add(leafFixedF, leafFixedB)
const leafMove = new THREE.Group()
leafMove.add(leafMoveF, leafMoveB)
const pin = new THREE.Group()
pin.add(pinF, pinB)

const armPivot = new THREE.Group()
const PIN_X = -BOARD_W / 2 + 12
/* the stick hangs off the pin: its bottom edge is the seam, so at zero
   rotation it lies flush on the rail for its whole length */
armSlab.position.set(BOARD_W / 2 - 12, ARM_H / 2, 0)
armPivot.add(armSlab)
armPivot.add(leafMove)
armPivot.position.set(PIN_X, boardH / 2, 0)

/* everything hangs off one group, which is what turns */
const slate = new THREE.Group()
slate.add(boardSlab)
slate.add(armPivot)
slate.add(leafFixed)
slate.add(pin)
/* centre the whole assembly (board + arm) on screen */
slate.position.y = -(ARM_H + BOARD_W * Math.sin(OPEN)) / 2
const rig = new THREE.Group()
rig.add(slate)
scene.add(rig)

/* the marked-up board decides its own height; everything else follows it.
   this has to run again once the fonts land, or the slab is built to the
   fallback metrics and the arm sits over the board. */
function remeasure() {
  boardH = Math.round(frontEl.getBoundingClientRect().height) || boardH
  backEl.style.height = `${boardH}px`
  backBody.style.height = `${boardH - 62}px`

  const [left, right, top, bottom] = boardEdges
  left.element.style.height = `${boardH}px`
  right.element.style.height = `${boardH}px`
  left.position.x = -BOARD_W / 2
  right.position.x = BOARD_W / 2
  top.position.y = boardH / 2
  bottom.position.y = -boardH / 2

  armPivot.position.y = boardH / 2 + ARM_H / 2 - 3 // resting on the rail, hinge to hinge

  /* the pin sits on the seam; the fixed leaf hangs below it on the board,
     the moving leaf sits above it on the stick */
  armPivot.position.set(PIN_X, boardH / 2, 0)

  leafFixed.position.set(PIN_X, boardH / 2 - 15, 0)
  leafFixedF.position.z = DEPTH / 2 + HINGE_Z
  leafFixedB.position.z = -(DEPTH / 2 + HINGE_Z)

  leafMove.position.set(0, 13, 0)
  leafMoveF.position.z = ARM_D / 2 + HINGE_Z + 1
  leafMoveB.position.z = -(ARM_D / 2 + HINGE_Z + 1)

  pin.position.set(PIN_X, boardH / 2, 0)
  pinF.position.z = DEPTH / 2 + HINGE_Z + 3
  pinB.position.z = -(DEPTH / 2 + HINGE_Z + 3)
  slate.position.y = -(ARM_H + BOARD_W * Math.sin(OPEN)) / 2
}

function fit() {
  renderer.setSize(W(), H())
  camera.aspect = W() / H()
  camera.fov = W() / H() < 1 ? 54 : 34
  camera.updateProjectionMatrix()
  /* scale the slate so it always sits comfortably in frame */
  /* the raised tip needs headroom, and that space is reserved in both states
     so opening and closing never moves the layout */
  const tip = BOARD_W * Math.sin(OPEN)
  const totalH = boardH + ARM_H + tip
  const target = Math.min(W() * 0.62, 880)
  const s = Math.min(1.1, target / BOARD_W, (H() * 0.84) / totalH)
  rig.scale.setScalar(s)

  /* and sit it right of centre, so the copy has the left of the frame —
     the same balance as the Dancers page */
  const visibleW = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect
  const offset = W() / H() < 1 ? 0 : visibleW * 0.13
  rig.position.x = offset
  rig.position.y = -H() * 0.02
  shadowEl.style.transform = `translate(-50%, 210px) translateX(${(offset / visibleW) * W()}px) scale(${s})`
}
window.addEventListener('resize', () => {
  remeasure()
  fit()
})
remeasure()
fit()
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    remeasure()
    fit()
  })
}

/* pointer parallax */
const pointer = { x: 0, y: 0 }
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1
})

/* ---------------- the clap ---------------- */

const flashEl = document.createElement('div')
flashEl.id = 'clapFlash'
stage.appendChild(flashEl)

const clap = { at: -10, active: false }

stage.addEventListener('click', () => {
  /* only while the board is facing us — clapping a turned slate makes no sense */
  if (state.p > 0.12 || performance.now() - clap.at < 700) return
  clap.at = performance.now()
  clap.active = true
  /* the sticks meet: the readout holds the frame it was clapped on */
  window.setTimeout(() => { held = true }, 150)
  /* and picks the live time back up as the stick lifts */
  window.setTimeout(() => { held = false }, 640)
  flashEl.classList.remove('is-on')
  void flashEl.offsetWidth
  flashEl.classList.add('is-on')
  /* the new production is marked on at the moment of impact */
  setTimeout(() => {
    prodIndex = (prodIndex + 1) % PRODUCTIONS.length
    writeProduction(PRODUCTIONS[prodIndex])
  }, 150)
})

/* the header flips to dark ink once the poster wall is under it */
const navEl = document.querySelector('.nav')
const postersEl = document.getElementById('posters')
function navTone() {
  navEl.classList.toggle('onLight', postersEl.getBoundingClientRect().top < 74)
}
window.addEventListener('scroll', navTone, { passive: true })
navTone()

/* ---------------- scroll ---------------- */

const hero = document.getElementById('hero')
const state = { p: 0, t0: performance.now() }

function heroProgress() {
  const r = hero.getBoundingClientRect()
  const total = hero.offsetHeight - window.innerHeight
  return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
}

const _n = new THREE.Vector3()
const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _v = new THREE.Vector3()

function cullFaces() {
  for (const f of FACES) {
    f.getWorldPosition(_p)
    f.getWorldQuaternion(_q)
    _n.set(0, 0, 1).applyQuaternion(_q)
    _v.copy(camera.position).sub(_p).normalize()
    const facing = _n.dot(_v) > 0.02
    f.visible = facing
    /* the renderer has no depth buffer, so hide the element outright */
    f.element.style.display = facing ? '' : 'none'
  }
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

const TURN_START = 0.06
const TURN_END = 0.42

function frame(now) {
  requestAnimationFrame(frame)

  const t = (now - state.t0) / 1000
  state.p += (heroProgress() - state.p) * 0.12
  const p = state.p

  const turn = clamp01((p - TURN_START) / (TURN_END - TURN_START))
  const rollP = clamp01((p - TURN_END - 0.04) / (0.95 - TURN_END))

  /* the arm: open at rest, shut by the clap, and shut for the turn */
  const k = (now - clap.at) / 1000
  const clapping = k >= 0 && k < 0.75
  let armAngle = OPEN * (1 - clamp01(p / TURN_START))
  if (clapping) {
    /* down hard, hold, then lift back open */
    armAngle = k < 0.34 ? 0 : OPEN * ((k - 0.34) / 0.41)
    armPivot.rotation.z += (armAngle - armPivot.rotation.z) * (k < 0.34 ? 0.55 : 0.16)
  } else {
    armPivot.rotation.z += (armAngle - armPivot.rotation.z) * 0.18
  }



  /* the turn: half a rotation, pushing away and back through the middle */
  const swing = easeInOut(turn)
  slate.rotation.y = swing * Math.PI
  slate.position.z = -280 * Math.sin(turn * Math.PI)
  slate.rotation.x = -0.045 + 0.05 * Math.sin(turn * Math.PI)

  /* idle float and cursor lean, only while it faces us */
  const idle = 1 - turn
  /* the board itself never moves for the clap — only the stick does */
  const base = -(ARM_H + BOARD_W * Math.sin(OPEN)) / 2
  slate.position.y = base + (reduced || clapping ? 0 : Math.sin(t * 0.7) * 6 * idle)
  slate.rotation.z = 0
  if (!reduced && idle > 0.02 && !clapping) {
    slate.rotation.y += pointer.x * 0.05 * idle
    slate.rotation.x += -pointer.y * 0.03 * idle
  }

  /* the record rolls up once the back is facing us */
  const over = Math.max(0, roll.scrollHeight - backBody.clientHeight)
  roll.style.transform = `translate3d(0, ${-over * easeInOut(rollP)}px, 0)`

  shadowEl.style.opacity = String(0.55 * (1 - turn * 0.75))

  /* copy and cue step aside as the turn begins */
  const fade = 1 - clamp01((p - 0.02) / 0.14)
  heroCopy.style.opacity = String(fade)
  if (cue) cue.style.opacity = String(fade)

  slate.updateMatrixWorld(true)
  cullFaces()
  renderer.render(scene, camera)
}
requestAnimationFrame(frame)
