/* The credits slate as a photographed object: a WebGL studio in three.js.

   The board is real geometry — a bevelled aluminium chassis with an acrylic
   insert, two solid painted sticks, hinge leaves on a pin, a recessed LED behind
   glass — standing on a charcoal floor that curves up into a cyclorama under a
   broad soft key. Everything printed on it is painted in 2D by clapperArt.js
   and wrapped on as a texture; everything lit is lit here.

   Two gestures drive it, and they never write the same transform:

     click   claps it: the upper stick swings down onto the lower one, holds for
             a beat, and lifts on its own. At contact — and only then — the
             production on the board changes and the clap is heard.
     scroll  lifts the whole assembly clear of the floor, then turns it over to
             show the record on its back. Scrolling back reverses it.

   The hinge belongs to clapperMotion's state machine; the lift and turn to its
   scroll pose. The scene reads both and owns nothing about either. */
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {
  CLAPPER_OPEN_ANGLE,
  createClapperMotion,
  clapClapperMotion,
  stepClapperMotion,
  clapperScrollPose,
  createClapperClock,
  readClapperClock,
  holdClapperClock,
  releaseClapperClock,
} from './clapperMotion.js';
import {
  FACE,
  LED,
  STRIPE,
  makeCanvas,
  paintNoise,
  paintBrushed,
  paintStripes,
  paintFace,
  paintRear,
  paintLED,
  loadArt,
  whenFontsReady,
} from './clapperArt.js';
import { countdownText } from './countdown.js';

/* --------------------------------------------------------------- the room */

/* Where the camera stands and how the frame is composed, per layout.

     eyeY      the camera's height. Just above the top of the lower stick, so
               the sticks' top faces are seen as thin lit strips — the
               reference is shot from there.
     floorFrac where the board's contact line lands, as a share of the stage.
     eyeFrac   where eye level lands. The camera never tilts: the frame is
               shifted instead, so verticals stay vertical and the board does
               not keystone. Product photographers shift the lens; so does this.
     yaw       the board's resting turn. The right side comes towards the lens.
     dist      lens to board. With the yaw, this sets how much the near edge is
               magnified over the far one — 1.17:1 in the reference.
     centre    where the board's centre sits across the frame. */
const VIEW = {
  wide: { eyeY: 6.3, eyeFrac: 0.3, floorFrac: 0.88, yaw: -0.16, dist: 17, centre: 0.65 },
  narrow: { eyeY: 6.3, eyeFrac: 0.16, floorFrac: 0.62, yaw: -0.1, dist: 19, centre: 0.5 },
};
/** The board hovers: how far its lower edge floats above the floor at rest, in world units. */
const HOVER = 0.9;
/** How much further the scroll raises it before the turn (the board is 4.83 tall). */
const LIFT_HEIGHT = 0.4;
/** A slight lean back from the vertical, so the top faces of the sticks and frame read. */
const REST_PITCH = -0.03;
/* How far the pointer can turn the board: enough to feel the object, never enough to lose the type. */
const NUDGE_YAW = 0.16;
const NUDGE_PITCH = 0.09;
/* the model was tuned with its centre here; the lights are placed relative to it */
const MODEL_TUNED_X = 2.45;
const NAV_GUARD = 18;

/* Rendering cost, in three steps. The scene starts on the tier the device
   suggests and steps down if the first seconds run slow; nothing about the
   design changes, only how expensively it is drawn. */
