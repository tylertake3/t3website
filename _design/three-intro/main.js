import * as THREE from 'three'

/* ------------------------------------------------------------------
   Take 3 — first-visit intro, Three.js cut.

   A real slate in 3D: the arm swings on a hinge and lands, then the
   readout hands itself over one position at a time — each character is
   a physical tile that flips, split-flap style, from a digit to a
   letter, until the line reads TAKE 3.
------------------------------------------------------------------ */

const INK = '#f4f2ee'
const ACCENT = '#d4704f'
const LAMP = '#c9573a'

const START = ['0', '0', '2', '5', '0', '1', '2', '8']
const TARGET = ['T', 'A', 'K', 'E', ' ', '3', ' ', ' ']
const SEQUENCE = [7, 6, 4, 0, 1, 2, 3, 5]

const T = {
  in: 0,
  clap: 2700,
  flipStart: 3500,
  flipGap: 620,
  get flipEnd() {
    return this.flipStart + SEQUENCE.length * this.flipGap
  },
  get agency() {
    return this.flipEnd + 300
  },
  get recede() {
    return this.flipEnd + 2900
  },
  get done() {
    return this.flipEnd + 4500
  },
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------------- easing ---------------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeOut = (x) => 1 - Math.pow(1 - x, 3)
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -9 * x))

/* ---------------- character textures ---------------- */

const texCache = new Map()

