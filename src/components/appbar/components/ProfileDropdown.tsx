import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Avatar,
	Box,
	Divider,
	Menu,
	MenuItem,
	Typography,
} from '@mui/material'
import {
	ExitToApp,
	KeyboardArrowDownRounded,
	SettingsOutlined,
} from '@mui/icons-material'
import john from '../../../image/humans/3.png'
import useLogout from '../../../hooks/useLogout'

const ProfileDropdown = () => {
	const navigate = useNavigate()
	const logout = useLogout()
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const open = Boolean(anchorEl)

	return (
		<>
			<Box
				onClick={(e) => setAnchorEl(e.currentTarget)}
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					cursor: 'pointer',
					p: '6px 10px 6px 6px',
					borderRadius: '999px',
					background: '#fff',
					border: '1px solid #e7e7e7',
					transition: 'all .2s ease'
				}}
			>
				<Avatar src={john} alt="John Doe" sx={{ width: 36, height: 36 }} />
				<KeyboardArrowDownRounded sx={{ color: '#555' }} />
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				disableAutoFocusItem
				slotProps={{
					paper: {
						sx: {
							mt: 1.5,
							width: 320,
							borderRadius: '28px',
							overflow: 'hidden',
							backgroundColor: '#fff',
							boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
							border: '1px solid rgba(15, 23, 42, 0.06)',
						},
					},
					list: {
						sx: {
							p: 0,
						},
					},
				}}
			>
				<Box sx={{ px: 3, pt: 3, pb: 2.25 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
						<Avatar
							src={john}
							alt="John Doe"
							sx={{ width: 58, height: 58 }}
						/>

						<Box>
							<Typography
								sx={{
									fontSize: 18,
									fontWeight: 700,
									lineHeight: 1.2,
									color: '#202124',
								}}
							>
								John Doe
							</Typography>

							<Typography
								sx={{
									fontSize: 14,
									fontWeight: 400,
									lineHeight: 1.3,
									color: '#8a8a8a',
									mt: 0.25,
								}}
							>
								Administrator
							</Typography>
						</Box>
					</Box>
				</Box>

				<Divider sx={{ borderColor: '#ececec' }} />

				<Box sx={{ px: 2, py: 1.5 }}>
					<MenuItem
						onClick={() => {
							setAnchorEl(null)
							navigate('/settings')
						}}
						sx={{
							borderRadius: '16px',
							px: 1.75,
							py: 1.2,
							gap: 1.5,
							minHeight: 48,
							transition: 'background 140ms ease',
							'&:hover': {
								background: '#f6f8fb',
							},
						}}
					>
						<SettingsOutlined sx={{ fontSize: 22, color: '#2f80ed' }} />
						<Typography
							sx={{
								fontSize: 16,
								fontWeight: 600,
								lineHeight: 1.2,
								color: '#202124',
							}}
						>
							Settings
						</Typography>
					</MenuItem>

					<MenuItem
						onClick={() => {
							setAnchorEl(null)
							logout()
						}}
						sx={{
							borderRadius: '16px',
							px: 1.75,
							py: 1.2,
							gap: 1.5,
							minHeight: 48,
							mt: 0.5,
							transition: 'background 140ms ease',
							'&:hover': {
								background: '#fff5f5',
							},
						}}
					>
						<ExitToApp sx={{ fontSize: 22, color: '#d93939' }} />
						<Typography
							sx={{
								fontSize: 16,
								fontWeight: 600,
								lineHeight: 1.2,
								color: '#d93939',
							}}
						>
							Logout
						</Typography>
					</MenuItem>
				</Box>
			</Menu>
		</>
	)
}

export default ProfileDropdown