export type Log = {
    timestamp: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

export type PingURLDatabase = {
    // Required attributes
    url: string;
    userId: string; 
    isEnabled: boolean;
    successCount: number;
    
    // Optional attributes
    name?: string;
    description?: string; 
    lastPingTime?: string | null;
    lastPingStatus?: string;
    lastPingStatusCode?: number | null;
    lastResponseTime?: number;
    totalPings?: number;  
    logs?: string;              // JSON string in database
    nodeId?: string;
    pingInterval?: number;      // Default: 15
    nextPingTime?: string | null;
    shardKey?: number;          // Default: 0
    lastError?: string;
    
    // Appwrite system fields
    $id?: string;
    $createdAt?: string;
    $updatedAt?: string;
};

// Application representation - what your React/Svelte components use
export type PingURL = Omit<PingURLDatabase, 'logs'> & {
    id?: string;           // Alias for $id (easier to work with)
    logs: Log[];          // Array of log objects in application
};

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

export interface ScheduledWebhook {
    id?: string;
    userId: string;
    url: string;
    name?: string;
    description?: string;
    method?: string;
    payload?: string;
    headers?: string;
    scheduledTime: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    retries?: number;
    maxRetries?: number;
    lastAttempt?: string;
    lastError?: string;
    responseStatus?: number;
    responseTime?: number;
    priority?: number;
    logs?: string;
    $createdAt?: string;
    $updatedAt?: string;
}