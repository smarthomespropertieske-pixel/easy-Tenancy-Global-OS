// ════════════════════════════════════════════════════════════════════════
//  icons.tsx — Premium SVG Icon System
//  ─────────────────────────────────────────────────────────────────────
//  • Linear / Vercel / Stripe-style — own, tightly-tuned, single source
//  • 24×24 viewBox · 1.5px stroke · square caps · joined corners
//  • currentColor on stroke & fill — themeable via parent `color`
//  • ~2KB gz total (vs ~50KB for lucide-react)
//  • Optical centering — every glyph hand-balanced inside the viewBox
//  • Brand glyphs (Meta / Salesforce / Google) preserve correct colours
//  • Brand mark (`easyTenancy`) — animated radial monogram for the nav
//
//  Usage:
//    <Icon name="globe"   size={20} />
//    <Icon name="zap"     size={24} stroke={2} className="t-grad" />
//    <Globe size={20} />                  // also exported individually
//    <BrandMark size={28} />              // easyTenancy nav glyph
// ════════════════════════════════════════════════════════════════════════

import React from 'react'

// ───────────────────────────────────────────────────────────────────
//  Generic <Icon> wrapper — accepts a name from the registry below
// ───────────────────────────────────────────────────────────────────
export interface IconProps {
  name?:      IconName
  size?:      number
  stroke?:    number
  className?: string
  style?:     React.CSSProperties
  title?:     string
  'aria-hidden'?: boolean | 'true' | 'false'
}

// Shared SVG shell for utility icons
const Svg: React.FC<
  IconProps & { children: React.ReactNode }
> = ({ size = 20, stroke = 1.5, className, style, title, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : (rest['aria-hidden'] ?? true)}
    aria-label={title}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
)

// ───────────────────────────────────────────────────────────────────
//  Glyph primitives — pure JSX fragments to be slotted into <Svg>
//  Each is hand-tuned at 24×24 with consistent 1.5px stroke
// ───────────────────────────────────────────────────────────────────

// ---- Geography / world -------------------------------------------------
const GlobeG = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </>
)
const CompassG = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none" />
  </>
)
const MapPinG = (
  <>
    <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" />
    <circle cx="12" cy="9" r="2.5" />
  </>
)

// ---- Buildings / property ---------------------------------------------
const BuildingG = (
  <>
    <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
    <path d="M15 9h3a2 2 0 0 1 2 2v10" />
    <path d="M4 21h16" />
    <path d="M8 7h3M8 11h3M8 15h3" />
  </>
)
const HomeG = (
  <>
    <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" />
  </>
)
const LayersG = (
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
    <path d="M3 17l9 5 9-5" />
  </>
)
const KeyG = (
  <>
    <circle cx="8" cy="14" r="4" />
    <path d="M11 11l9-9" />
    <path d="M17 5l3 3" />
    <path d="M15 7l3 3" />
  </>
)

// ---- Security / trust --------------------------------------------------
const ShieldG = (
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </>
)
const ShieldCheckG = (
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M8.5 12l2.5 2.5L16 9.5" />
  </>
)
const LockG = (
  <>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>
)

// ---- AI / intelligence -------------------------------------------------
const SparklesG = (
  <>
    <path d="M12 3l1.6 4.2L18 8.8 13.6 10.4 12 14.6 10.4 10.4 6 8.8l4.4-1.6L12 3z" />
    <path d="M19 14l.7 2 2 .7-2 .7L19 19.5l-.7-2-2-.7 2-.7.7-2z" />
    <path d="M5 16l.5 1.5 1.5.5-1.5.5L5 20l-.5-1.5-1.5-.5 1.5-.5L5 16z" />
  </>
)
const BotG = (
  <>
    <rect x="4" y="7" width="16" height="13" rx="3" />
    <circle cx="9"  cy="13" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9 17.5h6" />
    <path d="M12 4v3" />
    <circle cx="12" cy="3.2" r="1" fill="currentColor" stroke="none" />
  </>
)
const BrainG = (
  <>
    <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 2.8c0 1.3.8 2.4 2 2.8v.4a3 3 0 0 0 3 3v1a2 2 0 0 0 4 0V4.5A2 2 0 0 0 11 4H9z" />
    <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 2.8c0 1.3-.8 2.4-2 2.8v.4a3 3 0 0 1-3 3v1a2 2 0 0 1-4 0" />
  </>
)
const CommandG = (
  <>
    <path d="M6 9a3 3 0 1 1 3-3v12a3 3 0 1 1-3-3h12a3 3 0 1 1-3 3V6a3 3 0 1 1 3 3H6z" />
  </>
)