const TIERS = {
  high: { pixelRatio: 2, shadow: 2048, floorTaps: 32, reflection: 512, density: 2 },
  medium: { pixelRatio: 1.5, shadow: 1536, floorTaps: 16, reflection: 384, density: 1.5 },
  low: { pixelRatio: 1.25, shadow: 1024, floorTaps: 8, reflection: 0, density: 1 },
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function suggestTier(width) {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (width <= 640 && (cores <= 4 || memory <= 4)) return 'low';
  if (width <= 900 || coarse || cores <= 4 || memory <= 4) return 'medium';
  return 'high';
}

/**
 * Mount the studio into `host` (an empty element inside the stage).
 * Returns the controls, or null when WebGL is not available — the caller then
 * shows the plain reading of the page instead.
 */
export function mountClapperStudio(options) {
  const {
    stage, hero, host, deck, record, copy, status, onProduction,
    /* false: the page does not scroll the board; turn() flips it instead */
    scroll = true,
    /* { kind: 'time' } for the live clock, { kind: 'countdown', at } for a launch */
    clock: clockMode = { kind: 'time' },
    /* what this board prints differently — see paintFace() */
    face: faceOptions = {},
    /* count the take up on every clap (a single-card board) */
    takeCounter = false,
    /* 'calm': the small drift a held thing has. 'lively': a fuller hover — a slow
       turn, a breath in the lights, a drifting camera, dust in the beam — for a
       board that is the whole page and is not moved by scrolling */
    idle = 'calm',
  } = options;
  if (!host || !deck?.length) return null;
  const countdown = clockMode.kind === 'countdown';

  /* ------------------------------------------------------------ renderer */

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (error) {
    console.warn('[credits] WebGL is not available; showing the board as type', error);
    return null;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lively = idle === 'lively' && !reduced;
  let tierName = suggestTier(stage.clientWidth);
  let tier = TIERS[tierName];

  /* loop state, declared up here because requestRender() is reachable from
     everything below — including the first applyTheme() during mount */
  const view = { progress: 0 };
  let last = performance.now();
  let running = false;
  let visible = true;
  let wantRender = true;
  let readyShown = false;
  /* frame times over the first seconds decide whether the tier steps down */
  let probeFrames = 0;
  let probeTime = 0;
  let probed = false;
  /* the lights' resting levels; applyTheme() fills these during mount, the
     frame multiplies them by the flash */
  const lightBase = { key: 0, halo: 0, exposure: 1 };
  /* where a non-scrolling board is turned to: 0 front, 1 rear */
  /* the spin: where it is, how fast it is going, and where it should settle */
  const spinState = { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, target: 0 };
  const SPIN_PITCH_MAX = 0.7;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
  renderer.shadowMap.enabled = true;
  /* r185: PCFShadowMap with a Vogel-disk kernel. PCFSoftShadowMap no longer exists. */
  renderer.shadowMap.type = THREE.PCFShadowMap;
  /* the maps are drawn once per frame, not again for the reflection pass */
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0d0f');
  scene.fog = new THREE.FogExp2('#0d0d0f', 0.009);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 180);

  const anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  /* how densely the printed faces are painted: 2 = 4200px across the face */
  const density = Math.min(tier.density, Math.max(1, Math.ceil((window.devicePixelRatio || 1) * 1.25)));
  stage.dataset.clapDensity = String(density);

  /* The printed faces are sampled a little sharper than the GPU would choose
     on its own: a mild negative level-of-detail bias keeps the type crisp
     where trilinear filtering would soften it. */
  const sharpen = (mat, bias = -0.6) => {
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )', `texture2D( map, vMapUv, ${bias.toFixed(2)} )`),
      );
    };
    mat.customProgramCacheKey = () => `sharpen-${bias.toFixed(2)}`;
    return mat;
  };
  const disposables = [];
  const keep = (thing) => (disposables.push(thing), thing);
  const colourMap = (canvas) => {
    const texture = keep(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  };
  const dataMap = (canvas, repeat = 1) => {
    const texture = keep(new THREE.CanvasTexture(canvas));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = anisotropy;
    return texture;
  };

  /* ----------------------------------------------------------- materials */

  const micro = dataMap(paintNoise(512, 7), 3);
  /* the machining marks live in roughness; nothing paints fake light on the metal */
  const brushedMap = dataMap(paintBrushed(1024, 512, 19), 1);

  const material = (color, roughness = 0.45, metalness = 0, extra = {}) =>
    keep(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
  const frameMat = material('#3a3d44', 0.42, 0.9, { bumpMap: micro, bumpScale: 0.002, roughnessMap: brushedMap, envMapIntensity: 0.9 });
  const blackPaint = material('#141517', 0.38, 0.55, { bumpMap: micro, bumpScale: 0.0025, roughnessMap: brushedMap });
  const chrome = material('#c5c8d0', 0.22, 0.82, { envMapIntensity: 1.5 });
  const edgeMat = material('#3f424a', 0.34, 0.9, { envMapIntensity: 1.0 });

  /* ------------------------------------------------------------ geometry */

  const slate = new THREE.Group();
  const pivot = new THREE.Group();
  slate.add(pivot);

  const box = (w, h, d, r, mat, parent = slate) => {
    const mesh = new THREE.Mesh(keep(new RoundedBoxGeometry(w, h, d, 3, r)), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.size = [w, h, d];
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (radius, depth, mat, parent) => {
    const mesh = new THREE.Mesh(keep(new THREE.CylinderGeometry(radius, radius, depth, 32)), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const screw = (x, y, z, parent = slate, r = 0.047) => {
    const socket = cylinder(r * 1.28, 0.018, blackPaint, parent);
    socket.position.set(x, y, z);
    const washer = cylinder(r, 0.024, chrome, parent);
    washer.position.set(x, y, z + 0.018);
    const head = new THREE.Mesh(keep(new THREE.SphereGeometry(r * 0.76, 24, 12)), chrome);
    head.scale.z = 0.29;
    head.position.set(x, y, z + 0.035);
    head.castShadow = true;
    parent.add(head);
    const slit = box(r * 0.83, 0.008, 0.006, 0.002, blackPaint, parent);
    slit.position.set(x, y, z + 0.052);
    slit.rotation.z = 0.35;
  };

  /* the chassis: a continuous bevelled metal frame with the acrylic set into it */
  const body = box(7.05, 4.83, 0.435, 0.055, frameMat);
  body.position.set(0, 2.435, -0.09);
  const gasket = box(6.99, 4.77, 0.035, 0.037, blackPaint);
  gasket.position.set(0, 2.435, 0.143);

  const [faceCanvas, faceCtx] = makeCanvas(FACE.w * density, FACE.h * density);
  const faceMap = colourMap(faceCanvas);
  const faceMat = sharpen(keep(new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.72, metalness: 0, specularIntensity: 0.1,
    map: faceMap, bumpMap: micro, bumpScale: 0.0008,
  })));
  const front = box(6.93, 4.71, 0.025, 0.025, faceMat);
  front.position.set(0, 2.435, 0.17);

  /* the side walls, and the bolts through them */
  for (const x of [-3.516, 3.516]) {
    const side = box(0.035, 4.68, 0.404, 0.012, frameMat);
    side.position.set(x, 2.435, -0.09);
    for (const y of [0.23, 4.54]) {
      const bolt = cylinder(0.041, 0.022, chrome, slate);
      bolt.rotation.set(0, 0, Math.PI / 2);
      bolt.position.set(x, y, -0.09);
    }
  }
  for (const x of [-3.31, 3.31]) screw(x, 0.205, 0.198);
  for (const x of [-3.49, 3.49]) {
    const lip = box(0.032, 4.71, 0.036, 0.009, edgeMat);
    lip.position.set(x, 2.435, 0.187);
  }
  for (const y of [0.064, 4.8]) {
    const lip = box(6.97, 0.032, 0.036, 0.009, edgeMat);
    lip.position.set(0, y, 0.187);
  }

  /* the readout: a bezel, the LED panel, and a real sheet of glass over it */
  const bezel = box(4.64, 0.835, 0.065, 0.08, blackPaint);
  bezel.position.set(0.01, 4.23, 0.222);
  const [ledCanvas, ledCtx] = makeCanvas(LED.w * density, LED.h * density);
  const ledMap = colourMap(ledCanvas);
  const ledMat = sharpen(keep(new THREE.MeshBasicMaterial({ map: ledMap, toneMapped: false })), -0.4);
  const ledPanel = box(4.49, 0.697, 0.008, 0.034, ledMat);
  ledPanel.position.set(0.01, 4.23, 0.26);
  const glassMat = keep(new THREE.MeshPhysicalMaterial({
    color: '#17191e', metalness: 0, roughness: 0.045, transparent: true, opacity: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.7, specularIntensity: 0.5, depthWrite: false,
  }));
  const glass = box(4.53, 0.743, 0.018, 0.035, glassMat);
  glass.position.set(0.01, 4.23, 0.28);
  glass.castShadow = false;
  const tally = new THREE.Mesh(
    keep(new THREE.SphereGeometry(0.024, 16, 12)),
    keep(new THREE.MeshStandardMaterial({ color: '#37e577', emissive: '#16ef5e', emissiveIntensity: 2 })),
  );
  tally.position.set(2.125, 4.46, 0.3);
  slate.add(tally);

  /* the sticks: stripes painted on solid rounded rails, capped in metal */
  const [stripeCanvas, stripeCtx] = makeCanvas(STRIPE.w * density, STRIPE.h * density);
  paintStripes(stripeCtx);
  const stripeMap = colourMap(stripeCanvas);
  const stripeMat = keep(new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.62, metalness: 0.02, specularIntensity: 0.16, envMapIntensity: 0.35,
    clearcoat: 0.06, clearcoatRoughness: 0.35, map: stripeMap, roughnessMap: brushedMap, bumpMap: micro, bumpScale: 0.0015,
  }));
  const rail = (parent, x, y) => {
    const mesh = box(7.05, 0.43, 0.49, 0.038, stripeMat, parent);
    mesh.position.set(x, y, -0.09);
    for (const end of [-1, 1]) {
      const cap = box(0.054, 0.415, 0.495, 0.021, frameMat, parent);
      cap.position.set(x + end * 3.516, y, -0.09);
    }
    const bottom = box(6.98, 0.025, 0.48, 0.008, blackPaint, parent);
    bottom.position.set(x, y - 0.211, -0.09);
    return mesh;
  };
  const lowerStick = rail(slate, 0, 5.025);
  /* the upper stick hangs off its pin at the left end, its underside on the seam */
  pivot.position.set(-3.3, 5.241, 0);
  const upperStick = rail(pivot, 3.3, 0.218);

  /* the hinge: a leaf bolted to the board, a leaf riding on the stick, one pin */
  const plate = (points, z, parent) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    const geometry = keep(new THREE.ExtrudeGeometry(shape, {
      depth: 0.064, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.013, bevelThickness: 0.012,
    }));
    const mesh = new THREE.Mesh(geometry, blackPaint);
    mesh.position.z = z;
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const FIXED_LEAF = [[-3.53, 4.815], [-2.93, 4.815], [-2.77, 5.23], [-3.53, 5.23]];
  const MOVING_LEAF = [[-0.23, -0.03], [0.13, -0.035], [0.38, 0.29], [0.1, 0.5], [-0.23, 0.5]];
  plate(FIXED_LEAF, 0.185, slate);
  plate(MOVING_LEAF, 0.186, pivot);
  screw(-3.4, 4.94, 0.269, slate, 0.054);
  screw(-3.04, 4.94, 0.269, slate, 0.054);
  screw(-0.1, 0.34, 0.265, pivot, 0.055);
  const pin = cylinder(0.095, 0.12, chrome, slate);
  pin.position.set(-3.3, 5.241, 0.265);
  const pinHead = cylinder(0.063, 0.025, chrome, slate);
  pinHead.position.set(-3.3, 5.241, 0.335);

  /* the same hardware on the reverse, on the same pin */
  plate(FIXED_LEAF, -0.44, slate);
  plate(MOVING_LEAF, -0.44, pivot);
  const rearHardware = new THREE.Group();
  rearHardware.scale.z = -1;
  rearHardware.position.z = -0.18;
  slate.add(rearHardware);
  screw(-3.4, 4.94, 0.269, rearHardware, 0.054);
  screw(-3.04, 4.94, 0.269, rearHardware, 0.054);
  const movingRear = new THREE.Group();
  movingRear.scale.z = -1;
  movingRear.position.z = -0.18;
  pivot.add(movingRear);
  screw(-0.1, 0.34, 0.265, movingRear, 0.055);
  const rearPin = cylinder(0.095, 0.12, chrome, rearHardware);
  rearPin.position.set(-3.3, 5.241, 0.265);
  for (const x of [-3.31, 3.31]) screw(x, 0.205, 0.185, rearHardware);

  /* the back: the record, on its own plate */
  const [rearCanvas, rearCtx] = makeCanvas(FACE.w * density, FACE.h * density);
  const rearMap = colourMap(rearCanvas);
  const rearMat = sharpen(keep(new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.74, metalness: 0, specularIntensity: 0.1, envMapIntensity: 0.5, map: rearMap })));
  const rearMesh = box(6.93, 4.71, 0.024, 0.025, rearMat);
  rearMesh.position.set(0, 2.435, -0.331);
  rearMesh.rotation.y = Math.PI;

  /* One responsibility per group, so no two things ever write one transform:
       rig    where the object hangs in the room (resize only)
       lift   how high it floats (hover, scroll, and the idle drift)
       spin   the hand's turn of the board (drag, and the turn button)
       nudge  the small turn towards the pointer (mouse only)
       slate  which way it faces (scroll), and everything bolted to it
       pivot  the hinge, and nothing else (click) */
  const nudge = new THREE.Group();
  nudge.add(slate);
  /* spin: the hand's own turn of the board — dragged in any direction, kept in
     place, settling to whichever face is nearest when let go. The turn button
     drives the same group, so there is only ever one answer to "which way is it
     facing". Yaw is unbounded; pitch is held within a readable range. */
  const spin = new THREE.Group();
  spin.rotation.order = 'YXZ';
  spin.add(nudge);
  const lift = new THREE.Group();
  lift.add(spin);
  const rig = new THREE.Group();
  rig.add(lift);
  scene.add(rig);

  /* Dust in the beam: a few dozen soft points drifting up through the light
     around the board, each on its own slow path, re-seeded at the top. Lively
     boards only; tinted for the room in applyTheme(). */
  const DUST_COUNT = 150;
  const DUST_BOX = { x: 4.6, yLo: 0.2, yHi: 5.4, zLo: -2.4, zHi: 2.2 };
  let dust = null;
  let dustSeeds = null;
  if (lively) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext('2d');
    const glow = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = glow;
    sctx.fillRect(0, 0, 32, 32);
    const dustMap = keep(new THREE.CanvasTexture(sprite));
    const positions = new Float32Array(DUST_COUNT * 3);
    dustSeeds = new Float32Array(DUST_COUNT * 3); /* rise speed, sway phase, sway width */
    for (let i = 0; i < DUST_COUNT; i += 1) {
      positions[i * 3] = (Math.random() * 2 - 1) * DUST_BOX.x;
      positions[i * 3 + 1] = DUST_BOX.yLo + Math.random() * (DUST_BOX.yHi - DUST_BOX.yLo);
      positions[i * 3 + 2] = DUST_BOX.zLo + Math.random() * (DUST_BOX.zHi - DUST_BOX.zLo);
      dustSeeds[i * 3] = 0.05 + Math.random() * 0.11;
      dustSeeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      dustSeeds[i * 3 + 2] = 0.03 + Math.random() * 0.06;
    }
    const dustGeo = keep(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = keep(new THREE.PointsMaterial({
      size: 0.075, map: dustMap, transparent: true, depthWrite: false, sizeAttenuation: true,
    }));
    dust = new THREE.Points(dustGeo, dustMat);
    dust.frustumCulled = false;
    dust.renderOrder = 5;
    rig.add(dust);
  }

  /* ------------------------------------------------------- the environment */

  /* Reflections come from an environment of rectangular softboxes, captured once. */
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#55565a');
  const softbox = (x, y, z, w, h, power) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power), side: THREE.DoubleSide }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 2, 0);
    envScene.add(panel);
  };
  softbox(-6, 8, 7, 5, 7, 5);
  softbox(7, 5, 1, 2, 8, 3);
  softbox(0, 10, -3, 8, 3, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  /* r185 caps the blur kernel at 20 samples; 0.05 asked for 25 and warned */
  const environment = pmrem.fromScene(envScene, 0.035);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();
  envScene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });

  /* The lights that belong to the board travel with it across the frame; the
     room's own stay put. Lit like a still-life rather than a catalogue shot:
     one soft key from the front (the only shadow-caster), a backlight behind
     and above that rims the sticks and the chassis edge, a lamp behind the
     board pooling on the paper so it stands in front of light and falls to
     black at the edges, and just enough fill to keep the marker ink readable. */
  const boardLights = new THREE.Group();
  scene.add(boardLights);

  const ambient = new THREE.HemisphereLight('#aebbd1', '#2a2622', 0.22);
  scene.add(ambient);

  const key = new THREE.SpotLight('#fff1dc', 1320);
  key.position.set(-3.5, 12, 8.5);
  key.angle = 0.5;
  key.penumbra = 0.75;
  key.decay = 2;
  key.castShadow = true;
  key.shadow.mapSize.set(tier.shadow, tier.shadow);
  key.shadow.radius = 2;
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.04;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.target.position.set(2.2, 2.4, 0);
  boardLights.add(key, key.target);

  /* the backlight: cool, from behind and above on the right, so the top faces
     of the sticks and the near edge of the frame carry a rim of light */
  const rim = new THREE.SpotLight('#dbe4f4', 1000);
  rim.position.set(6.5, 9.5, -6.5);
  rim.angle = 0.46;
  rim.penumbra = 0.7;
  rim.decay = 2;
  rim.target.position.set(2.4, 4.6, 0);
  boardLights.add(rim, rim.target);

  /* the halo: a bare lamp hidden behind the board. A point source, not a spot,
     so the pool it throws on the paper has no cone edge — it simply falls away
     with the square of the distance, the way a lamp behind a subject does */
  const halo = new THREE.PointLight('#efe9de', 210, 0, 2);
  halo.position.set(3.0, 5.0, -2.6);
  boardLights.add(halo);

  /* soft fill from the right, a broad soft source front-left, and a low sweep
     across the floor grain — all quiet */
  const fill = new THREE.RectAreaLight('#e7edf7', 3.2, 1.6, 6);
  const broad = new THREE.RectAreaLight('#fff8ee', 2.8, 5, 5);
  const floorSweep = new THREE.RectAreaLight('#e6e1d8', 0.6, 9, 4);
  boardLights.add(fill, broad, floorSweep);
  /* aimed from world positions, so they are (re)aimed whenever the group moves */
  const aimLights = () => {
    const dx = boardLights.position.x;
    fill.position.set(8, 5, 1.5);
    fill.lookAt(dx + 2, 3, 0);
    broad.position.set(-3, 7, 7);
    broad.lookAt(dx + 2, 2.5, 0);
    floorSweep.position.set(-4, 3, 0);
    floorSweep.lookAt(dx + 2, 0, 1);
  };

  /* The room is one surface: the slate floor runs back to a curve and up into
     a paper backdrop, in a single mesh with a single material, so there is no
     junction for the light or the shadow to cut at. The grain is sharpest along
     the board's line and is sampled progressively blurrier as it recedes — the
     slate falling out of focus — before giving way to soft paper up the curve. */
  const floorHeight = keep(new THREE.Texture());
  const floorMap = keep(new THREE.TextureLoader().load('/assets/studio/floor-grain.webp', (texture) => {
    floorHeight.image = texture.image;
    floorHeight.needsUpdate = true;
    requestRender();
  }));
  for (const texture of [floorMap, floorHeight]) {
    texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.anisotropy = anisotropy;
  }
  floorMap.colorSpace = THREE.SRGBColorSpace;
  floorHeight.colorSpace = THREE.NoColorSpace;
  const floorMat = keep(new THREE.MeshPhysicalMaterial({
    color: '#a4a4aa', roughness: 0.78, metalness: 0.04, specularIntensity: 0.14,
    map: floorMap, bumpMap: floorHeight, bumpScale: 0.00035,
  }));

  const roomUniforms = {
    base: { value: new THREE.Color('#1f1f22') },
    dark: { value: 1 },
    focusX: { value: MODEL_TUNED_X },
  };
  const roomNoise = `
float studioHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float studioNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(studioHash(i),studioHash(i+vec2(1,0)),f.x),mix(studioHash(i+vec2(0,1)),studioHash(i+vec2(1,1)),f.x),f.y);}
float studioCloud(vec2 p){return .57*studioNoise(p)+.28*studioNoise(p*2.13)+.15*studioNoise(p*4.37);}
float studioFocus(vec3 p){return (1.0-smoothstep(-1.5,-6.5,p.z))*(1.0-smoothstep(0.3,3.5,p.y));}`;

  const studioSurface = (mat) => {
    mat.defines = { ...(mat.defines || {}), STUDIO_FLOOR_TAPS: String(tier.floorTaps) };
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uStudioBase = roomUniforms.base;
      shader.uniforms.uStudioDark = roomUniforms.dark;
      shader.uniforms.uStudioFocusX = roomUniforms.focusX;
      shader.vertexShader = 'varying vec3 vStudioPosition;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvStudioPosition=position;',
      );
      /* a wider shadow kernel than the board's own, for a broad soft penumbra */
      let shadowChunk = THREE.ShaderChunk.shadowmap_pars_fragment;
      const start = shadowChunk.indexOf('shadow = (');
      const end = shadowChunk.indexOf(') * 0.2;', start);
      if (start >= 0 && end >= 0) {
        shadowChunk = shadowChunk.slice(0, start)
          + 'shadow = 0.0; for(int i=0;i<STUDIO_FLOOR_TAPS;i++){shadow += texture(shadowMap,vec3(shadowCoord.xy + vogelDiskSample(i,STUDIO_FLOOR_TAPS,phi)*radius*9.0,shadowCoord.z));} shadow /= float(STUDIO_FLOOR_TAPS);'
          + shadowChunk.slice(end + 8);
        shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', shadowChunk);
      }
      /* the bump relief softens out of focus along with the grain */
      const bumpChunk = THREE.ShaderChunk.bumpmap_pars_fragment.replace(/return vec2\(([^;]*)\);/, 'return vec2($1) * studioFocus(vStudioPosition);');
      shader.fragmentShader = shader.fragmentShader.replace('#include <bumpmap_pars_fragment>', bumpChunk);
      shader.fragmentShader = 'varying vec3 vStudioPosition;\nuniform vec3 uStudioBase;uniform float uStudioDark;uniform float uStudioFocusX;\n' + roomNoise + '\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
