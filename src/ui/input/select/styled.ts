import styled from 'styled-components'
import genColorShades from '../../../utils/genColorShades'
import { Input, InputWrapper } from '../text-field/styled'

const StyledSelectWrapper = styled(InputWrapper)<{ width?: string; containerWidth?: string }>`
    position: relative;
    width: ${({ containerWidth }) => (containerWidth ? containerWidth : 'auto')};
    min-width: 0px;//${({ containerWidth }) => containerWidth || '100%'};
    cursor: pointer;

    & .select-status-arrow {
        position: absolute;
        top: 50%;
        right: ${({ sizes }) => (sizes === 'small' ? 3 : 10)}px;
        font-size: ${({ sizes }) => (sizes === 'small' ? 25 : 30)}px;
        opacity: 0.6;
        pointer-events: none;
    }

    & .rotateDown {
        transform: translateY(-50%) rotate(0deg);
        transition: transform 0.3s ease;
    }

    & .rotateUp {
        transform: translateY(-50%) rotate(-180deg);
        transition: transform 0.2s ease;
    }

    & .select-list-container {
        position: absolute;
        background: ${({ theme }) => theme.mode.foreground};
        min-width: ${({ width }) => (width ? width : '100px')};
        border-radius: 6px;
        box-shadow: ${({ theme }) => (theme.mode.name === 'dark' ? '#0f10146e' : '#dddddd73')} 0px 3px 7px 1px;
        top: 100%;
        left:0;
        padding: 2px 0;
        transform: scale(.9);
        filter: blur(1px);
        pointer-events:none;
        visibility: hidden;
        transtion: all 0.2s linear;
        overflow: hidden;
        z-index: 1500;
    }

    & .show-select-item {
        visibility: visible;
        transform: scale(1);
        filter:blur(0);
        pointer-events:auto;
        transition: all .2s linear;
    }

    .select-option-item {
        position: relative;
        padding: ${({ sizes }) => (sizes === 'small' ? '6px' : '8px')} 12px;
        cursor: pointer;
        text-transform: capitalize;
        z-index: 2;
    }

    .select-option-item:hover {
        background: ${({ theme }) => (theme.mode.name === 'dark' ? '#ffffff1c' : '#9393931c')};
    }

    .selected-item {
        background: ${({ theme }) => genColorShades(theme.primaryColor.color, { total: 1, intensity: 2 })};
    }

}`
/* Dropdown list rendered through a portal (outside the wrapper), so
   its open animation must live on the element itself. */
export const StyledPortalList = styled.ul`
	border-radius: 8px;
	padding: 4px 0;
	margin: 0;
	list-style: none;
	overflow: hidden auto;
	max-height: 300px;
	transform-origin: top center;
	animation: selectPopIn 160ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@keyframes selectPopIn {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
`

export const StyledSelectButton = styled(Input)<{ width?: string }>`
	height: ${({ sizes }) => (sizes === 'small' ? '46px' : '56px')};
	width: ${({ width }) => (width ? width : '100%')};
	text-transform: capitalize;
	cursor: pointer;
`
export default StyledSelectWrapper
