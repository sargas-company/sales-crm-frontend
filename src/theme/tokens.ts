/**
 * Design tokens for Sargas CRM UI.
 *
 * Static tokens live at module scope. Mode-dependent tokens (bg,
 * surface, text) and accent-dependent tokens are produced by
 * `buildTheme(mode, accent)` — the same runtime values that
 * `ThemeContext` already tracks. Nothing here changes visual output
 * on its own; new components opt in by reading
 * `theme.colors.bg.surface` etc.
 *
 * Note: existing styled components pass a legacy inline theme
 * shaped as `{ primaryColor, mode, skin, name, color }`. To keep
 * those callsites compiling during migration, `AppTheme` declares
 * those keys as optional unknowns. New code should NOT read them —
 * use the token paths (`theme.colors`, `theme.typography`, …).
 */

export type ThemeModeName = 'light' | 'dark'

// ─── Raw palette ──────────────────────────────────────────────────
// Preserves the current identity. Do not reference these values
// directly outside this file — go through the semantic tokens below.
const palette = {
	lavender: '#f8f5ff',
	surface: '#fffffd',
	inkPrimary: '#3a3541de',
	inkSecondary: '#3a354199',
	inkDisabled: '#3a35415c',
	borderDefault: '#3a35411f',
	borderSubtle: '#3a354114',
	darkCanvas: '#1B2430',
	darkSurface: '#252d3a',
	darkInk: '#d3d3d3',
	darkBorder: '#d3d3d326',
	accentDefault: 'rgba(3, 105, 161, 1)',
	statusSuccess: 'rgba(60, 207, 78, 1)',
	statusWarning: 'rgba(255, 91, 0, 1)',
	statusDanger: 'rgba(253, 93, 93, 1)',
	statusInfo: 'rgba(3, 105, 161, 1)',
} as const

// ─── Static tokens ────────────────────────────────────────────────

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48,
} as const

export const radius = {
	sm: 6,
	md: 8,
	lg: 12,
	pill: 999,
} as const

export const shadow = {
	sm: '0 1px 2px rgba(58, 53, 65, 0.08)',
	md: '0 4px 12px rgba(58, 53, 65, 0.10)',
	lg: '0 12px 32px rgba(58, 53, 65, 0.14)',
} as const

export const breakpoint = {
	sm: 600,
	md: 900,
	lg: 1200,
	xlg: 1536,
} as const

export const zIndex = {
	base: 0,
	dropdown: 100,
	sticky: 200,
	overlay: 900,
	modal: 1000,
	toast: 1100,
} as const

const uiFamily = "'Inter Variable', 'Inter', system-ui, sans-serif"

// Numerical values mirror the legacy scale currently present in
// `src/global.css` (h1..h6 + body1/2 + subtitle1/2 + caption +
// overline) so token consumers and existing markup produce the same
// visual sizes. Role names differ from legacy CSS class names on
// purpose (spec §1 keys). When `<Text varient=…>` and bare `<h1>`
// tags migrate away from those classes, the CSS classes in
// `global.css` will be dropped and this file becomes the sole source.
export const typography = {
	display: {
		fontFamily: uiFamily,
		fontSize: '32px',
		lineHeight: '40px',
		letterSpacing: '-0.4px',
		fontWeight: 700,
	},
	h1: {
		fontFamily: uiFamily,
		fontSize: '26px',
		lineHeight: '34px',
		letterSpacing: '-0.3px',
		fontWeight: 600,
	},
	h2: {
		fontFamily: uiFamily,
		fontSize: '22px',
		lineHeight: '30px',
		letterSpacing: '-0.2px',
		fontWeight: 600,
	},
	h3: {
		fontFamily: uiFamily,
		fontSize: '18px',
		lineHeight: '26px',
		letterSpacing: '-0.1px',
		fontWeight: 600,
	},
	h4: {
		fontFamily: uiFamily,
		fontSize: '16px',
		lineHeight: '24px',
		letterSpacing: '0px',
		fontWeight: 600,
	},
	bodyLg: {
		fontFamily: uiFamily,
		fontSize: '15px',
		lineHeight: '22px',
		letterSpacing: '0px',
		fontWeight: 500,
	},
	body: {
		fontFamily: uiFamily,
		fontSize: '14px',
		lineHeight: '22px',
		letterSpacing: '0px',
		fontWeight: 400,
	},
	bodySm: {
		fontFamily: uiFamily,
		fontSize: '13px',
		lineHeight: '20px',
		letterSpacing: '0px',
		fontWeight: 400,
	},
	caption: {
		fontFamily: uiFamily,
		fontSize: '12px',
		lineHeight: '16px',
		letterSpacing: '0.2px',
		fontWeight: 400,
	},
	overline: {
		fontFamily: uiFamily,
		fontSize: '11px',
		lineHeight: '16px',
		letterSpacing: '0.6px',
		fontWeight: 600,
	},
	numeric: {
		fontFamily: uiFamily,
		fontSize: '14px',
		lineHeight: '22px',
		letterSpacing: '0px',
		fontWeight: 500,
	},
} as const

