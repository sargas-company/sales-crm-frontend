import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PortalApp } from './portal/PortalApp'
import { Provider } from 'react-redux'
import store from './store/store'
import { injectStore } from './api/axiosInstance'
import './index.css'

injectStore(store)
import Theme from './theme/Theme'
import { BrowserRouter as Router } from 'react-router-dom'

/* Hostname split — one bundle, two UI "personalities".
 * `files.*` hostname serves the File Manager Portal shell (minimal,
 * Discord OAuth, worker-facing). Everything else serves the main
 * CRM admin app. Backend is shared and distinguishes requests by
 * JWT identity + `isPortalUser` flag. */
const isPortalHost = (() => {
	if (typeof window === 'undefined') return false
	const h = window.location.hostname.toLowerCase()
	return h.startsWith('files.')
})()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Router>
			<Theme>
				<Provider store={store}>
					{isPortalHost ? <PortalApp /> : <App />}
				</Provider>
			</Theme>
		</Router>
	</React.StrictMode>
)
