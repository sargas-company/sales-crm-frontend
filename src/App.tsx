import './global.css'
import './styles/table/Table.css'
import './styles/modal/Modal.css'

import { useMemo } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'

import useTheme from './theme/useTheme'
import { buildTheme } from './theme/tokens'
import GlobalStyle from './global.styled'
import AppRoutes from './routes/AppRoutes'
import AuthInitializer from './components/auth/AuthInitializer'
import { ToastProvider } from './context/toast/ToastContext'

const App = () => {
	const {
		theme: {
			mode,
			primaryColor: { color },
			skin,
		},
	} = useTheme()

	const tokenTheme = useMemo(() => buildTheme(mode.name, color), [mode.name, color])

	return (
		<StyledThemeProvider theme={tokenTheme}>
			<ToastProvider>
				<GlobalStyle
					textColor={mode.textColor}
					backgroundColor={mode.background}
					foregroundColor={mode.foreground}
					mode={mode.name}
					skinColor={color}
					skin={skin}
				/>
				<AuthInitializer />
				<AppRoutes />
			</ToastProvider>
		</StyledThemeProvider>
	)
}
export default App
