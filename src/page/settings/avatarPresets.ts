/**
 * Mirror of the backend's `avatar-presets.ts` catalog. Both lists must
 * agree so the UI can lay out the gallery while the server validates
 * the chosen ID.
 */
export type AvatarGender = 'male' | 'female'

export interface AvatarPreset {
	id: string
	seed: string
	gender: AvatarGender
}

export const AVATAR_PRESETS: AvatarPreset[] = [
	// Male — 20 avatars across European, Asian, Middle Eastern,
	// African, Latin and Pacific/Indigenous name origins.
	{ id: 'm1', seed: 'Oliver', gender: 'male' },
	{ id: 'm2', seed: 'Lars', gender: 'male' },
	{ id: 'm3', seed: 'Dmitri', gender: 'male' },
	{ id: 'm4', seed: 'Mikhail', gender: 'male' },
	{ id: 'm5', seed: 'Kenji', gender: 'male' },
	{ id: 'm6', seed: 'Minho', gender: 'male' },
	{ id: 'm7', seed: 'WeiChen', gender: 'male' },
	{ id: 'm8', seed: 'HiroshiTan', gender: 'male' },
	{ id: 'm9', seed: 'ArjunPatel', gender: 'male' },
	{ id: 'm10', seed: 'RajeshKumar', gender: 'male' },
	{ id: 'm11', seed: 'OmarHassan', gender: 'male' },
	{ id: 'm12', seed: 'YoussefAmir', gender: 'male' },
	{ id: 'm13', seed: 'KwameAdjei', gender: 'male' },
	{ id: 'm14', seed: 'JabariOkafor', gender: 'male' },
	{ id: 'm15', seed: 'TundeAyoola', gender: 'male' },
	{ id: 'm16', seed: 'DiegoMoreno', gender: 'male' },
	{ id: 'm17', seed: 'MateoRivera', gender: 'male' },
	{ id: 'm18', seed: 'RafaelCruz', gender: 'male' },
	{ id: 'm19', seed: 'TaneMoana', gender: 'male' },
	{ id: 'm20', seed: 'KaiNoa', gender: 'male' },

	// Female — 20 avatars across the same origin groups.
	{ id: 'f1', seed: 'EmmaSvensson', gender: 'female' },
	{ id: 'f2', seed: 'ZofiaKowalska', gender: 'female' },
	{ id: 'f3', seed: 'ElenaRossi', gender: 'female' },
	{ id: 'f4', seed: 'FrejaIngrid', gender: 'female' },
	{ id: 'f5', seed: 'MeiLin', gender: 'female' },
	{ id: 'f6', seed: 'YukiTanaka', gender: 'female' },
	{ id: 'f7', seed: 'HyunjiPark', gender: 'female' },
	{ id: 'f8', seed: 'ThaoNguyen', gender: 'female' },
	{ id: 'f9', seed: 'PriyaSharma', gender: 'female' },
	{ id: 'f10', seed: 'AnikaDesai', gender: 'female' },
	{ id: 'f11', seed: 'LaylaKarim', gender: 'female' },
	{ id: 'f12', seed: 'YasminAmira', gender: 'female' },
	{ id: 'f13', seed: 'AmaraNia', gender: 'female' },
	{ id: 'f14', seed: 'ZuriImani', gender: 'female' },
	{ id: 'f15', seed: 'KelechiAdaora', gender: 'female' },
	{ id: 'f16', seed: 'CamilaSofia', gender: 'female' },
	{ id: 'f17', seed: 'IsabelaLucia', gender: 'female' },
	{ id: 'f18', seed: 'ValentinaRose', gender: 'female' },
	{ id: 'f19', seed: 'MoanaKaleaIna', gender: 'female' },
	{ id: 'f20', seed: 'ArohaHinemoa', gender: 'female' },
]

export const AVATAR_STYLE = 'avataaars'

/**
 * `micah` style doesn't take a gender param, so male seeds often
 * render as female and vice versa. `avataaars` lets us lock the
 * hair/top pool per gender while the seed still drives everything
 * else (skin tone, clothes, mouth, accessories), so each preset
 * stays unique.
 */
const MALE_TOP_POOL = [
	'shortCurly',
	'shortFlat',
	'shortRound',
	'shortWaved',
	'sides',
	'theCaesar',
	'theCaesarAndSidePart',
	'dreads01',
	'dreads02',
	'frizzle',
]

const FEMALE_TOP_POOL = [
	'bigHair',
	'bob',
	'bun',
	'curly',
	'curvy',
	'dreads',
	'frida',
	'fro',
	'froBand',
	'longButNotTooLong',
	'miaWallace',
	'straight01',
	'straight02',
	'straightAndStrand',
]

export const avatarUrlFor = (preset: AvatarPreset): string => {
	// DiceBear v9 avataaars accepts comma-separated option lists;
	// URLSearchParams would percent-encode the commas and break the
	// randomization, so we build the query string manually.
	const parts: string[] = [`seed=${encodeURIComponent(preset.seed)}`]
	if (preset.gender === 'male') {
		parts.push(`top=${MALE_TOP_POOL.join(',')}`)
	} else {
		parts.push(`top=${FEMALE_TOP_POOL.join(',')}`)
		parts.push('facialHairProbability=0')
	}
	return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?${parts.join('&')}`
}
