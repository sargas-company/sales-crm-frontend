import { HelpOutlineOutlined } from '@mui/icons-material'
import ListPageShell from '../../components/_shared/ListPageShell/ListPageShell'
import ArticlesListView from '../../content/_shared/ArticlesListView'

const Help = () => (
	<ListPageShell
		crumbs={[{ label: 'Resources' }, { label: 'Help & FAQ', current: true }]}
		icon={<HelpOutlineOutlined />}
		title='Help & FAQ'
		subtitle='How things work in the CRM — short answers, step-by-step guides, screenshots.'
	>
		<ArticlesListView
			section='help'
			basePath='/help'
			emptyLabel='No help articles are published yet. The first batch will show up here once authored.'
		/>
	</ListPageShell>
)

export default Help
