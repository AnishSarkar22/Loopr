export type Log = {
    timestamp: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};