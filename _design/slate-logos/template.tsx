import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

/*
  Take 3 — first-visit slate.

  The timecode simply runs. The board cycles through productions Take 3 has
  cast, in a different order every visit. The take box holds the Take 3 mark.
  Nothing advances on its own: you clap the slate to go in.

  Production logos are the real files from public/assets/production-logos,
  embedded so the mockup needs no network.
*/

const CHALK = '#efece3'
const MARK = '#141416'
const RULE = '#111114'
const LED = '#ff2b16'
const ACCENT = '#d4704f'
const EASE = [0.22, 0, 0.14, 1] as const

/* ---------------- embedded artwork ---------------- */

const LOGO: Record<string, string> = /*LOGOS*/ {}
const TAKE3 = /*TAKE3*/ ''

/* ---------------- the slate roll ---------------- */

type Slate = {
  key: string
  title: string
  roll: string
  scene: string
  date: string
  unit: string
  /* some logos are wide, some stacked — a per-title trim so each sits right */
  scale?: number
}

const PRODUCTIONS: Slate[] = [
  { key: 'mobland', title: 'MOBLAND', roll: 'A024', scene: '17', date: '12 · 04 · 24', unit: 'MAIN UNIT — LONDON', scale: 0.94 },
  { key: 'harry-potter', title: 'HARRY POTTER', roll: 'B112', scene: '44', date: '30 · 07 · 25', unit: 'MAIN UNIT — LEAVESDEN', scale: 1 },
  { key: 'slow-horses', title: 'SLOW HORSES', roll: 'C007', scene: '208', date: '05 · 02 · 25', unit: 'MAIN UNIT — LONDON', scale: 0.92 },
  { key: 'werwulf', title: 'WERWULF', roll: 'A003', scene: '61', date: '18 · 11 · 24', unit: 'MAIN UNIT — IRELAND', scale: 1 },
  { key: 'supacell', title: 'SUPACELL', roll: 'D041', scene: '12', date: '22 · 09 · 24', unit: 'MAIN UNIT — LONDON', scale: 0.86 },
  { key: 'vision-quest', title: 'VISION QUEST', roll: 'A118', scene: '33', date: '14 · 06 · 25', unit: 'MAIN UNIT — PINEWOOD', scale: 1 },
  { key: 'deadpool-wolverine', title: 'DEADPOOL & WOLVERINE', roll: 'B076', scene: '3101', date: '09 · 13 · 23', unit: 'SECOND UNIT — LONDON', scale: 0.9 },
  { key: 'gangs-of-london', title: 'GANGS OF LONDON', roll: 'A052', scene: '77', date: '03 · 03 · 25', unit: 'MAIN UNIT — LONDON', scale: 0.94 },
]

const DWELL = 2600 // how long each production holds
const IDLE_OUT = 26000 // if nobody claps, go in anyway rather than trapping them

/* ---------------- red LED timecode ---------------- */

