export type Log = {
    timestamp: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

//  for cron jobs using appwrite
export type PingURL = {
    id: string;
    url: string;
    userId: string;
    isEnabled: boolean;
    lastPingTime: string;
    lastPingStatus: 'success' | 'error' | '';
    lastPingStatusCode: number;
    successCount: number;
    logs: Log[];
}

export type PingResult = {
    status: number;
    success: boolean;
    timestamp: string;
    url: string;
    responseTime?: number;
};

export type PingFunction = {
    id: string;
    name: string;
    schedule: string;  // Cron expression for scheduling
    isEnabled: boolean;
    lastExecution?: string;
};