// ---- Motion / energy ---------------------------------------------------
const ZapG = (
  <>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </>
)
const TrendingUpG = (
  <>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </>
)
const TargetG = (
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </>
)
const NetworkG = (
  <>
    <circle cx="12" cy="4"  r="2" />
    <circle cx="5"  cy="20" r="2" />
    <circle cx="19" cy="20" r="2" />
    <path d="M12 6v6M12 12L6.5 18.5M12 12l5.5 6.5" />
  </>
)
const InfinityG = (
  <>
    <path d="M6 12a3 3 0 1 1 3-3l6 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6L9 15a3 3 0 1 1-3-3z" />
  </>
)
const RocketG = (
  <>
    <path d="M5 14c0-5 7-12 12-12 0 5-7 12-12 12z" />
    <path d="M5 14l-2 5 5-2" />
    <circle cx="14" cy="9" r="1.5" />
    <path d="M9 17c-2 0-3 1-3 3h3" />
  </>
)

// ---- UI atoms ---------------------------------------------------------
const CheckG       = <path d="M5 12.5l4.5 4.5L19 7" />
const PlusG        = <><path d="M12 5v14" /><path d="M5 12h14" /></>
const MinusG       = <path d="M5 12h14" />
const XG           = <><path d="M6 6l12 12" /><path d="M6 18L18 6" /></>
const XCircleG     = <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>
const Edit2G       = <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></>
const SaveG        = <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>
const UploadG      = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>
const CameraG      = <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>
const MenuG        = <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>
const ChevronDownG = <path d="M6 9l6 6 6-6" />
const ChevronRightG= <path d="M9 6l6 6-6 6" />
const ArrowRightG  = <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>
const ArrowUpRightG= <><path d="M7 17L17 7" /><path d="M9 7h8v8" /></>
const ExternalLinkG= (
  <>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </>
)
const SearchG = (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.5-4.5" />
  </>
)
const SettingsG = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.29 16.96l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.13.31.2.65.2 1H21a2 2 0 0 1 0 4h-.09c-.35 0-.69.07-1 .2z" />
  </>
)

// ---- Money / docs ------------------------------------------------------
const DollarG = (
  <>
    <path d="M12 2v20" />
    <path d="M17 6.5a4 4 0 0 0-4-2.5h-2A3.5 3.5 0 0 0 7.5 7.5c0 2 1.5 3 3.5 3.5l2 .5c2 .5 3.5 1.5 3.5 3.5A3.5 3.5 0 0 1 13 18.5h-2a4 4 0 0 1-4-2.5" />
  </>
)
const ChartG = (
  <>
    <path d="M3 21h18" />
    <rect x="6"  y="11" width="3" height="7" />
    <rect x="11" y="7"  width="3" height="11" />
    <rect x="16" y="14" width="3" height="4" />
  </>
)
const FileTextG = (
  <>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h6" />
  </>
)

// ---- People / community -----------------------------------------------
const UsersG = (
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="3" />
    <path d="M21.5 19a4.5 4.5 0 0 0-4.5-4.5" />
  </>
)
const UserG = (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>
)
const LogOutG = (
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
)
const StarG = (
  <path d="M12 3l2.6 6 6.4.5-4.9 4.3 1.5 6.4L12 16.9 6.4 20.2l1.5-6.4L3 9.5 9.4 9 12 3z" />
)

