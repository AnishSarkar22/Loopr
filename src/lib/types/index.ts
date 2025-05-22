export type Log = {
    timestamp: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

// for cron jobs using appwrite
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
    // New fields for performance scaling
    nodeId: string;             // Which worker node handles this URL
    pingInterval: number;       // Minutes between pings
    nextPingTime: string;       // When to ping next
    shardKey: number;           // For distributing load (0-9)
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

// New types for distributed architecture
export type WorkerNode = {
    id: string;
    name: string;
    status: 'online' | 'offline';
    lastHeartbeat: string;
    urlCount: number;
    region?: string;  // Optional geographic region
}

export type ResultShard = {
    userId: string;
    date: string;     // YYYY-MM-DD format
    shardId: string;  // Combined user+date identifier
    results: {
        urlId: string;
        timestamps: string[];
        statuses: number[];
    }[];
}