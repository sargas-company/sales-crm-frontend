import styled from 'styled-components'

/**
 * Unifies visual metrics of TextField + Select inside one filter row:
 * same height, same placeholder/label color, same font-size, same border radius.
 */
export const PromptFilterRow = styled('div')`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	row-gap: 12px;
	width: 100%;

	/* Every direct child is a control slot; they share a common flex-basis */
	& > .filter-slot {
		flex: 1 1 220px;
		min-width: 200px;
		max-width: 260px;
		display: flex;
	}
	/* Every slot's direct child (TextField wrapper or Select wrapper) fills the slot */
	& > .filter-slot > * {
		width: 100% !important;
		min-width: 100% !important;
		flex: 1 1 auto;
	}

	/* --- unify heights --- */
	& input,
	& [role='select'],
	& .select-button {
		height: 44px !important;
		min-height: 44px !important;
		box-sizing: border-box;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
		display: flex;
		align-items: center;
	}

	/* --- unify font look inside the control --- */
	& input,
	& .select-button {
		font-size: 14px !important;
		font-weight: 500 !important;
		letter-spacing: 0.1px !important;
	}

	/* Placeholder in the TextField — align color, size and weight to Select label */
	& input::placeholder {
		color: #9e9e9e !important;
		opacity: 1 !important;
		font-size: 14px !important;
		font-weight: 400 !important;
		letter-spacing: 0.1px !important;
	}

	/* Select floating label — match placeholder color/size when not floated */
	& .select-label {
		font-size: 14px !important;
		font-weight: 400 !important;
		letter-spacing: 0.1px !important;
		color: #9e9e9e !important;
	}

	/* Once floated to the top (control has value or is focused) — smaller, primary color */
	& .select-label.floating-label-top {
		font-size: 12px !important;
		font-weight: 500 !important;
	}

	/* Consistent border radius */
	& input,
	& .select-button {
		border-radius: 10px !important;
	}

	/* Dropdown arrow — nudge it to align vertically with the reduced height */
	& .select-status-arrow {
		top: 50% !important;
		transform: translateY(-50%) !important;
	}
	& .select-status-arrow.rotateUp {
		transform: translateY(-50%) rotate(-180deg) !important;
	}
`