float studioF = studioFocus(vStudioPosition);
#ifdef USE_MAP
  /* the grain is sampled from a blurrier level of detail as it falls out of focus */
  vec4 studioSampled = texture2D( map, vMapUv, (1.0 - studioF) * 4.0 );
  diffuseColor *= studioSampled;
#endif
float cloud = studioCloud(vec2(vStudioPosition.x * .19, (vStudioPosition.y - vStudioPosition.z) * .27));
/* the grain is mostly blended into a flat charcoal, so it reads as material rather than pattern */
diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * vec3(.095), (.88 + .1 * (1.0 - studioF)) * uStudioDark);
/* the paper takes over up the curve, softly mottled */
diffuseColor.rgb = mix(diffuseColor.rgb, uStudioBase * (.62 + .6 * cloud), smoothstep(0.2, 3.2, vStudioPosition.y));
/* darker towards the camera, and away from the board to either side */
diffuseColor.rgb *= mix(1.0, .14, uStudioDark * smoothstep(0.5, 6.0, vStudioPosition.z));
float studioSpread = length(vec2((vStudioPosition.x - uStudioFocusX) * .9, vStudioPosition.z * .35));
diffuseColor.rgb *= mix(1.0, .3, uStudioDark * smoothstep(4.5, 12.0, studioSpread));
`);
    };
    mat.customProgramCacheKey = () => `studio-room-${mat.defines.STUDIO_FLOOR_TAPS}`;
  };
  studioSurface(floorMat);

  /* the profile: flat slate to z = -4, a quarter-curve of radius 4, paper up to y = 30 */
  const profile = [];
  for (const z of [44, 24, 14, 8, 5, 3, 1.5, 0, -1.5, -3, -4]) profile.push([z, 0]);
  for (let i = 1; i <= 24; i++) {
    const a = (i / 24) * (Math.PI / 2);
    profile.push([-4 - 4 * Math.sin(a), 4 - 4 * Math.cos(a)]);
  }
  profile.push([-8, 12], [-8, 30]);
  const positions = [];
  const indices = [];
  const uv = [];
  let along = 0;
  profile.forEach(([z, y], i) => {
    if (i > 0) along += Math.hypot(z - profile[i - 1][0], y - profile[i - 1][1]);
    positions.push(-70, y, z, 70, y, z);
    /* one tile every eight units, continuous over the curve */
    uv.push(-70 / 8, along / 8, 70 / 8, along / 8);
  });
  for (let i = 0; i < profile.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const roomGeometry = keep(new THREE.BufferGeometry());
  roomGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roomGeometry.setIndex(indices);
  roomGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  roomGeometry.computeVertexNormals();
  const floor = new THREE.Mesh(roomGeometry, floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  /* A blurred planar reflection of the live model, fading out fast away from
     the contact area — a satin floor returns a hint of the board, not a mirror.
     Its footprint is a soft falloff in x and z, so it has no visible edge. */
  const reflectionShader = {
    name: 'Satin studio reflection',
    uniforms: {
      color: { value: new THREE.Color('#ffffff') },
      tDiffuse: { value: null },
      textureMatrix: { value: new THREE.Matrix4() },
      strength: { value: 0.09 },
      centerX: { value: MODEL_TUNED_X },
    },
    vertexShader: `uniform mat4 textureMatrix;varying vec4 vReflectionUv;varying vec3 vWorld;
