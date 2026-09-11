import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/*
  Take 3 — first-visit slate.

  Built to the proportions of a real production slate: bone-striped arm with
  a sync box on the hinge, a dot-matrix timecode head with FPS and STOP
  written either side of it, three rows of camera fields, and the production
  title printed on a black band across the foot with the casting credit.

  The timecode is the real time of day, running at 24fps. Nothing advances on
  its own — the slate is clapped to enter.
*/

const BOARD = '#f1f0ed'
const BOARD_EDGE = '#d8d6d1'
const MARK = '#17171a'
const RED = '#b3261a'
const RULE = '#15151a'
const LED = '#ff3d14'
const EASE = [0.22, 0, 0.14, 1] as const

/* ---------------- embedded artwork ---------------- */

const LOGO = /*LOGO*/ ''

/* the one production this slate belongs to */
const SLATE = {
  title: 'MOBLAND',
  roll: 'A001',
  slate: 'MOB · 17',
  take: '3',
  res: '6K',
  lens: '45MM A',
  crop: '100',
  filter: '—',
  shutter: '172.8',
  ct: '4500',
  ei: '1280',
  fps: '24',
  stop: 'T4',
  unit: 'MAIN UNIT',
  city: 'LONDON',
}

const IDLE_OUT = 30000 // nobody gets trapped behind a splash screen

/* ---------------- marker letterforms ---------------- */

const STROKES: Record<string, string[]> = {
  '3': [
    'M16,17 C38,1 73,6 75,26 C77,45 51,51 43,51',
    'M43,50 C58,48 82,55 80,75 C78,97 38,103 14,87',
  ],
}

function MarkerGlyph({
  char,
  size = 1,
  stroke = 15,
  color = MARK,
}: {
  char: string
  size?: number
  stroke?: number
  color?: string
}) {
  const paths = STROKES[char] ?? []
  return (
    <svg
      viewBox="-8 -8 116 120"
      style={{ width: 44 * size, height: 47 * size, overflow: 'visible' }}
      aria-hidden
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

/* ---------------- the timecode head ---------------- */
/* dot-matrix digits, the way a Denecke or an Ambient head reads */

const MATRIX: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
}

function MatrixDigit({ char }: { char: string }) {
  const rows = MATRIX[char] ?? MATRIX['0']
  return (
    <span
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 'clamp(0.5px, 0.14vw, 1.6px)',
        width: 'clamp(22px, 3.4vw, 33px)',
      }}
      aria-hidden
    >
      {rows.flatMap((row, r) =>
        [...row].map((on, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              display: 'block',
              aspectRatio: '1',
              borderRadius: '50%',
              background: on === '1' ? LED : 'rgba(255,61,20,0.05)',
              boxShadow: on === '1' ? '0 0 6px rgba(255,61,20,0.95), 0 0 2px rgba(255,190,150,0.9) inset' : 'none',
            }}
          />
        )),
      )}
    </span>
  )
}

function Head({ tc, locked }: { tc: string; locked: boolean }) {
  return (
    <div
      className="relative flex flex-col justify-center"
      style={{
        flex: 1,
        background: '#0a0a0b',
        border: `2px solid ${RULE}`,
        borderRadius: 4,
        padding: 'clamp(7px, 1.1vw, 11px) clamp(8px, 1.4vw, 16px)',
        boxShadow: 'inset 0 2px 16px rgba(0,0,0,0.95), inset 0 -1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* the tally row, as on the real head */}
      <div
        className="absolute flex"
        style={{ top: 'clamp(5px, 0.8vw, 8px)', right: '18%', gap: 'clamp(16px, 2.6vw, 30px)' }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background:
                i === 2
                  ? locked
                    ? '#39d16a'
                    : '#c9b021'
                  : locked
                    ? 'rgba(255,61,20,0.25)'
                    : 'rgba(255,61,20,0.7)',
              boxShadow: i === 2 ? '0 0 6px rgba(180,220,60,0.6)' : 'none',
            }}
          />
        ))}
      </div>

      <div
        className="flex items-center justify-center"
        style={{ gap: 'clamp(3px, 0.5vw, 6px)', marginTop: 'clamp(6px, 1vw, 10px)' }}
      >
        {[...tc].map((c, i) =>
          c === ':' ? (
            <span
              key={i}
              className="flex flex-col justify-center"
              style={{ gap: 5, padding: '0 1px' }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: LED,
                  boxShadow: '0 0 5px rgba(255,61,20,0.85)',
                }}
              />
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: LED,
                  boxShadow: '0 0 5px rgba(255,61,20,0.85)',
                }}
              />
            </span>
          ) : (
            <MatrixDigit key={i} char={c} />
          ),
        )}
      </div>
    </div>
  )
}

