export type ModCategory =
  | 'engine' | 'exhaust' | 'forced_induction' | 'tuning'
  | 'suspension' | 'brakes'
  | 'wheels_tires'
  | 'exterior' | 'interior'
  | 'audio_electronics'
  | 'other'

export const MOD_CATEGORY_GROUPS: { section: string; categories: { key: ModCategory; label: string; hint: string }[] }[] = [
  {
    section: 'Performance',
    categories: [
      { key: 'engine', label: 'Engine', hint: 'Intake, cams, pistons, block work...' },
      { key: 'exhaust', label: 'Exhaust', hint: 'Headers, midpipe, cat-back, downpipe...' },
      { key: 'forced_induction', label: 'Forced Induction', hint: 'Turbo, supercharger, intercooler...' },
      { key: 'tuning', label: 'Tuning', hint: 'ECU tune, dyno results, fuel system...' },
    ],
  },
  {
    section: 'Suspension & Brakes',
    categories: [
      { key: 'suspension', label: 'Suspension', hint: 'Coilovers, sway bars, control arms...' },
      { key: 'brakes', label: 'Brakes', hint: 'Rotors, pads, lines, calipers...' },
    ],
  },
  {
    section: 'Wheels & Tires',
    categories: [
      { key: 'wheels_tires', label: 'Wheels & Tires', hint: 'Wheel setup, tire spec, offset...' },
    ],
  },
  {
    section: 'Visual',
    categories: [
      { key: 'exterior', label: 'Exterior', hint: 'Wrap, paint, aero, body kit...' },
      { key: 'interior', label: 'Interior', hint: 'Seats, wheel, shift knob, harness...' },
    ],
  },
  {
    section: 'Electronics',
    categories: [
      { key: 'audio_electronics', label: 'Audio & Electronics', hint: 'Head unit, subs, amps, gauges...' },
    ],
  },
  {
    section: 'Other',
    categories: [
      { key: 'other', label: 'Other', hint: 'Anything that doesn\'t fit above' },
    ],
  },
]
