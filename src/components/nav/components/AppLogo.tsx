import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Logo from '../../../assets/logo.png'

const AppLogo = () => (
	<StyledLink to='/dashboards/sales'>
		<IconSlot>
			<StyledLogo src={Logo} alt='app logo' />
		</IconSlot>
		<LogoText className='app-text-logo'>Sargas</LogoText>
	</StyledLink>
)
export default AppLogo

const StyledLink = styled(Link)`
	display: flex;
	align-items: center;
	gap: 14px;
	text-decoration: none;
`

const IconSlot = styled('span')`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
`

const StyledLogo = styled('img')`
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
`

const LogoText = styled('span')`
	font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
	font-size: 32px;
	font-weight: 400;
	line-height: 1;
	letter-spacing: 3px;
	text-transform: uppercase;
	color: #252d3a;
`
