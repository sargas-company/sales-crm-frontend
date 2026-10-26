import { FC, ReactNode } from 'react'
import styled from 'styled-components'

import { UploadTray } from '../../page/file-manager/UploadTray'

const AppLayout: FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<Container>
			{children}
			{/* Global upload tray — lives at the layout level so FABs and
			 *  the active queue survive route changes (user starts an
			 *  upload on File Manager, navigates to Clients, still sees
			 *  the circles in the bottom-right corner). */}
			<UploadTray />
		</Container>
	)
}
export default AppLayout

const Container = styled('main')`
	height: 100%;
	display: flex;
`