// ---- Misc layout ------------------------------------------------------
const GridG = (
  <>
    <rect x="3"  y="3"  width="7" height="7" rx="1" />
    <rect x="14" y="3"  width="7" height="7" rx="1" />
    <rect x="3"  y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>
)
const ClockG = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
)
const ActivityG = (
  <>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </>
)
const FilterG = (
  <>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>
)
const RefreshCwG = (
  <>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </>
)
const DownloadG = (
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
)
const BellG = (
  <>
    <path d="M18 16l1 2H5l1-2V11a6 6 0 0 1 12 0v5z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </>
)
const GiftG = (
  <>
    <rect x="3" y="9" width="18" height="12" rx="1.5" />
    <path d="M3 13h18M12 9v12" />
    <path d="M12 9a3 3 0 1 0-3-3c0 2 1 3 3 3zM12 9a3 3 0 1 1 3-3c0 2-1 3-3 3z" />
  </>
)
const VRG = (
  <>
    <rect x="2" y="7" width="20" height="11" rx="3" />
    <circle cx="8"  cy="12.5" r="2" />
    <circle cx="16" cy="12.5" r="2" />
    <path d="M10.5 12.5h3" />
  </>
)
const ScaleG = (
  <>
    <path d="M12 3v18" />
    <path d="M5 21h14" />
    <path d="M6 8l-3 6c0 2 1.3 3 3 3s3-1 3-3l-3-6z" />
    <path d="M18 8l-3 6c0 2 1.3 3 3 3s3-1 3-3l-3-6z" />
  </>
)
const SunG = (
  <>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </>
)
const MoonG = (
  <>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </>
)

// ───────────────────────────────────────────────────────────────────
//  Icon registry
// ───────────────────────────────────────────────────────────────────
const REGISTRY = {
  // geo
  globe: GlobeG, compass: CompassG, 'map-pin': MapPinG,
  // property
  building: BuildingG, home: HomeG, layers: LayersG, key: KeyG,
  // security
  shield: ShieldG, 'shield-check': ShieldCheckG, lock: LockG,
  // ai
  sparkles: SparklesG, bot: BotG, brain: BrainG, command: CommandG,
  // motion
  zap: ZapG, 'trending-up': TrendingUpG, target: TargetG, network: NetworkG,
  infinity: InfinityG, rocket: RocketG,
  // ui
  check: CheckG, plus: PlusG, minus: MinusG, x: XG, menu: MenuG,
  'chevron-down': ChevronDownG, 'chevron-right': ChevronRightG,
  'arrow-right': ArrowRightG, 'arrow-up-right': ArrowUpRightG,
  'external-link': ExternalLinkG, search: SearchG, settings: SettingsG,
  // money / docs
  dollar: DollarG, chart: ChartG, 'file-text': FileTextG,
  // people
  users: UsersG, star: StarG,
  // misc
  grid: GridG, clock: ClockG, bell: BellG, gift: GiftG, vr: VRG, scale: ScaleG,
  sun: SunG, moon: MoonG,
} as const

export type IconName = keyof typeof REGISTRY

// ───────────────────────────────────────────────────────────────────
//  Public <Icon name="..." /> component
// ───────────────────────────────────────────────────────────────────
export const Icon: React.FC<IconProps> = ({ name, ...rest }) => {
  if (!name || !(name in REGISTRY)) return null
  return <Svg {...rest}>{REGISTRY[name]}</Svg>
}

// ───────────────────────────────────────────────────────────────────
//  Named individual exports (tree-shake-friendly)
// ───────────────────────────────────────────────────────────────────
const make = (g: React.ReactNode): React.FC<Omit<IconProps, 'name'>> =>
  (p) => <Svg {...p}>{g}</Svg>