/* ---------------- the arm ---------------- */

function Arm({ angle }: { angle: number }) {
  return (
    <motion.div
      data-odyn-id="clapper-arm"
      className="relative"
      style={{ transformOrigin: '3% 100%' }}
      animate={{ rotate: angle }}
      transition={
        angle === 0
          ? { duration: 0.17, ease: [0.75, 0, 0.9, 1] }
          : { duration: 0.55, ease: [0.2, 0, 0.2, 1] }
      }
    >
      <div
        className="relative flex overflow-hidden"
        style={{
          height: 'clamp(23px, 3.3vw, 32px)',
          background: 'linear-gradient(180deg, #3b2418 0%, #59372198 30%, #2e1c12 100%), #43291a',
          border: `1.5px solid #0f0d0c`,
          borderRadius: 3,
          boxShadow: '0 10px 26px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="absolute flex overflow-hidden"
          style={{
            top: 0,
            bottom: 0,
            left: 'clamp(30px, 4.6vw, 46px)',
            right: 'clamp(6px, 1vw, 12px)',
          }}
        >
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              style={{
                background: i % 2 ? '#d9d2be' : 'transparent',
                transform: 'skewX(-19deg) scaleX(1.32)',
                opacity: i % 2 ? 0.93 : 1,
              }}
            />
          ))}
        </div>

        {/* the sync box bolted to the hinge */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: 0,
            top: 0,
            height: '100%',
            width: 'clamp(30px, 4.6vw, 46px)',
            background: 'linear-gradient(180deg, #26262b, #101014)',
            borderRight: '1.5px solid #0d0d10',
            gap: 3,
          }}
        >
          <span
            className="uppercase"
            style={{
              fontSize: 'clamp(4px, 0.55vw, 5.5px)',
              letterSpacing: '0.6px',
              color: 'rgba(244,242,238,0.5)',
              lineHeight: 1,
            }}
          >
            Sync
          </span>
          <span className="flex" style={{ gap: 4 }}>
            <span
              style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}
            />
            <span
              style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}
            />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------------- board fields ---------------- */

