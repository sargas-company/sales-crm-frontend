import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		plugins: [react()],
		server: {
			/* Accept requests from the files.localhost subdomain used by
			 * the File Manager Portal in local dev. Browsers resolve
			 * `*.localhost` to 127.0.0.1 automatically, no hosts file
			 * edits needed. */
			host: true,
			allowedHosts: ['localhost', 'files.localhost', '.localhost'],
			proxy: {
				'/api': {
					target: env.VITE_API_URL || 'http://localhost:3000',
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ''),
				},
			},
		},
		build: {
			rollupOptions: {
				output: {
					chunkFileNames: 'assets/js/[name]-[hash].js',
					entryFileNames: 'assets/js/[name]-[hash].js',

					assetFileNames: ({ name }) => {
						if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
							return 'assets/images/[name][extname]'
						}

						if (/\.css$/.test(name ?? '')) {
							return 'assets/css/[name]-[hash][extname]'
						}

						// default value
						// ref: https://rollupjs.org/guide/en/#outputassetfilenames
						return 'assets/[name]-[hash][extname]'
					},
				},
			},
		},
	}
})
