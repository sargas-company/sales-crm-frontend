import { MenuBookOutlined } from '@mui/icons-material'
import ListPageShell from '../../components/_shared/ListPageShell/ListPageShell'
import ArticlesListView from '../../content/_shared/ArticlesListView'

const Runbook = () => (
	<ListPageShell
		crumbs={[{ label: 'Resources' }, { label: 'Runbook', current: true }]}
		icon={<MenuBookOutlined />}
		title='Runbook'
		subtitle='Operational playbook — deploys, incidents, recovery and daily ops.'
	>
		<ArticlesListView
			section='runbook'
			basePath='/runbook'
			emptyLabel='No runbook entries yet — procedures land here as they are documented.'
		/>
	</ListPageShell>
)

export default Runbook