function Field({
  label,
  value,
  grow = 1,
  first = false,
  big = false,
  red = false,
  height,
  children,
}: {
  label: string
  value?: string
  grow?: number
  first?: boolean
  big?: boolean
  red?: boolean
  height?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        flex: grow,
        minWidth: 0,
        borderLeft: first ? undefined : `1.5px solid ${RULE}`,
        height: height ?? 'clamp(38px, 5.4vw, 50px)',
        padding: '0 6px',
      }}
    >
      <span
        className="absolute uppercase"
        style={{
          left: 6,
          top: 4,
          fontSize: 'clamp(6px, 0.82vw, 8px)',
          fontWeight: 700,
          letterSpacing: '1.2px',
          color: MARK,
        }}
      >
        {label}
      </span>
      {children ?? (
        <span
          style={{
            marginTop: 8,
            fontWeight: 800,
            fontSize: big ? 'clamp(20px, 3.1vw, 30px)' : 'clamp(13px, 1.9vw, 19px)',
            letterSpacing: '-0.4px',
            color: red ? RED : MARK,
            transform: `rotate(${big ? -2.2 : -1.4}deg) skewX(-7deg)`,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

/* ---------------- the run ---------------- */

export default function App() {
  const [tc, setTc] = useState('00000000')
  const [hover, setHover] = useState(false)
  const [clapped, setClapped] = useState(false)
  const [lift, setLift] = useState(false)
  const [done, setDone] = useState(false)
  const frozen = useRef<string | null>(null)

  /* the real time of day, at 24 frames a second */
  useEffect(() => {
    if (clapped) return
    const tick = () => {
      const d = new Date()
      const f = Math.floor((d.getMilliseconds() / 1000) * 24)
      setTc(
        [d.getHours(), d.getMinutes(), d.getSeconds(), f]
          .map((n) => String(n).padStart(2, '0'))
          .join(''),
      )
    }
    tick()
    const id = setInterval(tick, 1000 / 24)
    return () => clearInterval(id)
  }, [clapped])

  useEffect(() => {
    if (clapped) return
    const id = window.setTimeout(enter, IDLE_OUT)
    return () => clearTimeout(id)
  }, [clapped])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        enter()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clapped])

  function enter() {
    if (clapped) return
    frozen.current = tc
    setClapped(true)
    window.setTimeout(() => setLift(true), 900)
    window.setTimeout(() => setDone(true), 2200)
  }

  const replay = () => {
    frozen.current = null
    setClapped(false)
    setLift(false)
    setDone(false)
  }

  const shown = clapped && frozen.current ? frozen.current : tc
  const display = `${shown.slice(0, 2)}:${shown.slice(2, 4)}:${shown.slice(4, 6)}:${shown.slice(6, 8)}`
  const armAngle = clapped ? 0 : hover ? -13 : -8

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: '#0b0b0c', fontFamily: 'Inter, sans-serif' }}
    >
      <FauxSite revealed={lift} />

      <AnimatePresence>
        {!done && (
          <motion.div
            data-odyn-id="loader"
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: '#0b0b0c', cursor: clapped ? 'default' : 'pointer' }}
            animate={lift ? { y: '-100%' } : { y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            onClick={enter}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            role="button"
            tabIndex={0}
            aria-label="Enter the site"
          >
            {/* one hard key light, falling from above left */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 55% at 42% 34%, rgba(255,244,228,0.10) 0%, rgba(11,11,12,0) 60%)',
              }}
            />

            <AnimatePresence>
              {clapped && (
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: '#fff8ec' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.22, 0] }}
                  transition={{ duration: 0.62, times: [0, 0.09, 1], ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            <motion.div
              className="relative"
              style={{
                width: 'min(700px, 90vw, 100vh)',
                marginTop: 'clamp(62px, 12vh, 140px)',
                perspective: 1400,
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <motion.div
                data-odyn-id="slate"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{
                  rotateX: hover && !clapped ? 1.2 : 2.4,
                  rotateZ: clapped ? [-0.7, -0.3, -0.55] : -0.55,
                }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Arm angle={armAngle} />

                <div
                  className="relative mt-[4px]"
                  style={{
                    background: BOARD,
                    border: `1.5px solid ${RULE}`,
                    borderRadius: 10,
                    overflow: 'hidden',
                    boxShadow:
                      '0 26px 60px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.12) inset',
                  }}
                >
                  {/* ── head row: FPS · timecode · STOP ── */}
                  <div
                    className="flex items-stretch"
                    style={{
                      borderBottom: `1.5px solid ${RULE}`,
                      padding: 'clamp(5px, 0.9vw, 9px)',
                      gap: 'clamp(5px, 0.9vw, 9px)',
                      background: `linear-gradient(180deg, #f6f5f2, ${BOARD_EDGE})`,
                    }}
                  >
                    <div
                      className="relative flex items-center justify-center"
                      style={{ width: 'clamp(46px, 7vw, 70px)' }}
                    >
                      <span
                        className="absolute uppercase"
                        style={{
                          left: 2,
                          top: 0,
                          fontSize: 'clamp(6px, 0.82vw, 8px)',
                          fontWeight: 700,
                          letterSpacing: '1.2px',
                          color: MARK,
                        }}
                      >
                        Fps
                      </span>
                      <span
                        style={{
                          marginTop: 9,
                          fontWeight: 800,
                          fontSize: 'clamp(20px, 3.1vw, 30px)',
                          color: MARK,
                          transform: 'rotate(-3deg) skewX(-7deg)',
                        }}
                      >
                        {SLATE.fps}
                      </span>
                    </div>

                    <Head tc={display} locked={clapped} />

                    <div
                      className="relative flex items-center justify-center"
                      style={{ width: 'clamp(46px, 7vw, 70px)' }}
                    >
                      <span
                        className="absolute uppercase"
                        style={{
                          right: 2,
                          top: 0,
                          fontSize: 'clamp(6px, 0.82vw, 8px)',
                          fontWeight: 700,
                          letterSpacing: '1.2px',
                          color: MARK,
                        }}
                      >
                        Stop
                      </span>
                      <span
                        style={{
                          marginTop: 9,
                          fontWeight: 800,
                          fontSize: 'clamp(20px, 3.1vw, 30px)',
                          color: MARK,
                          transform: 'rotate(2.4deg) skewX(-7deg)',
                        }}
                      >
                        {SLATE.stop}
                      </span>
                    </div>
                  </div>

                  {/* ── roll · slate · take ── */}
                  <div className="flex" style={{ borderBottom: `1.5px solid ${RULE}` }}>
                    <Field
                      label="Roll"
                      grow={1.15}
                      first
                      height="clamp(54px, 7.6vw, 70px)"
                    >
                      <span
                        style={{
                          marginTop: 9,
                          fontWeight: 800,
                          fontSize: 'clamp(20px, 3.1vw, 30px)',
                          transform: 'rotate(-2.2deg) skewX(-7deg)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ color: RED }}>{SLATE.roll.slice(0, 1)}</span>
                        <span style={{ color: MARK }}>{SLATE.roll.slice(1)}</span>
                      </span>
                    </Field>
                    <Field
                      label="Slate"
                      value={SLATE.slate}
                      grow={1.9}
                      big
                      height="clamp(54px, 7.6vw, 70px)"
                    />
                    <Field label="Take" grow={0.95} height="clamp(54px, 7.6vw, 70px)">
                      <span style={{ marginTop: 8, transform: 'rotate(2deg)', display: 'block' }}>
                        <MarkerGlyph char="3" size={0.92} stroke={15} />
                      </span>
                    </Field>
                  </div>

                  {/* ── res · lens · crop · filter ── */}
                  <div className="flex" style={{ borderBottom: `1.5px solid ${RULE}` }}>
                    <Field label="Res" value={SLATE.res} grow={1} first />
                    <Field label="Lens" value={SLATE.lens} grow={1.6} />
                    <Field label="Crop %" value={SLATE.crop} grow={1} />
                    <Field label="Filter" value={SLATE.filter} grow={1} />
                  </div>

                  {/* ── date · shutter · ct · ei ── */}
                  <div className="flex" style={{ borderBottom: `1.5px solid ${RULE}` }}>
                    <Field label="Date" value={today()} grow={1.5} first />
                    <Field label="Shutter" value={SLATE.shutter} grow={1.1} />
                    <Field label="Ct °" value={SLATE.ct} grow={1} />
                    <Field label="Ei" value={SLATE.ei} grow={1} />
                  </div>

                  {/* ── the black band: production, then the casting credit ── */}
                  <div
                    className="relative flex flex-col items-center justify-center"
                    style={{
                      background: '#0a0a0b',
                      padding: 'clamp(16px, 2.6vw, 26px) 20px clamp(11px, 1.7vw, 16px)',
                      gap: 'clamp(10px, 1.6vw, 15px)',
                    }}
                  >
                    <img
                      data-odyn-id="production"
                      src={LOGO}
                      alt={SLATE.title}
                      style={{
                        maxHeight: 'clamp(30px, 5vw, 52px)',
                        maxWidth: '58%',
                        objectFit: 'contain',
                      }}
                    />
                    <div
                      className="flex items-center uppercase"
                      style={{
                        gap: 'clamp(8px, 1.4vw, 14px)',
                        fontSize: 'clamp(7px, 0.95vw, 9.5px)',
                        letterSpacing: '2.2px',
                        color: 'rgba(244,242,238,0.62)',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'rgba(244,242,238,0.92)' }}>
                        Casting
                      </span>
                      <span style={{ opacity: 0.4 }}>|</span>
                      <span style={{ color: '#f4f2ee', letterSpacing: '3px' }}>Take 3</span>
                      <span style={{ opacity: 0.4 }}>|</span>
                      <span>{SLATE.unit}</span>
                      <span style={{ opacity: 0.4 }}>|</span>
                      <span>{SLATE.city}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* the instruction, stated once and left alone */}
              <div className="mt-8 flex items-center justify-center">
                <span
                  className="uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: '5px',
                    color: hover ? 'rgba(244,242,238,0.72)' : 'rgba(244,242,238,0.34)',
                    transition: 'color 0.4s ease',
                    opacity: clapped ? 0 : 1,
                  }}
                >
                  Clap to enter
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {done && (
        <button
          onClick={replay}
          data-odyn-id="replay"
          className="fixed bottom-8 right-8 z-[60] uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '4px',
            color: 'rgba(244,242,238,0.75)',
            background: 'transparent',
            border: '1px solid rgba(244,242,238,0.16)',
            padding: '12px 22px',
            cursor: 'pointer',
          }}
        >
          Replay
        </button>
      )}
    </div>
  )
}