void main(){vReflectionUv=textureMatrix*vec4(position,1.0);vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D tDiffuse;uniform float strength;uniform float centerX;varying vec4 vReflectionUv;varying vec3 vWorld;
void main(){vec2 p=vReflectionUv.xy/vReflectionUv.w;vec3 c=vec3(0.0);float stepSize=.006;
for(int x=-2;x<=2;x++){for(int y=-2;y<=2;y++){c+=texture2D(tDiffuse,p+vec2(float(x),float(y))*stepSize).rgb;}}c/=25.0;
float footprint=(1.0-smoothstep(3.2,4.6,abs(vWorld.x-centerX)))*exp(-max(0.0,vWorld.z)*1.8)*smoothstep(-.15,.5,vWorld.z);
gl_FragColor=vec4(c,strength*clamp(footprint,0.0,1.0));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  };
  let reflection = null;
  const buildReflection = (size) => {
    if (reflection) {
      scene.remove(reflection);
      reflection.dispose();
      reflection.geometry.dispose();
      reflection = null;
    }
    if (!size) return;
    reflection = new Reflector(new THREE.PlaneGeometry(60, 40), {
      textureWidth: size, textureHeight: size, multisample: 0, clipBias: 0.003, shader: reflectionShader,
    });
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.y = 0.012;
    reflection.material.transparent = true;
    reflection.material.depthWrite = false;
    scene.add(reflection);
  };
  buildReflection(tier.reflection);

  /* contact occlusion under the bottom edge, supplementing the cast shadow */
  const [contactCanvas, contactCtx] = makeCanvas(512, 256);
  const gradient = contactCtx.createRadialGradient(256, 128, 5, 256, 128, 240);
  gradient.addColorStop(0, 'rgba(0,0,0,.65)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  contactCtx.fillStyle = gradient;
  contactCtx.fillRect(0, 0, 512, 256);
  const contactMat = keep(new THREE.MeshBasicMaterial({ map: colourMap(contactCanvas), transparent: true, depthWrite: false, opacity: 0.7 }));
  const contactMesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(8.2, 1.4)), contactMat);
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.position.y = 0.009;
  scene.add(contactMesh);

  /* ----------------------------------------------------------- the deck */

  let deckIndex = Math.floor(Math.random() * deck.length);
  let card = deck[deckIndex];
  let fps = Number(card.fps) || 24;
  const art = new Map();
  const artFor = (production) => art.get(production.key) ?? {};

  const repaintFace = () => {
    paintFace(faceCtx, card, artFor(card), faceOptions);
    faceMap.needsUpdate = true;
  };
  const loadCardArt = (production) => Promise.all([loadArt(production.logo), loadArt(production.studioLogo)])
    .then(([title, studio]) => { art.set(production.key, { title, studio }); });

  const announce = () => {
    stage.dataset.clapProduction = card.key;
    if (takeCounter) stage.dataset.clapTake = String(card.take ?? 1);
    if (status) {
      const studio = String(card.studio ?? '').replace(/-/g, ' ');
      status.textContent = takeCounter
        ? `Clapped. Take ${card.take ?? 1}.`
        : `Slate marked for ${card.title}${studio ? `, ${studio}` : ''}.`;
    }
    if (typeof onProduction === 'function') onProduction(card);
  };

  function setProduction(index, delayPaint = 0) {
    deckIndex = index;
    card = deck[deckIndex];
    fps = Number(card.fps) || 24;
    /* on a single-card board the clap counts the take up instead */
    if (takeCounter) card.take = ((Number(card.take) || 1) % 99) + 1;
    announce();
    if (delayPaint > 0) {
      const painted = card;
      window.setTimeout(() => { if (card === painted) repaintFace(); }, delayPaint);
    } else {
      repaintFace();
    }
  }

  let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  let logoArt = null;
  let logoArtLight = null;
  let markArt = null;
  const repaintRear = () => {
    paintRear(rearCtx, record ?? { rows: [] }, theme, { logo: logoArt, logoLight: logoArtLight, mark: markArt });
    rearMap.needsUpdate = true;
  };

  /* the first face is painted at once with whatever is available, then again
     when its marks and the fonts have landed; the rest of the deck loads behind */
  repaintFace();
  repaintRear();
  announce();
  Promise.all([whenFontsReady(), loadCardArt(card), loadArt('/assets/take3-logo.svg').then((img) => { logoArt = img; }), loadArt('/assets/take3-logo.svg', { ink: 'light' }).then((img) => { logoArtLight = img; }), loadArt(record?.mark).then((img) => { markArt = img; })])
    .then(() => { repaintFace(); repaintRear(); requestRender(); })
    .then(() => Promise.all(deck.filter((p) => p !== card).map(loadCardArt)))
    .catch(() => {});
  if (document.fonts?.ready) document.fonts.ready.then(() => { repaintFace(); repaintRear(); requestRender(); }).catch(() => {});

  /* ------------------------------------------------------------ the clock */

  const clock = createClapperClock();
  let ledShown = '';
  const readClock = () => (countdown ? { label: countdownText(clockMode.at) } : readClapperClock(clock, new Date(), fps));
  const paintClock = (force = false) => {
    const reading = readClock();
    if (!force && reading.label === ledShown) return false;
    ledShown = reading.label;
    paintLED(ledCtx, reading.label);
    ledMap.needsUpdate = true;
    return true;
  };
  paintClock(true);

  /* ------------------------------------------------------------- the clap */

  const motion = createClapperMotion(CLAPPER_OPEN_ANGLE);
  pivot.rotation.z = motion.angle;

  let audio = null;
  const ensureAudio = () => {
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch { /* no sound is fine */ }
  };
  /* the sound of two sticks meeting: a short, bright burst, kept quiet */
  const clapSound = () => {
    if (!audio) return;
    try {
      const length = Math.floor(audio.sampleRate * 0.1);
      const buffer = audio.createBuffer(1, length, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * 0.013));
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 900;
      const gain = audio.createGain();
      gain.gain.value = 0.13;
      source.connect(filter).connect(gain).connect(audio.destination);
      source.start();
    } catch { /* ignore */ }
  };

  const clap = () => {
    ensureAudio();
    const going = clapClapperMotion(motion);
    if (going === 'opening' && !countdown) {
      releaseClapperClock(clock, new Date(), fps);
      paintClock(true);
    }
    stage.dataset.clapState = going;
    wake();
  };

  /* ------------------------------------------------------- the composition */

  const navEl = document.getElementById('siteNav') ?? document.querySelector('.nav');
  let plan = VIEW.wide;
  let modelX = MODEL_TUNED_X;
  let pinned = true;
  let pxPerUnit = 90;

  /* the free area to the right of the copy, so the board never sits under it
     and the balance holds from a laptop to a very wide display */
  const centreFraction = (w, fallback) => {
    if (!copy) return fallback;
    const edge = copy.getBoundingClientRect().right;
    if (!edge || edge >= w) return fallback;
    const from = edge + Math.max(40, w * 0.03);
    const to = w - Math.max(32, w * 0.025);
    if (to <= from) return fallback;
    return Math.min(0.72, Math.max(0.58, (from + to) / 2 / w));
  };

  /* Point the camera for a given magnification: level, at eye height, with the
     frame shifted so the floor line lands where the composition wants it. */
  const aimCamera = (p, w, h) => {
    const eyeFrac = plan.floorFrac - (plan.eyeY * p) / h;
    camera.aspect = w / h;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / (p * plan.dist)));
    camera.position.set(0, plan.eyeY, plan.dist);
    camera.rotation.set(0, 0, 0);
    camera.setViewOffset(w, h, 0, (0.5 - eyeFrac) * h, w, h);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  };

  const corner = new THREE.Vector3();
  const measured = [body, lowerStick, upperStick];
  /* Does the whole assembly — through every scroll pose, sticks open and shut —
     stay inside the room the layout has left for it? */
  const fitsAt = (p, w, h, bounds) => {
    aimCamera(p, w, h);
    for (let step = 0; step <= 20; step++) {
      const pose = clapperScrollPose(step / 20);
      slate.rotation.set(pose.tilt + REST_PITCH, pose.rotationY + plan.yaw, 0);
      lift.position.y = HOVER + LIFT_HEIGHT * pose.lift + 0.06;
      for (const angle of [0, CLAPPER_OPEN_ANGLE]) {
        pivot.rotation.z = angle;
        for (const [nx, ny] of [[0, 0], [-NUDGE_PITCH, -NUDGE_YAW], [NUDGE_PITCH, NUDGE_YAW], [-NUDGE_PITCH, NUDGE_YAW], [NUDGE_PITCH, -NUDGE_YAW]]) {
          nudge.rotation.set(nx, ny, 0);
          rig.updateMatrixWorld(true);
          for (const mesh of measured) {
            const [bw, bh, bd] = mesh.userData.size;
            for (const x of [-bw / 2, bw / 2]) for (const y of [-bh / 2, bh / 2]) for (const z of [-bd / 2, bd / 2]) {
              corner.set(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera);
              const px = ((corner.x + 1) * w) / 2;
              const py = ((1 - corner.y) * h) / 2;
              if (px < bounds.left || px > bounds.right || py < bounds.top || py > bounds.bottom) return false;
            }
          }
        }
      }
    }
    nudge.rotation.set(0, 0, 0);
    return true;
  };

  function fit() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const narrow = w <= 900;
    plan = narrow ? VIEW.narrow : VIEW.wide;
    pinned = window.getComputedStyle(stage).position === 'sticky';

    const controls = navEl?.querySelector('.navRight') ?? navEl;
    const navBottom = Math.max(narrow ? 80 : 90, controls?.getBoundingClientRect().bottom ?? 0);
    const copyRight = !narrow && copy ? copy.getBoundingClientRect().right : 0;
    const bounds = {
      top: navBottom + NAV_GUARD,
      bottom: h + 40,
      left: narrow ? 14 : copyRight + 30,
      right: w - (narrow ? 14 : 26),
    };
    const centre = narrow ? plan.centre : centreFraction(w, plan.centre);

    /* the magnification the composition asks for, then as much of it as fits */
    const wanted = ((plan.floorFrac - plan.eyeFrac) * h) / plan.eyeY;
    let lo = wanted * 0.2;
    let hi = wanted;
    modelX = ((centre - 0.5) * w) / wanted;
    rig.position.x = modelX;
    if (fitsAt(hi, w, h, bounds)) {
      lo = hi;
    } else {
      for (let i = 0; i < 14; i++) {
        const trial = (lo + hi) / 2;
        modelX = ((centre - 0.5) * w) / trial;
        rig.position.x = modelX;
        if (fitsAt(trial, w, h, bounds)) lo = trial;
        else hi = trial;
      }
    }
    pxPerUnit = lo;
    modelX = ((centre - 0.5) * w) / pxPerUnit;
    rig.position.x = modelX;
    aimCamera(pxPerUnit, w, h);
    pivot.rotation.z = motion.angle;

    boardLights.position.x = modelX - MODEL_TUNED_X;
    aimLights();
    roomUniforms.focusX.value = modelX;
    cameraBase.copy(camera.position);
    contactMesh.position.x = modelX;
    if (reflection) reflection.material.uniforms.centerX.value = modelX;

    stage.dataset.clapPlan = narrow ? 'narrow' : 'wide';
    stage.style.setProperty('--clapFloor', (plan.floorFrac).toFixed(3));
    requestRender();
  }

  /* ------------------------------------------------------------ the theme */

  function applyTheme(next) {
    theme = next === 'light' ? 'light' : 'dark';
    const light = theme === 'light';
    const bg = light ? '#c4c3bf' : '#0d0d0f';
    scene.background.set(bg);
    scene.fog.color.set(bg);
    floorMat.color.set(light ? '#b5b4af' : '#a4a4aa');
    floorMat.map = light ? null : floorMap;
    floorMat.needsUpdate = true;
    roomUniforms.base.value.set(light ? '#b9b8b3' : '#1f1f22');
    roomUniforms.dark.value = light ? 0 : 1;
    lightBase.key = light ? 960 : 1320;
    key.intensity = lightBase.key;
    rim.intensity = light ? 520 : 1000;
    lightBase.halo = light ? 230 : 210;
    halo.intensity = lightBase.halo;
    floorMat.roughness = light ? 0.8 : 0.78;
    ambient.intensity = light ? 0.5 : 0.22;
    lightBase.exposure = light ? 1.0 : 1.05;
    renderer.toneMappingExposure = lightBase.exposure;
    if (dust) {
      /* additive warm motes in the dark room; faint grey specks on the pale one */
      dust.material.color.set(light ? '#4d4a45' : '#ffe7c6');
      dust.material.opacity = light ? 0.2 : 0.55;
      dust.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      dust.material.needsUpdate = true;
    }
    repaintRear();
    stage.dataset.clapTheme = theme;
    requestRender();
  }
  applyTheme(theme);

  const onThemeEvent = (event) => applyTheme(event.detail?.theme ?? document.documentElement.dataset.theme);
  document.addEventListener('t3:themechange', onThemeEvent);
  const themeWatcher = new MutationObserver(() => {
    const now = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    if (now !== theme) applyTheme(now);
  });
  themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------------------------------------------------- the pointer */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitsBoard = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(slate, true).length > 0;
  };
  let dragged = false; /* a drag ends in a click event; that click is not a clap */
  const onCanvasClick = (event) => {
    if (dragged) {
      dragged = false;
      return;
    }
    if (hitsBoard(event)) clap();
  };
  /* Dragging turns the board in the hand: sideways spins it round, up and down
     tips it, and it stays exactly where it hangs. Let go and it coasts on the
     speed it was given, then settles to the nearest face, level again. */
  const drag = { on: false, id: null, x: 0, y: 0, t: 0, moved: 0 };
  const DRAG_YAW = 0.0105;   /* radians per pixel: ~300px for a half turn */
  const DRAG_PITCH = 0.006;
  const SPIN_V_MAX = 7;      /* radians per second a release can carry, at most */
  const SPIN_COAST = 0.15;   /* seconds of coast (also the decay in frame()): at most a third of a turn */
  const onPointerDown = (event) => {
    if (!scroll && event.button === 0 && hitsBoard(event)) {
      drag.on = true;
      drag.id = event.pointerId;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.t = performance.now();
      drag.moved = 0;
      spinState.vYaw = 0;
      spinState.vPitch = 0;
      renderer.domElement.setPointerCapture?.(event.pointerId);
      wake();
    }
  };
  const onDragMove = (event) => {
    if (!drag.on || event.pointerId !== drag.id) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.t) / 1000;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    const dYaw = dx * DRAG_YAW;
    const dPitch = dy * DRAG_PITCH;
    spinState.yaw += dYaw;
    spinState.pitch = Math.max(-SPIN_PITCH_MAX, Math.min(SPIN_PITCH_MAX, spinState.pitch + dPitch));
    /* the speed it is being given, smoothed a little */
    spinState.vYaw = spinState.vYaw * 0.55 + (dYaw / dt) * 0.45;
    spinState.vPitch = spinState.vPitch * 0.55 + (dPitch / dt) * 0.45;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.t = now;
    if (drag.moved > 6) {
      nudgeTarget.x = 0;
      nudgeTarget.y = 0;
      renderer.domElement.style.cursor = 'grabbing';
    }
    wake();
  };
  const endDrag = (event) => {
    if (!drag.on || (event && event.pointerId !== drag.id)) return;
    drag.on = false;
    dragged = drag.moved > 6;
    /* a stale speed from a pause before letting go should not throw it */
    if (performance.now() - drag.t > 80 || reduced) {
      spinState.vYaw = 0;
      spinState.vPitch = 0;
    }
    spinState.vYaw = Math.max(-SPIN_V_MAX, Math.min(SPIN_V_MAX, spinState.vYaw));
    spinState.vPitch = Math.max(-SPIN_V_MAX, Math.min(SPIN_V_MAX, spinState.vPitch));
    /* settle to the face it would coast nearest to */
    const coast = spinState.yaw + spinState.vYaw * SPIN_COAST;
    spinState.target = Math.round(coast / Math.PI) * Math.PI;
    renderer.domElement.style.cursor = '';
    announceFacing();
    wake();
  };
  const facingRear = () => Math.abs(Math.round(spinState.target / Math.PI)) % 2 === 1;
  const announceFacing = () => { stage.dataset.clapFacing = facingRear() ? 'rear' : 'front'; };
  announceFacing();
  /* The board turns a little towards the mouse — the object answering the hand
     over it, which is most of what makes it read as a thing rather than a
     picture. Measured from the board's own centre on screen, out to about a
     board-and-a-half away, and only for a real pointer: a finger has nothing to
     hover with, and reduced motion asks for a still object. */
  const nudgeTarget = { x: 0, y: 0 };
  const finePointer = window.matchMedia('(pointer: fine)').matches && !reduced;
  const boardCentre = new THREE.Vector3();
  const aimNudge = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    boardCentre.set(0, 2.4, 0).applyMatrix4(slate.matrixWorld).project(camera);
    const cx = rect.left + ((boardCentre.x + 1) * rect.width) / 2;
    const cy = rect.top + ((1 - boardCentre.y) * rect.height) / 2;
    const half = 3.6 * pxPerUnit;
    const dx = (event.clientX - cx) / half;
    const dy = (event.clientY - cy) / half;
    const reach = Math.hypot(dx, dy);
    if (reach > 1.5) {
      nudgeTarget.x = 0;
      nudgeTarget.y = 0;
      return;
    }
    /* full strength over the board, easing to nothing at the edge of its reach */
    const hold = 1 - Math.max(0, (reach - 0.9) / 0.6);
    nudgeTarget.y = Math.max(-1, Math.min(1, dx)) * NUDGE_YAW * hold;
    nudgeTarget.x = Math.max(-1, Math.min(1, dy)) * NUDGE_PITCH * hold;
  };
  let hoverAt = 0;
  const onPointerMove = (event) => {
    if (finePointer) {
      aimNudge(event);
      wake();
    }
    const now = performance.now();
    if (now - hoverAt < 40) return;
    hoverAt = now;
    renderer.domElement.style.cursor = hitsBoard(event) ? (scroll ? 'pointer' : 'grab') : '';
  };
  const onPointerLeave = () => {
    nudgeTarget.x = 0;
    nudgeTarget.y = 0;
    renderer.domElement.style.cursor = '';
    wake();
  };
  renderer.domElement.addEventListener('click', onCanvasClick);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onDragMove, { passive: true });
  renderer.domElement.addEventListener('pointerup', endDrag);
  renderer.domElement.addEventListener('pointercancel', endDrag);
  renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
  /* a finger's sideways drag turns the board; up and down still scrolls the page */
  if (!scroll) renderer.domElement.style.touchAction = 'pan-y';
  renderer.domElement.addEventListener('pointerleave', onPointerLeave, { passive: true });

  const trigger = stage.querySelector('[data-clap-trigger]');
  const onTrigger = (event) => {
    event.stopPropagation();
    clap();
  };
  trigger?.addEventListener('click', onTrigger);

  /* ------------------------------------------------------------- the frame */

  const heroProgress = () => {
    /* a board that does not scroll is turned by hand, through turn() */
    if (!scroll) return 0;
    if (reduced || !pinned) return 0;
    const travel = hero.offsetHeight - stage.offsetHeight;
    if (travel <= 0) return 0;
    return clamp01(-hero.getBoundingClientRect().top / travel);
  };


  const stepDown = () => {
    const order = ['high', 'medium', 'low'];
    const next = order[Math.min(order.length - 1, order.indexOf(tierName) + 1)];
    if (next === tierName) return;
    tierName = next;
    tier = TIERS[tierName];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
    key.shadow.mapSize.set(tier.shadow, tier.shadow);
    if (key.shadow.map) {
      key.shadow.map.dispose();
      key.shadow.map = null;
    }
    floorMat.defines.STUDIO_FLOOR_TAPS = String(tier.floorTaps);
    floorMat.needsUpdate = true;
    buildReflection(tier.reflection);
    stage.dataset.clapQuality = tierName;
    fit();
  };
  stage.dataset.clapQuality = tierName;

  /* Transient motion, all of it finite and all of it off under reduced motion:

       arrival   the board rises from near the floor and turns into its rest,
                 with one soft overshoot, when the page first shows it
       jolt      the whole board takes the clap — a dip and a nod forward that
                 spring back in about half a second
       flash     the key and the lamp behind strobe for a beat at contact, the
                 way a slate is lit the moment it is shot; the exposure kicks
       kick      the camera takes a small knock and settles

     Each is a damped spring or a decay, composed into the transforms the
     frame already writes. */
  const stepSpring = (spring, dt, stiffness, damping) => {
    spring.v += (-stiffness * spring.x - damping * spring.v) * dt;
    spring.x += spring.v * dt;
  };
  const arrivalY = { x: reduced ? 0 : -1.0, v: 0 };
  const arrivalYaw = { x: reduced ? 0 : 0.5, v: 0 };
  const joltY = { x: 0, v: 0 };
  const joltPitch = { x: 0, v: 0 };
  let flash = 0;
  const kick = { t: 0, seed: 0 };
  const cameraBase = new THREE.Vector3();
  const struck = () => {
    if (reduced) return;
    joltY.v = -3.4;
    joltPitch.v = 1.1;
    flash = 1;
    kick.t = 0.32;
    kick.seed = Math.random() * 1000;
  };

  /* a style write is a style recalculation for the captions; skip the unchanged ones */
  const published = new Map();
  const publish = (name, value) => {
    if (published.get(name) === value) return;
    published.set(name, value);
    stage.style.setProperty(name, value);
  };

  /* the cost of a frame, as a rolling mean, for the probe and for anyone measuring */
  let frameCost = 0;
  let frameCount = 0;

  function frame(now) {
    const began = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    /* --- the hinge: its own state machine, untouched by scroll --- */
    const { angle, impact } = stepClapperMotion(motion, dt, reduced);
    pivot.rotation.z = angle;
    if (impact) {
      /* a clock holds the frame it was clapped on; a countdown never stops */
      if (!countdown) holdClapperClock(clock, new Date(), fps);
      paintClock(true);
      struck();
      setProduction((deckIndex + 1) % deck.length, reduced ? 0 : 70);
      clapSound();
      stage.dataset.clapState = 'shut';
    } else if (stage.dataset.clapState === 'shut' && motion.hold === 0 && angle > 0.002) {
      stage.dataset.clapState = 'opening';
      if (!countdown) releaseClapperClock(clock, new Date(), fps);
    }

    /* --- the lift and the turn: the only pose scroll is allowed to write --- */
    const destination = heroProgress();
    view.progress += (destination - view.progress) * (1 - Math.pow(0.88, dt * 60));
    if (Math.abs(destination - view.progress) < 0.00001) view.progress = destination;
    const pose = clapperScrollPose(view.progress);

    /* --- the transients: arrival, jolt, flash, kick --- */
    stepSpring(arrivalY, dt, 26, 5.6);
    stepSpring(arrivalYaw, dt, 26, 5.6);
    stepSpring(joltY, dt, 190, 9);
    stepSpring(joltPitch, dt, 190, 9);
    flash *= Math.exp(-dt / 0.15);
    if (flash < 0.002) flash = 0;
    const t = now / 1000;
    /* lively: the lamps breathe a little, as tungsten does */
    const breatheKey = lively ? 1 + 0.04 * Math.sin(t * 1.1) + 0.012 * Math.sin(t * 7.3) : 1;
    const breatheHalo = lively ? 1 + 0.07 * Math.sin(t * 0.9 + 2) : 1;
    key.intensity = lightBase.key * (1 + 1.5 * flash) * breatheKey;
    halo.intensity = lightBase.halo * (1 + 1.3 * flash) * breatheHalo;
    renderer.toneMappingExposure = lightBase.exposure * (1 + 0.3 * flash);
    /* lively: the camera is never quite still — a slow handheld wander */
    const wanderX = lively ? 0.04 * Math.sin(t * 0.31) + 0.012 * Math.sin(t * 0.93) : 0;
    const wanderY = lively ? 0.025 * Math.sin(t * 0.43 + 1) : 0;
    if (kick.t > 0) {
      kick.t = Math.max(0, kick.t - dt);
      const fade = kick.t / 0.32;
      camera.position.x = cameraBase.x + wanderX + 0.05 * fade * Math.sin(now * 0.09 + kick.seed);
      camera.position.y = cameraBase.y + wanderY + 0.035 * fade * Math.cos(now * 0.117 + kick.seed);
    } else {
      camera.position.x = cameraBase.x + wanderX;
      camera.position.y = cameraBase.y + wanderY;
    }

    slate.rotation.set(pose.tilt + REST_PITCH + joltPitch.x, pose.rotationY + plan.yaw + arrivalYaw.x, 0);

    /* --- hovering: a slow drift, as a thing held in the air has; fuller and
           with a sideways wander when lively --- */
    const drift = reduced ? 0
      : lively ? 0.09 * Math.sin(t * 0.9) + 0.03 * Math.sin(t * 2.3)
      : 0.05 * Math.sin(t * 1.3) + 0.02 * Math.sin(t * 2.9);
    const height = HOVER + LIFT_HEIGHT * pose.lift;
    lift.position.y = height + drift + arrivalY.x + joltY.x;
    lift.position.x = lively ? 0.11 * Math.sin(t * 0.53) : 0;

    /* --- the nudge: eased towards where the pointer is, and back; lively adds a
           slow turn, a nod and a roll on top of it --- */
    const ease = 1 - Math.exp(-5.5 * dt);
    const sway = reduced ? 0
      : lively ? 0.05 * Math.sin(t * 0.61) + 0.014 * Math.sin(t * 1.7)
      : 0.012 * Math.sin(t * 0.7);
    const nod = lively ? 0.022 * Math.sin(t * 0.83 + 0.6) : 0;
    nudge.rotation.y += (nudgeTarget.y + sway - nudge.rotation.y) * ease;
    nudge.rotation.x += (nudgeTarget.x + nod - nudge.rotation.x) * ease;
    nudge.rotation.z = lively ? 0.009 * Math.sin(t * 0.47) : 0;

    /* --- the spin: while held it follows the hand; let go, it coasts and then
           settles to the nearest face, level again --- */
    if (!drag.on) {
      const decay = Math.exp(-dt / SPIN_COAST);
      spinState.vYaw *= decay;
      spinState.vPitch *= decay;
      spinState.yaw += spinState.vYaw * dt;
      spinState.pitch = Math.max(-SPIN_PITCH_MAX, Math.min(SPIN_PITCH_MAX, spinState.pitch + spinState.vPitch * dt));
      const gather = 1 - Math.exp(-dt * 6);
      /* the settle takes over as the coast dies away */
      const hold = Math.min(1, Math.abs(spinState.vYaw) / 1.5);
      spinState.yaw += (spinState.target - spinState.yaw) * gather * (1 - hold);
      spinState.pitch += (0 - spinState.pitch) * gather * (1 - Math.min(1, Math.abs(spinState.vPitch) / 1.5));
      if (Math.abs(spinState.target - spinState.yaw) < 0.0005 && Math.abs(spinState.vYaw) < 0.001) {
        spinState.yaw = spinState.target;
        spinState.vYaw = 0;
      }
      if (Math.abs(spinState.pitch) < 0.0005 && Math.abs(spinState.vPitch) < 0.001) {
        spinState.pitch = 0;
        spinState.vPitch = 0;
      }
    }
    spin.rotation.y = spinState.yaw;
    spin.rotation.x = spinState.pitch;

    /* --- the dust rises through the beam --- */
    if (dust) {
      const pos = dust.geometry.attributes.position;
      const arr = pos.array;
      for (let i = 0; i < DUST_COUNT; i += 1) {
        const rise = dustSeeds[i * 3];
        const phase = dustSeeds[i * 3 + 1];
        const width = dustSeeds[i * 3 + 2];
        arr[i * 3] += width * Math.sin(t * 0.5 + phase) * dt;
        arr[i * 3 + 1] += rise * dt;
        arr[i * 3 + 2] += width * 0.5 * Math.cos(t * 0.37 + phase) * dt;
        if (arr[i * 3 + 1] > DUST_BOX.yHi) {
          arr[i * 3 + 1] = DUST_BOX.yLo;
          arr[i * 3] = (Math.random() * 2 - 1) * DUST_BOX.x;
          arr[i * 3 + 2] = DUST_BOX.zLo + Math.random() * (DUST_BOX.zHi - DUST_BOX.zLo);
        }
      }
      pos.needsUpdate = true;
    }

    /* the reflection and the contact pool soften with the height of the board */
    if (reflection) {
      reflection.material.uniforms.strength.value = (theme === 'light' ? 0.045 : 0.09) / (1 + height * 0.5);
    }
    contactMat.opacity = 0.55 / (1 + height * 1.4);
    contactMesh.scale.set(1 + height * 0.15, 1 + height * 0.5, 1);

    /* --- the readout --- */
    paintClock();

    /* --- what the page needs to know, written only when it changes --- */
    publish('--clapHinge', (angle / CLAPPER_OPEN_ANGLE).toFixed(3));
    publish('--clapLift', pose.lift.toFixed(3));
    /* how far round it is: the scroll pose, or, in the hand, 0 facing front to 1 facing rear */
    const turnFraction = scroll ? pose.turn : (1 - Math.cos(spinState.yaw)) / 2;
    publish('--clapTurn', turnFraction.toFixed(3));
    publish('--clapHeroProgress', view.progress.toFixed(4));
    publish('--clapCopyFade', pose.frontCopy.toFixed(3));
    publish('--clapBackFade', pose.backCopy.toFixed(3));
    publish('--clapCopyShift', `${pose.frontShift.toFixed(1)}px`);
    publish('--clapBackShift', `${pose.backShift.toFixed(1)}px`);
    const turned = (scroll ? pose.frontCopy < 0.5 : facingRear()) ? 'yes' : 'no';
    if (stage.dataset.clapTurned !== turned) stage.dataset.clapTurned = turned;

    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    wantRender = false;

    frameCost += performance.now() - began;
    if (++frameCount >= 60) {
      stage.dataset.clapFrameMs = (frameCost / frameCount).toFixed(1);
      frameCost = 0;
      frameCount = 0;
    }

    if (!readyShown) {
      readyShown = true;
      hero.classList.add('is-ready');
      stage.dataset.clapReady = 'yes';
    }

    /* the cost probe: skip the warm-up, then average ninety frames */
    if (!probed && !reduced) {
      probeFrames += 1;
      if (probeFrames > 30) probeTime += dt;
      if (probeFrames >= 120) {
        probed = true;
        const mean = probeTime / 90;
        if (mean > 0.024) stepDown();
      }
    }

    /* under reduced motion the loop only runs while a clap is in progress */
    if (reduced && motion.angle === motion.target && motion.hold === 0 && !wantRender) stop();
  }

  /* declarations, not arrows: requestRender() can reach these during mount */
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    renderer.setAnimationLoop(frame);
  }
  function stop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }
  /* something changed that the next frame must show */
  function requestRender() {
    wantRender = true;
    wake();
  }
  function wake() {
    if (document.hidden || !visible) return;
    start();
  }

  /* Rendering only while the stage can be seen: the sticky hero scrolls away
     beneath the poster wall and the loop stops with it. */
  const seen = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
    else stop();
  }, { threshold: 0 });
  seen.observe(stage);

  const onVisibility = () => {
    if (document.hidden) stop();
    else wake();
  };
  document.addEventListener('visibilitychange', onVisibility);

  /* reduced motion: the readout still tells the time, once a second */
  let calmTick = 0;
  if (reduced) {
    calmTick = window.setInterval(() => { if (paintClock()) requestRender(); }, 1000);
  }

  const onResize = () => fit();
  window.addEventListener('resize', onResize);
  const sizeWatcher = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
  sizeWatcher?.observe(stage);
  fit();
  if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {});
  wake();

  /* --------------------------------------------------------------- teardown */

  function destroy() {
    stop();
    window.clearInterval(calmTick);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('t3:themechange', onThemeEvent);
    renderer.domElement.removeEventListener('click', onCanvasClick);
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointermove', onDragMove);
    renderer.domElement.removeEventListener('pointerup', endDrag);
    renderer.domElement.removeEventListener('pointercancel', endDrag);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    trigger?.removeEventListener('click', onTrigger);
    themeWatcher.disconnect();
    sizeWatcher?.disconnect();
    seen.disconnect();
    if (reflection) {
      reflection.dispose();
      reflection.geometry.dispose();
    }
    environment.dispose();
    for (const thing of disposables) thing.dispose?.();
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const mat of materials) mat?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement.remove();
    audio?.close?.();
    delete stage.__clapperStudio;
  }
  const onPageHide = () => destroy();
  window.addEventListener('pagehide', onPageHide, { once: true });

  const api = {
    clap,
    setProduction,
    /** Turn a non-scrolling board to its rear (true) or front (false). */
    turn(toRear) {
      /* forward to the next multiple of a half-turn that shows the asked face */
      const here = Math.round(spinState.yaw / Math.PI);
      const want = toRear ? 1 : 0;
      let steps = here;
      while (Math.abs(steps) % 2 !== want) steps += 1;
      spinState.target = steps * Math.PI;
      spinState.vYaw = 0;
      announceFacing();
      stage.dataset.clapTurnTarget = toRear ? 'rear' : 'front';
      wake();
    },
    get turned() { return facingRear(); },
    destroy,
    get quality() { return tierName; },
    /* for measurement only: the live objects, so a cost can be isolated */
    debug: { scene, renderer, camera, key, rim, halo, areaLights: [fill, broad, floorSweep], floorMat, roomUniforms, get reflection() { return reflection; }, buildReflection, paintClock, spin: spinState, get led() { return ledShown; } },
  };
  /* the handle is for measuring and driving the scene from outside; only on a
     review load, so a production page carries nothing it does not use */
  if (new URLSearchParams(window.location.search).has('review')) stage.__clapperStudio = api;
  return api;
}
