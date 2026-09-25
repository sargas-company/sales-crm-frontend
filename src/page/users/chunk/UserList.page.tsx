import React from 'react'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import AnimatedCardShell from '../../../components/card/AnimatedCardShell'
import UserListFilter from '../../../components/users/list/UserListFilter'
import UserListTable from '../../../components/users/list/UserListTable'
import { fetchUserListByParams } from '../../../features/users/creator'
import { useAppDispatch } from '../../../hooks'
import { Button, Text, TextField } from '../../../ui'

const UserList = () => {
	const dispatch = useAppDispatch()
	const handleSearch = (eve: React.ChangeEvent<HTMLInputElement>) => {
		setTimeout(() => {
			dispatch(fetchUserListByParams({ q: eve.target.value }))
		}, 500)
	}
	return (
		<>
			<AnimatedCardShell style={{ marginBottom: '1.6rem' }}>
				<Card padding='1.2rem'>
					<Text heading='h6' styles={{ marginBottom: '1rem' }}>
						Search Filters
					</Text>
					<UserListFilter />
				</Card>
			</AnimatedCardShell>
			<AnimatedCardShell>
				<Card className='overflow-hidden'>
				<Box
					display='flex'
					justify='space-between'
					align='center'
					wrap='wrap'
					px={20}
					pb={0}
					pt={24}
					space={0.6}
				>
					<Button varient='outlined'>export</Button>
					<Box display='flex' wrap='wrap' space={1}>
						<TextField
							type='text'
							name='search-user'
							placeholder='Search User'
							sizes='small'
							onChange={handleSearch}
						/>
						<Button>Add User</Button>
					</Box>
				</Box>
				<UserListTable />
				</Card>
			</AnimatedCardShell>
		</>
	)
}
export default UserList
