import styled, { css, keyframes } from 'styled-components'

type Props = {
	size?: number
	/** When true, folder plays the "opening" keyframe: tab lifts,
	 *  sheets fan outward and up, front flap tilts forward. Used by
	 *  the FileManager page to pre-animate before navigating into
	 *  the clicked folder. */
	opening?: boolean
	/** Pass the real file count so we can show up to N visible
	 *  stacked sheets poking out of the folder at rest (max 3). */
	fileCount?: number
}

export const Folder3D = ({ size = 96, opening = false, fileCount = 0 }: Props) => {
	const sheets = Math.max(0, Math.min(3, fileCount))
	return (
		<Wrap
			style={{ width: size, height: size * 0.86 }}
			aria-hidden='true'
			$opening={opening}
		>
			{sheets >= 1 && <RestSheet $i={0} />}
			{sheets >= 2 && <RestSheet $i={1} />}
			{sheets >= 3 && <RestSheet $i={2} />}

			<SheetBack $opening={opening} />
			<SheetMid $opening={opening} />
			<Tab $opening={opening} />
			<Front $opening={opening}>
				<FrontInner />
			</Front>
		</Wrap>
	)
}


/* Keyframes for the "open" transition — each slice gets its own
 * motion so the folder reads as a 3D object cracking open rather
 * than a flat card scaling up. */
const tabLift = keyframes`
	0%   { transform: translateY(0) rotateX(0); }
	100% { transform: translateY(-14%) rotateX(-55deg); }
`
const sheetFanLeft = keyframes`
	0%   { transform: rotate(-3deg) translate(0, 0); opacity: 1; }
	100% { transform: rotate(-18deg) translate(-10%, -24%); opacity: 0.85; }
`
const sheetFanRight = keyframes`
	0%   { transform: rotate(2deg) translate(0, 0); opacity: 1; }
	100% { transform: rotate(16deg) translate(10%, -22%); opacity: 0.85; }
`
const frontTilt = keyframes`
	0%   { transform: rotateX(0) translateY(0); }
	100% { transform: rotateX(28deg) translateY(6%); }
`
const wrapZoom = keyframes`
	0%   { transform: scale(1); }
	100% { transform: scale(1.12); }
`

const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

const Wrap = styled.div<{ $opening: boolean }>`
	position: relative;
	transform-origin: bottom center;
	perspective: 500px;
	transition: transform 320ms ${EASING};
	&:hover {
		transform: translateY(-3px) rotateX(-4deg);
	}
	${({ $opening }) =>
		$opening &&
		css`
			animation: ${wrapZoom} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
		`}
`

const Tab = styled.div<{ $opening: boolean }>`
	position: absolute;
	top: 8%;
	left: 6%;
	width: 42%;
	height: 20%;
	z-index: 4;
	border-radius: 7px 7px 0 0;
	background: linear-gradient(135deg, #6b7280, #4b5563);
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
	transform-origin: bottom center;
	transform: translateY(0) rotateX(0);
	transition: transform 360ms ${EASING};
	${Wrap}:hover & {
		transform: translateY(-6%) rotateX(-20deg);
	}
	${({ $opening }) =>
		$opening &&
		css`
			animation: ${tabLift} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
		`}
`

const SheetBack = styled.div<{ $opening: boolean }>`
	position: absolute;
	top: 24%;
	left: 10%;
	right: 10%;
	bottom: 10%;
	z-index: 1;
	border-radius: 6px;
	transform: rotate(-3deg) translate(0, 0);
	background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 2px 4px rgba(100, 116, 139, 0.3);
	transform-origin: bottom center;
	transition: transform 360ms ${EASING};
	${Wrap}:hover & {
		transform: rotate(-9deg) translate(-4%, -10%);
	}
	${({ $opening }) =>
		$opening &&
		css`
			animation: ${sheetFanLeft} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
		`}
`

const SheetMid = styled.div<{ $opening: boolean }>`
	position: absolute;
	top: 22%;
	left: 14%;
	right: 6%;
	bottom: 12%;
	z-index: 2;
	border-radius: 6px;
	transform: rotate(2deg) translate(0, 0);
	background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 2px 4px rgba(100, 116, 139, 0.3);
	transform-origin: bottom center;
	transition: transform 360ms ${EASING};
	${Wrap}:hover & {
		transform: rotate(8deg) translate(4%, -9%);
	}
	${({ $opening }) =>
		$opening &&
		css`
			animation: ${sheetFanRight} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
		`}
`

const Front = styled.div<{ $opening: boolean }>`
	position: absolute;
	top: 22%;
	left: 4%;
	right: 4%;
	bottom: 2%;
	z-index: 5;
	border-radius: 9px 9px 10px 10px;
	background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
	box-shadow:
		0 12px 24px -8px rgba(55, 65, 81, 0.4),
		inset 0 -2px 6px rgba(0, 0, 0, 0.15);
	transform-origin: bottom center;
	transform: rotateX(0) translateY(0);
	transition: transform 360ms ${EASING};
	${Wrap}:hover & {
		transform: rotateX(10deg) translateY(2%);
	}
	${({ $opening }) =>
		$opening &&
		css`
			animation: ${frontTilt} 420ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
		`}
`

const FrontInner = styled.div`
	position: absolute;
	inset: 2px;
	border-radius: 7px 7px 8px 8px;
	background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%);
	opacity: 0.55;
`

/* Mini "paper" sheets poking out of the top at rest — one per file,
 * capped at 3. Each gets its own slight rotation + offset so they
 * read as a stack. These stay in place on hover (no animation) so
 * the sheets stay visible while the folder opens around them. */
const RestSheet = styled.div<{ $i: number }>`
	position: absolute;
	top: 10%;
	left: 50%;
	width: 56%;
	height: 48%;
	border-radius: 4px 4px 2px 2px;
	background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
	border: 1px solid rgba(15, 23, 42, 0.1);
	box-shadow: 0 2px 4px -1px rgba(15, 23, 42, 0.2);
	transform-origin: bottom center;
	/* Sit above the back/mid sheets inside the folder but strictly
	 * below the Tab (z:4) and Front flap (z:5) so the Front covers
	 * the bottom portion — the papers only peek out above the Tab. */
	z-index: 3;
	${({ $i }) =>
		$i === 0 &&
		`transform: translate(-50%, 0) rotate(-7deg);`}
	${({ $i }) =>
		$i === 1 &&
		`transform: translate(-55%, -4%) rotate(0deg); width: 50%;`}
	${({ $i }) =>
		$i === 2 &&
		`transform: translate(-45%, -2%) rotate(6deg); width: 48%;`}
`
