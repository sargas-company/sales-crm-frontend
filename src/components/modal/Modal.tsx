/**
 * Legacy re-export. The canonical Modal now lives at
 * `src/ui/overlay/Modal.tsx`. This file is kept so that existing
 * callers under `src/components/**` continue to compile without a
 * mass import update; those imports will migrate to
 * `../../ui/overlay/Modal` as they are touched by future features.
 */
export { default } from '../../ui/overlay/Modal'
