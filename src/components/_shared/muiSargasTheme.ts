import { createTheme } from '@mui/material/styles'

/**
 * Small MUI theme override used by legacy forms that rely on
 * `color="primary"` / `primary.main`. Aligns MUI's primary blue with
 * the Sargas Analytics token `T.primary` (rgba(3, 105, 161, 1)) so
 * checkboxes, chips, buttons, focus rings etc. render in our blue
 * without having to touch every inline `sx`.
 */
export const muiSargasTheme = createTheme({
	palette: {
		primary: {
			main: 'rgb(3, 105, 161)',
			light: 'rgb(56, 189, 248)',
			dark: 'rgb(2, 124, 192)',
			contrastText: '#ffffff',
		},
	},
	shape: {
		borderRadius: 12,
	},
})