function charTexture(char, { flipped = false, letter = false } = {}) {
  const key = `${char}|${flipped}|${letter}`
  if (texCache.has(key)) return texCache.get(key)

  const W = 256
  const H = 384
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')

  ctx.clearRect(0, 0, W, H)
  if (flipped) {
    ctx.translate(W, H)
    ctx.rotate(Math.PI)
  }

  if (char.trim() !== '') {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (letter) {
      ctx.font = `300 250px Inter, "Helvetica Neue", system-ui, sans-serif`
      ctx.fillStyle = INK
      ctx.shadowColor = 'rgba(244,242,238,0.25)'
      ctx.shadowBlur = 26
    } else {
      ctx.font = `200 240px Inter, "Helvetica Neue", system-ui, sans-serif`
      ctx.fillStyle = LAMP
      ctx.shadowColor = 'rgba(201,87,58,0.55)'
      ctx.shadowBlur = 34
    }
    ctx.fillText(char, W / 2, H / 2 + 8)
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  texCache.set(key, t)
  return t
}

function labelTexture(text, { size = 54, color = INK, tracking = 26, weight = 300 } = {}) {
  const W = 2048
  const H = 256
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  ctx.font = `${weight} ${size}px Inter, "Helvetica Neue", system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'

  const chars = [...text]
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let x = (W - total) / 2
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, H / 2)
    x += widths[i] + tracking
  })

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/* ---------------- scene ---------------- */

const canvas = document.getElementById('scene')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0

const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x101012, 11, 22)

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
camera.position.set(0, 0.1, 10.2)

/* lights */
scene.add(new THREE.HemisphereLight(0x30303a, 0x08080a, 0.5))

const key = new THREE.DirectionalLight(0xfff4ec, 2.4)
key.position.set(4.5, 5.5, 6.5)
scene.add(key)

const fill = new THREE.DirectionalLight(0x9fb0c8, 0.55)
fill.position.set(-6, -1.5, 4)
scene.add(fill)

const warm = new THREE.PointLight(new THREE.Color(ACCENT), 9, 18, 2)
warm.position.set(-3.6, -1.9, 2.6)
scene.add(warm)

const rim = new THREE.DirectionalLight(0xf4f2ee, 0.9)
rim.position.set(-2, 3, -5)
scene.add(rim)

/* materials */
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x17171b,
  roughness: 0.62,
  metalness: 0.18,
})
const plateMat = new THREE.MeshStandardMaterial({
  color: 0x090a0c,
  roughness: 0.42,
  metalness: 0.25,
})
const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xf4f2ee,
  roughness: 0.55,
  metalness: 0.05,
})
const darkMat = new THREE.MeshStandardMaterial({
  color: 0x0e0e10,
  roughness: 0.7,
  metalness: 0.1,
})
const edgeMat = new THREE.MeshStandardMaterial({
  color: 0x2a2a30,
  roughness: 0.5,
  metalness: 0.4,
})

/* the slate */
const slate = new THREE.Group()
const BASE_Y = -0.22 // the whole slate sits a little low so the open arm stays in frame
slate.position.y = BASE_Y
scene.add(slate)

const BW = 6.6 // board width
const BH = 3.15 // board height

const board = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.16), bodyMat)
slate.add(board)

const bezel = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.07, BH + 0.07, 0.1), edgeMat)
bezel.position.z = -0.04
slate.add(bezel)

/* readout plate */
const plate = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.5, 1.5, 0.04), plateMat)
plate.position.set(0, -0.06, 0.09)
slate.add(plate)

/* hairlines above and below the plate */
function hairline(y, w = BW - 0.5, opacity = 0.16) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, 0.012),
    new THREE.MeshBasicMaterial({ color: 0xf4f2ee, transparent: true, opacity }),
  )
  m.position.set(0, y, 0.115)
  slate.add(m)
  return m
}
hairline(0.82)
hairline(-0.95)

/* the black-and-white teeth, drawn as a texture so nothing can overhang */
function stripeTexture(count, aspect) {
  const W = 2048
  const H = Math.round(W / aspect)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0e0e10'
  ctx.fillRect(0, 0, W, H)

  const tooth = W / count
  const lean = H * 0.55 // how far the top of each tooth leads the bottom
  ctx.fillStyle = '#f4f2ee'
  for (let i = 0; i < count; i++) {
    if (i % 2) continue
    const x = i * tooth
    ctx.beginPath()
    ctx.moveTo(x + lean, 0)
    ctx.lineTo(x + lean + tooth, 0)
    ctx.lineTo(x + tooth, H)
    ctx.lineTo(x, H)
    ctx.closePath()
    ctx.fill()
  }

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function stripeBar(width, height, count) {
  const g = new THREE.Group()
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.13), darkMat)
  g.add(base)
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.02, height - 0.02),
    new THREE.MeshStandardMaterial({
      map: stripeTexture(count, width / height),
      roughness: 0.58,
      metalness: 0.05,
    }),
  )
  face.position.z = 0.068
  g.add(face)
  return g
}

/* the arm — hinged at the left end */
const arm = new THREE.Group()
const armBar = stripeBar(BW, 0.4, 14)
armBar.position.x = BW / 2
arm.add(armBar)
const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.34, 20), edgeMat)
hinge.rotation.x = Math.PI / 2
arm.add(hinge)
arm.position.set(-BW / 2, BH / 2 + 0.26, 0.02)
arm.rotation.z = 0.22
slate.add(arm)

/* the board's own stripe row, just under the arm */
const boardStripes = stripeBar(BW - 0.5, 0.24, 14)
boardStripes.position.set(0, BH / 2 - 0.26, 0.09)
slate.add(boardStripes)

/* ---------------- the flip tiles ---------------- */

const TILE_W = 0.62
const TILE_H = 1.02
const GAP = 0.055

const tiles = []
const slotChars = [...START]

const activeSlots = () => slotChars.map((c, i) => ({ c, i })).filter((s) => s.c.trim() !== '')

function makeTile(char) {
  const group = new THREE.Group()
  const geo = new THREE.BoxGeometry(TILE_W, TILE_H, 0.05)
  const side = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.6 })
  const front = new THREE.MeshBasicMaterial({
    map: charTexture(char),
    transparent: true,
  })
  const back = new THREE.MeshBasicMaterial({
    map: charTexture(char, { flipped: true }),
    transparent: true,
  })
  const mesh = new THREE.Mesh(geo, [side, side, side, side, front, back])
  group.add(mesh)
  group.userData = { mesh, front, back, char }
  return group
}

const readout = new THREE.Group()
readout.position.set(0, -0.06, 0.16)
slate.add(readout)

slotChars.forEach((c) => {
  const t = makeTile(c)
  readout.add(t)
  tiles.push(t)
})

/* separator lamps between the timecode pairs */
const lamps = [1, 3, 5].map((i) => {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(0.032, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(LAMP), transparent: true }),
  )
  m.userData.after = i
  readout.add(m)
  return m
})

/* lay the row out, closing gaps where a slot has emptied */
function layout(t = 1) {
  const active = activeSlots()
  const widths = slotChars.map((c, i) =>
    c.trim() === '' ? (i === 4 ? TILE_W * 0.45 : 0) : TILE_W,
  )
  const total = widths.reduce((a, b) => a + b, 0) + GAP * Math.max(0, active.length - 1)
  let x = -total / 2
  slotChars.forEach((c, i) => {
    const w = widths[i]
    const target = x + w / 2
    const tile = tiles[i]
    tile.userData.targetX = target
    tile.userData.targetScale = c.trim() === '' ? 0.0001 : 1
    if (t >= 1) {
      tile.position.x = target
      tile.scale.setScalar(tile.userData.targetScale)
    }
    x += w + (w > 0 ? GAP : 0)
  })
  lamps.forEach((l) => {
    const a = tiles[l.userData.after]
    l.position.set(a.userData.targetX + TILE_W / 2 + GAP / 2, 0, 0.06)
  })
}
layout(1)

/* ---------------- chalk labels ---------------- */

function labelPlane(text, opts, w, h, x, y) {
  const mat = new THREE.MeshBasicMaterial({
    map: labelTexture(text, opts),
    transparent: true,
    opacity: 0,
  })
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  m.position.set(x, y, 0.12)
  slate.add(m)
  return m
}

const metaLeft = labelPlane(
  'SCENE 01',
  { size: 46, color: 'rgba(244,242,238,0.45)', tracking: 22 },
  2.6,
  0.32,
  -1.85,
  0.99,
)
const metaMid = labelPlane(
  'SHOT 18',
  { size: 46, color: 'rgba(244,242,238,0.45)', tracking: 22 },
  2.6,
  0.32,
  0,
  0.99,
)
const metaRight = labelPlane(
  'TAKE 03',
  { size: 46, color: 'rgba(244,242,238,0.45)', tracking: 22 },
  2.6,
  0.32,
  1.85,
  0.99,
)
const statusLabel = labelPlane(
  'ROLLING',
  { size: 42, color: 'rgba(244,242,238,0.4)', tracking: 26 },
  2.4,
  0.3,
  -2.0,
  -1.24,
)
const fpsLabel = labelPlane(
  'LONDON — 24 FPS',
  { size: 42, color: 'rgba(244,242,238,0.4)', tracking: 22 },
  3.0,
  0.3,
  1.75,
  -1.24,
)
const agencyLabel = labelPlane('AGENCY', { size: 58, color: ACCENT, tracking: 74 }, 4.4, 0.44, 0, -1.24)
agencyLabel.visible = false

/* the progress hairline */
const progressTrack = new THREE.Mesh(
  new THREE.PlaneGeometry(BW - 0.5, 0.014),
  new THREE.MeshBasicMaterial({ color: 0xf4f2ee, transparent: true, opacity: 0.12 }),
)
progressTrack.position.set(0, -BH / 2 - 0.22, 0)
slate.add(progressTrack)

const progressFill = new THREE.Mesh(
  new THREE.PlaneGeometry(BW - 0.5, 0.014),
  new THREE.MeshBasicMaterial({ color: 0xf4f2ee, transparent: true, opacity: 0.7 }),
)
progressFill.position.set(-(BW - 0.5) / 2, -BH / 2 - 0.22, 0.001)
progressFill.geometry.translate((BW - 0.5) / 2, 0, 0)
progressFill.scale.x = 0.001
slate.add(progressFill)

/* ---------------- the run ---------------- */

const state = {
  start: performance.now(),
  clapped: false,
  flipped: -1,
  flips: [], // { slot, at }
  frames: 24 * 60 * 25 + 24 + 8,
  finished: false,
}

const loaderEl = document.getElementById('loader')
const siteEl = document.getElementById('site')

function setSlot(i, char) {
  slotChars[i] = char
  const tile = tiles[i]
  tile.userData.next = char
}

function beginFlip(order) {
  const slot = SEQUENCE[order]
  const next = TARGET[slot]
  state.flips.push({ slot, next, at: performance.now() })
}

function updateTimecode(now) {
  if (state.clapped) return
  const f = state.frames + Math.floor(((now - state.start) / 1000) * 24)
  const str =
    '00' +
    String(Math.floor(f / (24 * 60)) % 60).padStart(2, '0') +
    String(Math.floor(f / 24) % 60).padStart(2, '0') +
    String(f % 24).padStart(2, '0')
  for (let i = 0; i < 8; i++) {
    const tile = tiles[i]
    if (tile.userData.char !== str[i]) {
      tile.userData.char = str[i]
      tile.userData.front.map = charTexture(str[i])
      tile.userData.back.map = charTexture(str[i], { flipped: true })
      slotChars[i] = str[i]
    }
  }
}

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // keep the whole slate in frame on a phone
  camera.fov = w / h < 1 ? 52 : 38
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

let raf = 0

function frame(now) {
  raf = requestAnimationFrame(frame)
  const t = reduced ? T.done : now - state.start

  /* exposure fade-in */
  renderer.toneMappingExposure = 1.08 * easeOut(clamp01(t / 1500))

  /* chalk labels fade up */
  const lab = easeOut(clamp01((t - 500) / 1400)) * 1
  ;[metaLeft, metaMid, metaRight, statusLabel, fpsLabel].forEach((m) => {
    m.material.opacity = lab
  })

  /* camera: a slow push in, with a whisper of drift */
  const push = easeInOut(clamp01(t / (T.recede || 1)))
  camera.position.z = 10.2 - 1.5 * push
  camera.position.x = Math.sin(t / 4200) * 0.16
  camera.position.y = 0.1 + Math.sin(t / 5200) * 0.05
  camera.lookAt(0, -0.05, 0)

  /* the arm */
  if (t < T.clap) {
    arm.rotation.z = 0.22 + 0.014 * Math.sin(t / 1100)
  } else {
    const k = easeOutExpo(clamp01((t - T.clap) / 420))
    arm.rotation.z = 0.22 * (1 - k)
    if (!state.clapped) {
      state.clapped = true
      statusLabel.material.map = labelTexture('MARKER', {
        size: 42,
        color: 'rgba(244,242,238,0.4)',
        tracking: 26,
      })
    }
  }

  /* the marker: a warm flare and a small settle, no strobe */
  if (state.clapped) {
    const s = clamp01((t - T.clap - 380) / 700)
    const flare = Math.pow(1 - s, 3)
    key.intensity = 2.4 + flare * 5.2
    warm.intensity = 9 + flare * 20
    slate.position.y = BASE_Y - flare * 0.05 * Math.cos(s * 22)
    slate.rotation.z = -flare * 0.006 * Math.cos(s * 18)
  }

  /* live readout until the marker */
  updateTimecode(now)

  /* schedule the flips */
  if (!reduced) {
    for (let i = 0; i < SEQUENCE.length; i++) {
      if (state.flipped < i && t >= T.flipStart + i * T.flipGap) {
        state.flipped = i
        beginFlip(i)
      }
    }
  } else if (state.flipped < SEQUENCE.length - 1) {
    SEQUENCE.forEach((slot, i) => {
      slotChars[slot] = TARGET[slot]
      const tile = tiles[slot]
      const isL = /[A-Z]/.test(TARGET[slot])
      tile.userData.front.map = charTexture(TARGET[slot], { letter: isL })
      tile.userData.char = TARGET[slot]
      state.flipped = i
    })
    layout(1)
  }

  /* run the flips */
  state.flips.forEach((f) => {
    const tile = tiles[f.slot]
    const p = clamp01((now - f.at) / 620)
    const e = easeInOut(p)
    tile.rotation.x = -Math.PI * e
    if (p > 0.5 && !f.swapped) {
      f.swapped = true
      const isL = /[A-Z0-9]/.test(f.next.trim()) && /[A-Z]/.test(f.next)
      tile.userData.back.map = charTexture(f.next, { flipped: true, letter: /[A-Z]/.test(f.next) })
      void isL
    }
    if (p >= 1 && !f.done) {
      f.done = true
      tile.rotation.x = 0
      tile.userData.char = f.next
      tile.userData.front.map = charTexture(f.next, { letter: /[A-Z]/.test(f.next) })
      tile.userData.back.map = charTexture(f.next, { flipped: true, letter: /[A-Z]/.test(f.next) })
      setSlot(f.slot, f.next)
      layout(0)
    }
  })

  /* the row eases towards its new spacing */
  slotChars.forEach((c, i) => {
    const tile = tiles[i]
    if (tile.userData.targetX === undefined) return
    tile.position.x += (tile.userData.targetX - tile.position.x) * 0.09
    const s = tile.userData.targetScale ?? 1
    const cur = tile.scale.x
    tile.scale.setScalar(cur + (s - cur) * 0.09)
  })
  layout(0)

  /* lamps retire once the word starts forming */
  const lampFade = 1 - clamp01((t - (T.flipStart - 300)) / 900)
  lamps.forEach((l) => {
    l.material.opacity = 0.85 * lampFade
  })

  /* progress */
  const prog = state.clapped
    ? Math.max(0.06, clamp01((state.flipped + 1) / SEQUENCE.length))
    : 0.03
  progressFill.scale.x += (prog - progressFill.scale.x) * 0.08

  /* the sign-off */
  if (t >= T.agency) {
    agencyLabel.visible = true
    const a = easeOut(clamp01((t - T.agency) / 1800))
    agencyLabel.material.opacity = a
    agencyLabel.scale.x = 0.86 + 0.14 * a
    statusLabel.material.opacity = lab * (1 - a)
    fpsLabel.material.opacity = lab * (1 - a)
    progressTrack.material.opacity = 0.12 * (1 - a)
    progressFill.material.opacity = 0.7 * (1 - a)
  }

  /* the slate withdraws and the page is there */
  if (t >= T.recede) {
    const r = easeInOut(clamp01((t - T.recede) / 1500))
    slate.position.z = -9 * r
    slate.position.y = BASE_Y + 1.4 * r
    slate.rotation.x = 0.22 * r
    renderer.toneMappingExposure = 1.08 * (1 - r)
    loaderEl.style.opacity = String(1 - easeOut(clamp01((t - T.recede - 500) / 900)))
    siteEl.classList.add('is-in')
  }

  if (t >= T.done && !state.finished) {
    state.finished = true
    loaderEl.style.display = 'none'
    document.getElementById('replay').classList.add('is-in')
    cancelAnimationFrame(raf)
    return
  }

  renderer.render(scene, camera)
}

raf = requestAnimationFrame(frame)

/* ---------------- controls ---------------- */

function finish() {
  state.finished = true
  loaderEl.style.display = 'none'
  siteEl.classList.add('is-in')
  document.getElementById('replay').classList.add('is-in')
  cancelAnimationFrame(raf)
}

function restart() {
  // put every tile back to a digit and start the clock again
  START.forEach((c, i) => {
    slotChars[i] = c
    const tile = tiles[i]
    tile.rotation.x = 0
    tile.userData.char = c
    tile.userData.front.map = charTexture(c)
    tile.userData.back.map = charTexture(c, { flipped: true })
  })
  layout(1)
  state.start = performance.now()
  state.clapped = false
  state.flipped = -1
  state.flips = []
  state.finished = false
  slate.position.set(0, BASE_Y, 0)
  slate.rotation.set(0, 0, 0)
  agencyLabel.visible = false
  agencyLabel.material.opacity = 0
  progressTrack.material.opacity = 0.12
  progressFill.material.opacity = 0.7
  progressFill.scale.x = 0.001
  statusLabel.material.map = labelTexture('ROLLING', {
    size: 42,
    color: 'rgba(244,242,238,0.4)',
    tracking: 26,
  })
  loaderEl.style.display = ''
  loaderEl.style.opacity = '1'
  siteEl.classList.remove('is-in')
  document.getElementById('replay').classList.remove('is-in')
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(frame)
}

document.getElementById('skip').addEventListener('click', finish)
document.getElementById('replay').addEventListener('click', restart)