function today() {
  const d = new Date()
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map((n, i) => (i < 2 ? String(n).padStart(2, '0') : String(n)))
    .join(' · ')
}

/* ---------------- the page underneath ---------------- */

function FauxSite({ revealed }: { revealed: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: '#101012', opacity: revealed ? 1 : 0, transition: 'opacity 0.9s ease' }}
      aria-hidden={!revealed}
    >
      <div className="flex items-center justify-between px-10 py-7">
        <span
          className="uppercase"
          style={{ fontWeight: 300, fontSize: 17, letterSpacing: '6px', color: '#f4f2ee' }}
        >
          Take 3
        </span>
        <div
          className="flex items-center gap-7 uppercase"
          style={{ fontSize: 10, letterSpacing: '3px', color: 'rgba(244,242,238,0.6)' }}
        >
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>00:25:04:11</span>
          <span
            style={{
              border: '1px solid rgba(244,242,238,0.14)',
              padding: '11px 20px',
              color: '#f4f2ee',
            }}
          >
            Get in touch
          </span>
          <span>Menu</span>
        </div>
      </div>
      <div className="flex flex-1 items-end px-10 pb-20">
        <div>
          <motion.p
            className="uppercase"
            style={{ fontSize: 10, letterSpacing: '5px', color: '#d4704f', marginBottom: 22 }}
            initial={false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ delay: 0.4, duration: 1, ease: EASE }}
          >
            Casting — Models — Dancers
          </motion.p>
          <motion.h1
            className="uppercase"
            style={{
              fontWeight: 200,
              fontSize: 'clamp(34px, 6vw, 74px)',
              letterSpacing: '0.02em',
              color: '#f4f2ee',
              lineHeight: 1.06,
              maxWidth: '18ch',
            }}
            initial={false}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ delay: 0.55, duration: 1.2, ease: EASE }}
          >
            People who make the frame
          </motion.h1>
        </div>
      </div>
    </div>
  )
}
