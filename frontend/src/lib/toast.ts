export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

export interface ToastPayload {
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

export const toast = {
    success: (title: string, message?: string) => dispatch('SUCCESS', title, message),
    error: (title: string, message?: string) => dispatch('ERROR', title, message),
    info: (title: string, message?: string) => dispatch('INFO', title, message),
    warning: (title: string, message?: string) => dispatch('WARNING', title, message),
};

function dispatch(type: ToastType, title: string, message?: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<ToastPayload>('show-toast', {
            detail: { type, title, message }
        }));
    }
}