const chartCategorical = [
	'#ef4444',
	'#f59e0b',
	'#3b82f6',
	'#6366f1',
	'#10b981',
	'#a855f7',
	'#0ea5e9',
	'#f97316',
] as const

// ─── Mode-dependent semantic tokens ───────────────────────────────

interface ModeColors {
	bg: { canvas: string; surface: string; surfaceSubtle: string }
	text: { primary: string; secondary: string; disabled: string }
	border: { default: string; subtle: string }
}

const lightColors: ModeColors = {
	bg: { canvas: palette.lavender, surface: palette.surface, surfaceSubtle: '#f4f0fa' },
	text: {
		primary: palette.inkPrimary,
		secondary: palette.inkSecondary,
		disabled: palette.inkDisabled,
	},
	border: { default: palette.borderDefault, subtle: palette.borderSubtle },
}

const darkColors: ModeColors = {
	bg: { canvas: palette.darkCanvas, surface: palette.darkSurface, surfaceSubtle: '#1e2530' },
	text: { primary: palette.darkInk, secondary: '#d3d3d3b3', disabled: '#d3d3d366' },
	border: { default: palette.darkBorder, subtle: '#d3d3d314' },
}

// ─── Public theme shape ────────────────────────────────────────────

export interface AppTheme {
	// New tokens — used by new primitives and future migrations.
	// All optional so that existing styled components which pass an
	// inline legacy theme (e.g. `theme={{primaryColor, mode}}`) still
	// satisfy DefaultTheme during migration. `buildTheme()` always
	// populates them, so new code can safely non-null-assert
	// (e.g. `theme.colors!.bg.surface`) or optional-chain.
	colors?: {
		bg: ModeColors['bg']
		text: ModeColors['text']
		border: ModeColors['border']
		accent: { primary: string; contrast: string }
		status: { success: string; warning: string; danger: string; info: string }
		chart: { categorical: readonly string[]; grid: string; axis: string }
	}
	typography?: typeof typography
	spacing?: typeof spacing
	radius?: typeof radius
	shadow?: typeof shadow
	breakpoint?: typeof breakpoint
	zIndex?: typeof zIndex

	// Legacy inline-theme fields — kept optional during migration so
	// existing `<Styled theme={{primaryColor, mode, skin, name, color}}>`
	// callsites keep compiling. New code should not read these.
	mode?: unknown
	primaryColor?: unknown
	skin?: unknown
	name?: unknown
	color?: unknown
}

export function buildTheme(mode: ThemeModeName, accent: string): AppTheme {
	const modeColors = mode === 'dark' ? darkColors : lightColors
	return {
		colors: {
			bg: modeColors.bg,
			text: modeColors.text,
			border: modeColors.border,
			accent: {
				primary: accent || palette.accentDefault,
				contrast: '#ffffff',
			},
			status: {
				success: palette.statusSuccess,
				warning: palette.statusWarning,
				danger: palette.statusDanger,
				info: palette.statusInfo,
			},
			chart: {
				categorical: chartCategorical,
				grid: mode === 'dark' ? '#ffffff14' : '#3a354114',
				axis: mode === 'dark' ? '#d3d3d380' : '#3a354180',
			},
		},
		typography,
		spacing,
		radius,
		shadow,
		breakpoint,
		zIndex,
	}
}