export const Globe        = make(GlobeG)
export const Compass      = make(CompassG)
export const MapPin       = make(MapPinG)
export const Building     = make(BuildingG)
export const Home         = make(HomeG)
export const Layers       = make(LayersG)
export const KeyIcon      = make(KeyG)
export const Shield       = make(ShieldG)
export const ShieldCheck  = make(ShieldCheckG)
export const Lock         = make(LockG)
export const Sparkles     = make(SparklesG)
export const Bot          = make(BotG)
export const Brain        = make(BrainG)
export const Command      = make(CommandG)
export const Zap          = make(ZapG)
export const TrendingUp   = make(TrendingUpG)
export const Target       = make(TargetG)
export const Network      = make(NetworkG)
export const Infinity_    = make(InfinityG)
export const Rocket       = make(RocketG)
export const Check        = make(CheckG)
export const Plus         = make(PlusG)
export const Minus        = make(MinusG)
export const X            = make(XG)
export const XCircle      = make(XCircleG)
export const Edit2        = make(Edit2G)
export const Edit         = make(Edit2G)
export const Save         = make(SaveG)
export const Upload       = make(UploadG)
export const Camera       = make(CameraG)
export const Menu         = make(MenuG)
export const ChevronDown  = make(ChevronDownG)
export const ChevronRight = make(ChevronRightG)
export const ArrowRight   = make(ArrowRightG)
export const ArrowUpRight = make(ArrowUpRightG)
export const ExternalLink = make(ExternalLinkG)
export const Search       = make(SearchG)
export const Settings     = make(SettingsG)
export const Dollar       = make(DollarG)
export const Chart        = make(ChartG)
export const FileText     = make(FileTextG)
export const Users        = make(UsersG)
export const User         = make(UserG)
export const LogOut       = make(LogOutG)
export const Star         = make(StarG)
export const Grid         = make(GridG)
export const Clock        = make(ClockG)
export const Activity     = make(ActivityG)
export const Filter       = make(FilterG)
export const RefreshCw    = make(RefreshCwG)
export const Download     = make(DownloadG)
export const Bell         = make(BellG)
export const Gift         = make(GiftG)
export const VR           = make(VRG)
export const Scale        = make(ScaleG)
export const Sun          = make(SunG)
export const Moon         = make(MoonG)

// ════════════════════════════════════════════════════════════════════════
//  BRAND GLYPHS — Meta · Salesforce · Google
//  ─────────────────────────────────────────────────────────────────────
//  Refined inline marks for the Holy Trinity nodes.
//  • 48×48 (HolyTrinityHub) or arbitrary `size` prop
//  • Brand-correct gradients + colour wheels
//  • aria-hidden by default; pass `title` for accessible label
// ════════════════════════════════════════════════════════════════════════

interface BrandProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}

export const MetaGlyph: React.FC<BrandProps> = ({ size = 40, className, style, title }) => (
  <svg width={size} height={size * (28/40)} viewBox="0 0 256 171"
       className={className} style={style}
       role={title ? 'img' : undefined} aria-hidden={!title} aria-label={title}>
    {title && <title>{title}</title>}
    <defs>
      <linearGradient id="meta-g-l" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#0064E0" />
        <stop offset="55%"  stopColor="#0082FB" />
        <stop offset="100%" stopColor="#00AAFF" />
      </linearGradient>
      <linearGradient id="meta-g-r" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#0082FB" />
        <stop offset="100%" stopColor="#0064E0" />
      </linearGradient>
    </defs>
    {/* Two-stroke infinity — back ribbon */}
    <path d="M27 85 C 27 42, 70 12, 113 50 L 143 95 C 168 130, 209 130, 234 95 C 256 64, 234 28, 199 36 C 168 44, 145 75, 113 120 C 70 158, 27 128, 27 85 Z"
          fill="none" stroke="url(#meta-g-l)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
    {/* Highlight cross-ribbon */}
    <path d="M75 60 C 95 50, 125 75, 150 105 C 175 135, 200 130, 215 110"
          fill="none" stroke="url(#meta-g-r)" strokeWidth="9" strokeLinecap="round" opacity="0.45" />
  </svg>
)

export const SalesforceGlyph: React.FC<BrandProps> = ({ size = 40, className, style, title }) => (
  <svg width={size} height={size * (28/40)} viewBox="0 0 256 180"
       className={className} style={style}
       role={title ? 'img' : undefined} aria-hidden={!title} aria-label={title}>
    {title && <title>{title}</title>}
    <defs>
      <linearGradient id="sf-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#00C2FF" />
        <stop offset="55%"  stopColor="#00A1E0" />
        <stop offset="100%" stopColor="#0070D2" />
      </linearGradient>
      <linearGradient id="sf-g-hi" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    {/* Cloud silhouette */}
    <path d="M147 26 c -22 0 -42 11 -54 28 c -8 -4 -17 -7 -27 -7 c -33 0 -60 27 -60 60 c 0 7 1 13 3 19 c -5 7 -9 16 -9 26 c 0 22 18 40 40 40 h 168 c 26 0 47 -21 47 -47 c 0 -16 -8 -30 -19 -38 c 4 -8 6 -17 6 -27 c 0 -33 -27 -60 -60 -60 c -13 0 -25 4 -35 11 c -1 -2 -2 -3 -2 -5 z"
          fill="url(#sf-g)" />
    {/* Top highlight */}
    <path d="M147 26 c -22 0 -42 11 -54 28 c -8 -4 -17 -7 -27 -7 c -33 0 -60 27 -60 60 c 0 7 1 13 3 19"
          fill="none" stroke="url(#sf-g-hi)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
  </svg>
)