const SEGS = {
  a: '8,5.5 13.5,0 46.5,0 52,5.5 46.5,11 13.5,11',
  g: '8,52 13.5,46.5 46.5,46.5 52,52 46.5,57.5 13.5,57.5',
  d: '8,98.5 13.5,93 46.5,93 52,98.5 46.5,104 13.5,104',
  f: '0,13.5 5.5,8 11,13.5 11,41 5.5,46.5 0,41',
  b: '49,13.5 54.5,8 60,13.5 60,41 54.5,46.5 49,41',
  e: '0,63 5.5,57.5 11,63 11,90.5 5.5,96 0,90.5',
  c: '49,63 54.5,57.5 60,63 60,90.5 54.5,96 49,90.5',
} as const
type Seg = keyof typeof SEGS
const ORDER: Seg[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
const GLYPHS: Record<string, Seg[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
}

function LedDigit({ char }: { char: string }) {
  const on = GLYPHS[char] ?? []
  return (
    <svg
      viewBox="-2 -2 64 108"
      style={{ width: 'clamp(19px, 3.3vw, 30px)', height: 'auto' }}
      aria-hidden
    >
      {ORDER.map((s) => {
        const lit = on.includes(s)
        return (
          <polygon
            key={s}
            points={SEGS[s]}
            fill={lit ? LED : 'rgba(255,43,22,0.07)'}
            style={{
              filter: lit ? 'drop-shadow(0 0 8px rgba(255,43,22,0.7))' : 'none',
              transition: 'fill 60ms linear',
            }}
          />
        )
      })}
    </svg>
  )
}

function LedStrip({ tc, locked }: { tc: number[]; locked: boolean }) {
  const s = tc.map((n) => String(n).padStart(2, '0')).join('')
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        background: '#08080a',
        borderBottom: `2px solid ${RULE}`,
        padding: 'clamp(9px, 1.6vw, 15px) 10px',
        boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.9)',
      }}
    >
      {[...s].map((c, i) => (
        <span key={i} className="flex items-center">
          <LedDigit char={c} />
          {(i === 1 || i === 3 || i === 5) && (
            <span
              className="block"
              style={{
                width: 5,
                height: 5,
                margin: '0 3px',
                borderRadius: 1,
                background: LED,
                boxShadow: '0 0 7px rgba(255,43,22,0.8)',
              }}
            />
          )}
        </span>
      ))}
      <span
        className="absolute"
        style={{
          right: 12,
          top: 10,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: locked ? '#2fbf5c' : LED,
          boxShadow: `0 0 8px ${locked ? 'rgba(47,191,92,0.85)' : 'rgba(255,43,22,0.8)'}`,
          transition: 'background 0.2s linear',
        }}
      />
    </div>
  )
}

/* ---------------- the arm: wood, cream and black. no colour bars ---------------- */

function Arm({ angle }: { angle: number }) {
  return (
    <motion.div
      data-odyn-id="clapper-arm"
      className="relative"
      style={{ transformOrigin: '4% 100%' }}
      animate={{ rotate: angle }}
      transition={
        angle === 0
          ? { duration: 0.19, ease: [0.7, 0, 0.9, 1] }
          : { duration: 0.5, ease: [0.2, 0, 0.2, 1] }
      }
    >
      <div
        className="relative flex overflow-hidden"
        style={{
          height: 'clamp(24px, 3.5vw, 33px)',
          background: 'linear-gradient(180deg, #55351f 0%, #74492b 44%, #3a2213 100%)',
          border: `2px solid ${RULE}`,
          borderRadius: 2,
          boxShadow: '0 8px 22px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute flex overflow-hidden"
          style={{
            top: 0,
            bottom: 0,
            left: 'clamp(22px, 3vw, 30px)',
            right: 'clamp(9px, 1.5vw, 16px)',
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1"
              style={{
                background: i % 2 ? CHALK : '#141416',
                transform: 'skewX(-21deg) scaleX(1.3)',
              }}
            />
          ))}
        </div>
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            height: '100%',
            width: 'clamp(22px, 3vw, 30px)',
            background: 'linear-gradient(180deg, #40404a, #15151a)',
            borderRight: `2px solid ${RULE}`,
          }}
        />
      </div>
    </motion.div>
  )
}

/* ---------------- board pieces ---------------- */

