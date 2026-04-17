export type AlertColorType = 'success' | 'info' | 'warning' | 'error';
export type AlertColor = string | Omit<string, AlertColorType>
export interface Colors {
    success: string; info: string; warning: string; error: string
}
export const alertColor: Colors = {
    success: 'rgb(52, 168, 83)',
    info: 'rgb(0, 103, 255)',
    warning: 'rgb(255, 180, 0)',
    error: 'rgb(255, 76, 81)'
}