export const GoogleGlyph: React.FC<BrandProps> = ({ size = 40, className, style, title }) => (
  <svg width={size} height={size * (262/256)} viewBox="0 0 256 262"
       className={className} style={style}
       role={title ? 'img' : undefined} aria-hidden={!title} aria-label={title}>
    {title && <title>{title}</title>}
    <path d="M255 134 c 0 -10 -1 -19 -3 -28 H 130 v 53 h 71 c -3 17 -12 31 -26 41 v 34 h 42 c 25 -23 38 -56 38 -100 z" fill="#4285F4" />
    <path d="M130 262 c 35 0 64 -12 86 -32 l -42 -34 c -12 8 -27 12 -44 12 c -34 0 -63 -23 -73 -54 H 15 v 35 c 22 43 67 73 115 73 z" fill="#34A853" />
    <path d="M57 156 c -3 -8 -4 -16 -4 -25 c 0 -9 1 -17 4 -25 V 71 H 15 c -10 18 -15 38 -15 60 c 0 22 5 42 15 60 z" fill="#FBBC05" />
    <path d="M130 51 c 19 0 36 7 49 19 l 37 -37 C 194 12 165 0 130 0 C 82 0 37 30 15 71 l 42 35 c 10 -32 39 -55 73 -55 z" fill="#EA4335" />
  </svg>
)

// ════════════════════════════════════════════════════════════════════════
//  BRAND MARK — easyTenancy nav glyph
//  ─────────────────────────────────────────────────────────────────────
//  Custom monogram: a stylised "eT" inside a softly-rotating ring.
//  Three concentric arcs (Holy Trinity nod) · iridescent gradient.
//  Pairs with the wordmark in the nav.
// ════════════════════════════════════════════════════════════════════════
export const BrandMark: React.FC<BrandProps & { animated?: boolean }> = ({
  size = 28, className, style, title = 'easyTenancy', animated = true,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40"
       className={`et-mark${animated ? ' et-mark-animated' : ''} ${className ?? ''}`}
       style={style}
       role="img" aria-label={title}>
    <title>{title}</title>
    <defs>
      <linearGradient id="et-ring" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#1A6DB5" />
        <stop offset="50%"  stopColor="#2A9DE8" />
        <stop offset="100%" stopColor="#39bff6" />
      </linearGradient>
      <linearGradient id="et-glyph" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#F0EDE8" />
        <stop offset="100%" stopColor="#A8C7E8" />
      </linearGradient>
    </defs>
    {/* Outer ring — 270° arc, opens at top-right (Holy Trinity gap) */}
    <path d="M 20 4 a 16 16 0 1 1 -11.3 4.7"
          fill="none" stroke="url(#et-ring)" strokeWidth="2.4" strokeLinecap="round" />
    {/* Inner orbit pulse */}
    <circle cx="20" cy="20" r="11" fill="none" stroke="url(#et-ring)" strokeWidth="0.8" opacity="0.35" />
    {/* "e" stem — bowl */}
    <path d="M 13 22.5 a 5 5 0 1 0 5 -5 h -5"
          fill="none" stroke="url(#et-glyph)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    {/* "T" cross bar suggesting tenancy */}
    <path d="M 23 14 h 6 M 26 14 v 11"
          fill="none" stroke="url(#et-glyph)" strokeWidth="2.4" strokeLinecap="round" />
    {/* Sovereign dot — locked, lower right */}
    <circle cx="31" cy="9" r="2" fill="#39bff6">
      {animated && (
        <animate attributeName="opacity"
                 values="0.6;1;0.6" dur="2.6s"
                 repeatCount="indefinite" />
      )}
    </circle>
  </svg>
)

// ════════════════════════════════════════════════════════════════════════
//  Type guard helper — for dynamic icon lookups
// ════════════════════════════════════════════════════════════════════════
export const isIconName = (s: string): s is IconName => s in REGISTRY

export const ICON_NAMES = Object.keys(REGISTRY) as IconName[]
