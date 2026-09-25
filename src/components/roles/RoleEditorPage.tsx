import { FC, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckOutlined, CloseOutlined, LockOutlined } from '@mui/icons-material'
import { Button } from '../../ui'
import {
	ACTIONS,
	RESOURCES,
	allPermissions,
	buildPermission,
} from '../../store/roles/types'
import { useRoles } from '../../store/roles/rolesMockStore'
import RolePermissionsMatrix from './RolePermissionsMatrix'
import RoleBadge from './RoleBadge'
import { useToast } from './Toast'
import {
	Crumbs,
	EditorHead,
	LockedBanner,
	ShellCard,
	ShellInner,
	Toolbar,
	ViewFade,
} from './roles.styled'

const plural = (n: number, singular: string, plural: string) =>
	n === 1 ? singular : plural

const RoleEditorPage: FC = () => {
	const navigate = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { getRole, saveRolePermissions } = useRoles()
	const { push } = useToast()

	const role = id ? getRole(id) : undefined
	const [working, setWorking] = useState<Set<string>>(new Set())

	useEffect(() => {
		if (role) setWorking(new Set(role.permissions))
	}, [role?.id])

	const goList = () => navigate('/roles')

	if (!role) {
		return (
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<button className='link' onClick={goList} type='button'>
								Roles &amp; Access
							</button>
							<span className='sep'>/</span>
							<span className='current'>Not found</span>
						</Crumbs>
						<div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.6 }}>
							Role not found.{' '}
							<Button varient='text' onClick={goList}>
								Back to list
							</Button>
						</div>
					</ShellInner>
				</ShellCard>
			</ViewFade>
		)
	}

	const original = role.permissions

	const { added, removed } = useMemo(() => {
		let a = 0
		let r = 0
		working.forEach((p) => {
			if (!original.has(p)) a++
		})
		original.forEach((p) => {
			if (!working.has(p)) r++
		})
		return { added: a, removed: r }
	}, [working, original])

	const dirty = added > 0 || removed > 0

	const togglePerm = (p: string) => {
		setWorking((prev) => {
			const next = new Set(prev)
			if (next.has(p)) next.delete(p)
			else next.add(p)
			return next
		})
	}

	const toggleRow = (resKey: string) => {
		setWorking((prev) => {
			const next = new Set(prev)
			const all = ACTIONS.every((a) => next.has(buildPermission(resKey, a)))
			ACTIONS.forEach((a) => {
				const p = buildPermission(resKey, a)
				if (all) next.delete(p)
				else next.add(p)
			})
			return next
		})
	}

	const toggleColumn = (action: string) => {
		setWorking((prev) => {
			const next = new Set(prev)
			const all = RESOURCES.every((r) => next.has(`${r.key}:${action}`))
			RESOURCES.forEach((r) => {
				const p = `${r.key}:${action}`
				if (all) next.delete(p)
				else next.add(p)
			})
			return next
		})
	}

	const setAll = (on: boolean) => {
		setWorking(on ? allPermissions() : new Set())
	}

	const save = () => {
		saveRolePermissions(role.id, working)
		push('Saved')
	}

	const cancel = () => {
		if (dirty) {
			setWorking(new Set(role.permissions))
			return
		}
		goList()
	}

	const locked = !!role.locked
	const meta = `${role.description} · ${role.userIds.length} ${plural(role.userIds.length, 'user', 'users')}`

	return (
		<ViewFade>
			<ShellCard>
				<ShellInner>
					<Crumbs>
						<button className='link' onClick={goList} type='button'>
							Roles &amp; Access
						</button>
						<span className='sep'>/</span>
						<span className='current'>{role.name}</span>
					</Crumbs>

					<EditorHead>
						<div className='role-title'>
							<div>
								<h1>{role.name}</h1>
								<p className='role-title-meta'>{meta}</p>
							</div>
							<RoleBadge type={role.type} />
						</div>
						<div className='save-cluster'>
							<span className='diff'>
								<span className='plus'>+{added}</span>
								<span className='minus'>-{removed}</span>
							</span>
							<Button varient='outlined' onClick={cancel}>
								{dirty ? 'Discard' : 'Back'}
							</Button>
							<Button disabled={locked || !dirty} onClick={save}>
								Save
							</Button>
						</div>
					</EditorHead>

					{locked && (
						<LockedBanner>
							<LockOutlined />
							<p>
								<strong>Owner</strong> is a system role. Permissions are fixed and always
								include everything. This role cannot be edited or restricted, so nobody
								locks themselves out by accident.
							</p>
						</LockedBanner>
					)}

					<Toolbar>
						<div className='left'>
							<Button varient='text' onClick={() => setAll(true)} disabled={locked}>
								<CheckOutlined fontSize='small' /> All
							</Button>
							<Button varient='text' onClick={() => setAll(false)} disabled={locked}>
								<CloseOutlined fontSize='small' /> None
							</Button>
						</div>
						<span className='hint'>
							Click a column header to toggle the whole column. Click a resource name to
							toggle the whole row.
						</span>
					</Toolbar>

					<RolePermissionsMatrix
						permissions={working}
						disabled={locked}
						onToggle={togglePerm}
						onToggleRow={toggleRow}
						onToggleColumn={toggleColumn}
					/>
				</ShellInner>
			</ShellCard>
		</ViewFade>
	)
}

export default RoleEditorPage
