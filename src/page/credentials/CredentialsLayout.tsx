import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { VpnKeyOutlined } from '@mui/icons-material'
import {
	ListPageShell,
	type Crumb,
} from '../../components/_shared/ListPageShell'

interface PageHeader {
	crumbs: Crumb[]
	icon: ReactNode
	title: string
	subtitle?: string
	action?: ReactNode
	searchPlaceholder?: string
	search?: string
	onSearchChange?: (v: string) => void
	filters?: ReactNode
	/** Max page width — tighter for forms, unrestricted for lists. */
	maxWidth?: number
}

const defaultHeader: PageHeader = {
	crumbs: [{ label: 'Credentials', current: true }],
	icon: <VpnKeyOutlined />,
	title: 'Credentials',
}

interface PageHeaderCtx {
	setHeader: (h: PageHeader) => void
	resetHeader: () => void
}

const PageHeaderContext = createContext<PageHeaderCtx>({
	setHeader: () => undefined,
	resetHeader: () => undefined,
})

/**
 * Call from a child route to install this page's crumbs/title/subtitle/
 * action into the shared ListPageShell chrome. Automatically restores the
 * default when the component unmounts.
 */
export const usePageHeader = (header: PageHeader) => {
	const { setHeader, resetHeader } = useContext(PageHeaderContext)
	const key = JSON.stringify(header.crumbs) + header.title + (header.subtitle ?? '')
	useEffect(() => {
		setHeader(header)
		return () => resetHeader()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key, header.search, header.action])
}

/**
 * Persistent chrome for the credentials section. The ListPageShell
 * mounts once and stays mounted across all `/credentials/*` routes —
 * only the children swap. That eliminates the full-page remount jank
 * when navigating between landing and forms.
 */
const CredentialsLayout = () => {
	const [header, setHeader] = useState<PageHeader>(defaultHeader)

	const ctx = useMemo(
		() => ({
			setHeader,
			resetHeader: () => setHeader(defaultHeader),
		}),
		[],
	)

	return (
		<PageHeaderContext.Provider value={ctx}>
			<WidthContainer $maxWidth={header.maxWidth}>
				<ListPageShell
					crumbs={header.crumbs}
					icon={header.icon}
					title={header.title}
					subtitle={header.subtitle}
					action={header.action}
					searchPlaceholder={header.searchPlaceholder}
					search={header.search}
					onSearchChange={header.onSearchChange}
					filters={header.filters}
				>
					<Outlet />
				</ListPageShell>
			</WidthContainer>
		</PageHeaderContext.Provider>
	)
}

export default CredentialsLayout

const WidthContainer = styled.div<{ $maxWidth?: number }>`
	width: 100%;
	max-width: ${(p) => (p.$maxWidth ? `${p.$maxWidth}px` : 'none')};
	margin: 0 auto;
`