function Cell({
  label,
  children,
  grow = 1,
  first = false,
}: {
  label: string
  children: React.ReactNode
  grow?: number
  first?: boolean
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        flex: grow,
        borderLeft: first ? undefined : `2px solid ${RULE}`,
        height: 'clamp(58px, 8.4vw, 78px)',
      }}
    >
      <span
        className="absolute uppercase"
        style={{
          left: 7,
          top: 5,
          fontSize: 'clamp(7px, 1vw, 9px)',
          fontWeight: 700,
          letterSpacing: '1.4px',
          color: MARK,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function Scrawl({ text, size = 1 }: { text: string; size?: number }) {
  return (
    <span
      style={{
        fontWeight: 800,
        fontSize: `calc(clamp(20px, 3.4vw, 32px) * ${size})`,
        letterSpacing: '-0.5px',
        color: MARK,
        transform: 'rotate(-2.4deg) skewX(-7deg)',
        display: 'block',
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  )
}

function FieldLine({
  label,
  value,
  marker = true,
}: {
  label: string
  value: string
  marker?: boolean
}) {
  return (
    <div
      className="flex gap-2"
      style={{
        borderBottom: `1.5px solid ${RULE}`,
        padding: '5px 8px',
        flex: 1,
        alignItems: 'center',
      }}
    >
      <span
        className="uppercase"
        style={{
          fontSize: 'clamp(7px, 0.95vw, 9px)',
          fontWeight: 700,
          letterSpacing: '1.4px',
          color: MARK,
          flex: 'none',
        }}
      >
        {label}
      </span>
      <span
        className="uppercase"
        style={{
          fontSize: 'clamp(9px, 1.2vw, 11.5px)',
          fontWeight: marker ? 800 : 500,
          letterSpacing: marker ? '-0.2px' : '1px',
          color: MARK,
          transform: marker ? 'rotate(-1.2deg)' : 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  )
}

/* ---------------- the run ---------------- */

function shuffled<T>(a: T[]) {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function App() {
  /* a different order — and so a different first slate — every visit */
  const roll = useMemo(() => shuffled(PRODUCTIONS), [])
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const [clapped, setClapped] = useState(false)
  const [lift, setLift] = useState(false)
  const [done, setDone] = useState(false)
  const [frame, setFrame] = useState(0)
  const [run, setRun] = useState(0)

  const cur = roll[idx % roll.length]

  /* the timecode simply runs */
  useEffect(() => {
    if (clapped) return
    const id = setInterval(() => setFrame((f) => f + 1), 1000 / 24)
    return () => clearInterval(id)
  }, [clapped, run])

  /* the board keeps turning over productions until someone claps it */
  useEffect(() => {
    if (clapped) return
    const id = setInterval(() => setIdx((i) => i + 1), DWELL)
    return () => clearInterval(id)
  }, [clapped, run])

  /* nobody should be trapped behind a splash screen */
  useEffect(() => {
    if (clapped) return
    const id = window.setTimeout(() => enter(), IDLE_OUT)
    return () => clearTimeout(id)
  }, [clapped, run])

  function enter() {
    if (clapped) return
    setClapped(true)
    window.setTimeout(() => setLift(true), 620)
    window.setTimeout(() => setDone(true), 1750)
  }

  /* keyboard gets in too */
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

  const tc = useMemo(() => {
    const total = (11 * 60 * 60 + 39 * 60 + 55) * 24 + 2 + frame
    return [
      Math.floor(total / (24 * 60 * 60)) % 24,
      Math.floor(total / (24 * 60)) % 60,
      Math.floor(total / 24) % 60,
      total % 24,
    ]
  }, [frame])

  const replay = () => {
    setIdx(0)
    setClapped(false)
    setLift(false)
    setDone(false)
    setFrame(0)
    setRun((r) => r + 1)
  }

  const armAngle = clapped ? 0 : hover ? -19 : -12

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: '#0c0c0e', fontFamily: 'Inter, sans-serif' }}
    >
      <FauxSite revealed={lift} />

      <AnimatePresence>
        {!done && (
          <motion.div
            data-odyn-id="loader"
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: '#0c0c0e', cursor: clapped ? 'default' : 'pointer' }}
            animate={lift ? { y: '-100%' } : { y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: EASE }}
            onClick={enter}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            role="button"
            tabIndex={0}
            aria-label="Enter the site"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(85% 65% at 50% 42%, rgba(255,236,214,0.09) 0%, rgba(12,12,14,0) 62%)',
              }}
            />

            <AnimatePresence>
              {clapped && (
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: '#fff6e8' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.34, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.1, 1], ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            <motion.div
              data-odyn-id="slate"
              className="relative"
              style={{
                width: 'min(760px, 90vw)',
                marginTop: 'clamp(60px, 12vh, 140px)',
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, rotate: clapped ? [0, -0.5, 0] : 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Arm angle={armAngle} />

              <div
                className="relative mt-[5px] overflow-hidden"
                style={{ border: `2.5px solid ${RULE}`, background: CHALK, borderRadius: 3 }}
              >
                {/* the clock never stops */}
                <LedStrip tc={tc} locked={clapped} />

                {/* roll · scene · the mark */}
                <div className="flex" style={{ borderBottom: `2px solid ${RULE}` }}>
                  <Cell label="Roll" grow={1.15} first>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={cur.key + '-roll'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.34, ease: EASE }}
                      >
                        <Scrawl text={cur.roll} size={0.84} />
                      </motion.span>
                    </AnimatePresence>
                  </Cell>
                  <Cell label="Scene" grow={1.5}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={cur.key + '-scene'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.34, ease: EASE }}
                      >
                        <Scrawl text={cur.scene} />
                      </motion.span>
                    </AnimatePresence>
                  </Cell>
                  <Cell label="Casting" grow={1.25}>
                    <img
                      data-odyn-id="take3-mark"
                      src={TAKE3}
                      alt="Take 3 Agency"
                      style={{
                        height: 'clamp(34px, 5vw, 50px)',
                        width: 'auto',
                        marginTop: 9,
                        opacity: 0.95,
                      }}
                    />
                  </Cell>
                </div>

                {/* the production plate */}
                <div className="flex" style={{ minHeight: 'clamp(104px, 15vw, 142px)' }}>
                  <div
                    className="relative flex flex-1 items-center justify-center overflow-hidden"
                    style={{ borderRight: `2px solid ${RULE}`, background: '#0a0a0c' }}
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={cur.key}
                        data-odyn-id="production"
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ padding: 'clamp(9px, 1.7vw, 18px)' }}
                        initial={{ opacity: 0, x: '18%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '-18%' }}
                        transition={{ duration: 0.55, ease: [0.6, 0, 0.2, 1] }}
                      >
                        <img
                          src={LOGO[cur.key]}
                          alt={cur.title}
                          style={{
                            maxWidth: `${(cur.scale ?? 1) * 100}%`,
                            maxHeight: `${(cur.scale ?? 1) * 100}%`,
                            objectFit: 'contain',
                          }}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col" style={{ width: '37%' }}>
                    <FieldLine label="Prod" value={cur.title} />
                    <FieldLine label="Casting" value="TAKE 3 AGENCY" />
                    <FieldLine label="Unit" value={cur.unit} marker={false} />
                    <FieldLine label="Fps" value="23.976" marker={false} />
                  </div>
                </div>

                {/* bottom row */}
                <div className="flex" style={{ borderTop: `2px solid ${RULE}` }}>
                  <div style={{ flex: 1.4 }}>
                    <FieldLine label="Date" value={cur.date} />
                  </div>
                  <div style={{ flex: 1, borderLeft: `2px solid ${RULE}` }}>
                    <FieldLine label="Slate" value={`${cur.roll} / ${cur.scene}`} />
                  </div>
                  <div style={{ flex: 1, borderLeft: `2px solid ${RULE}` }}>
                    <FieldLine label="Snd" value="24" />
                  </div>
                </div>
              </div>

              {/* the invitation */}
              <motion.div
                className="mt-7 flex items-center justify-center gap-3"
                animate={{ opacity: clapped ? 0 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.span
                  className="uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '5px',
                    color: hover ? '#f4f2ee' : 'rgba(244,242,238,0.5)',
                    transition: 'color 0.3s ease',
                  }}
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Clap the slate to enter
                </motion.span>
              </motion.div>
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
            fontSize: 9.5,
            letterSpacing: '4px',
            color: '#f4f2ee',
            background: 'rgba(12,12,14,0.55)',
            border: '1px solid rgba(244,242,238,0.18)',
            padding: '12px 22px',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          Replay intro
        </button>
      )}
    </div>
  )
}

/* ---------------- the page underneath ---------------- */

function FauxSite({ revealed }: { revealed: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: '#101012', opacity: revealed ? 1 : 0, transition: 'opacity 0.8s ease' }}
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
            style={{ fontSize: 10, letterSpacing: '5px', color: ACCENT, marginBottom: 22 }}
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
