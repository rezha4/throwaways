// hooks/use-shared-worker-data.ts
import { useEffect, useState, useCallback, useRef } from "react";

interface DataPoint {
  x: number;
  y: number;
  timestamp?: string;
}

interface ChartData {
  id: string;
  chart_name: string;
  chart_type: "line" | "bar" | "area";
  category: string;
  metadata: {
    color: string;
    unit: string;
    max?: number;
  };
  data_points: DataPoint[];
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  pointCount: number;
  lastUpdated?: string;
}

interface WorkerMessage {
  type: "data" | "error" | "pong";
  data?: ChartData[];
  error?: string;
  timestamp?: number;
  source?: "cache" | "fresh";
  connections?: number;
  cacheStatus?: string;
  lastFetch?: number;
}

interface UseSharedWorkerDataReturn {
  data: ChartData[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  source: "cache" | "fresh" | null;
  connections: number;
  refresh: (force?: boolean) => void;
  getChartById: (id: string) => ChartData | undefined;
  getChartsByCategory: (category: string) => ChartData[];
}

export default function useSharedWorkerData(): UseSharedWorkerDataReturn {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [source, setSource] = useState<"cache" | "fresh" | null>(
    null
  );
  const [connections, setConnections] = useState(0);

  const workerRef = useRef<SharedWorker | null>(null);
  const portRef = useRef<MessagePort | null>(null);
  const reconnectTimeoutRef = useRef<number>(1000);
  const pingIntervalRef = useRef<number>(1000);

  // Initialize SharedWorker with error handling
  const initializeWorker = useCallback(() => {
    try {
      if (workerRef.current) {
        workerRef.current.port.close();
      }

      console.log("Initializing SharedWorker...");
      const worker = new SharedWorker("/shared-worker.js");
      const port = worker.port;

      workerRef.current = worker;
      portRef.current = port;

      port.start();

      port.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;

        switch (message.type) {
          case "data":
            if (message.data) {
              console.log(
                `Received ${message.data.length} charts from ${message.source}`
              );
              setData(message.data);
              setLastUpdated(message.timestamp || Date.now());
              setSource(message.source || null);
              setError(null);
              setLoading(false);
            }
            break;

          case "error":
            console.error("SharedWorker error:", message.error);
            setError(message.error || "Unknown error");
            setLoading(false);
            break;

          case "pong":
            setConnections(message.connections || 0);
            console.log(
              `SharedWorker health check: ${message.connections} connections, cache: ${message.cacheStatus}`
            );
            break;

          default:
            console.warn(
              "Unknown message type from SharedWorker:",
              message.type
            );
        }
      };

      port.onmessageerror = (event) => {
        console.error("SharedWorker message error:", event);
        setError("Communication error with SharedWorker");
      };

      // Handle SharedWorker errors
      worker.onerror = (event) => {
        console.error("SharedWorker error:", event);
        setError("SharedWorker failed to initialize");
        setLoading(false);

        // Retry connection after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect SharedWorker...");
          initializeWorker();
        }, 5000);
      };

      // Request initial data
      port.postMessage({ type: "requestData" });

      // Set up health check ping every 30 seconds
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      pingIntervalRef.current = setInterval(() => {
        if (portRef.current) {
          portRef.current.postMessage({ type: "ping" });
        }
      }, 30000);
    } catch (err) {
      console.error("Failed to initialize SharedWorker:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initialize SharedWorker"
      );
      setLoading(false);
    }
  }, []);

  // Refresh data function
  const refresh = useCallback((force = false) => {
    if (!portRef.current) {
      console.warn("SharedWorker not initialized");
      return;
    }

    console.log(`Requesting data refresh (force: ${force})`);
    setLoading(true);
    setError(null);

    portRef.current.postMessage({
      type: "requestData",
      payload: { force },
    });
  }, []);

  // Helper functions
  const getChartById = useCallback(
    (id: string): ChartData | undefined => {
      return data.find((chart) => chart.id === id);
    },
    [data]
  );

  const getChartsByCategory = useCallback(
    (category: string): ChartData[] => {
      return data.filter((chart) => chart.category === category);
    },
    [data]
  );

  // Initialize on mount
  useEffect(() => {
    initializeWorker();

    // Cleanup function
    return () => {
      console.log("Cleaning up SharedWorker connection");

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (portRef.current) {
        portRef.current.close();
        portRef.current = null;
      }

      workerRef.current = null;
    };
  }, [initializeWorker]);

  // Handle page visibility change to refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && portRef.current) {
        console.log("Page became visible, refreshing data...");
        refresh(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [refresh]);

  // Debug logging
  useEffect(() => {
    console.log("SharedWorker data updated:", {
      chartCount: data.length,
      loading,
      error,
      lastUpdated: lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString()
        : null,
      source,
      connections,
    });
  }, [data.length, loading, error, lastUpdated, source, connections]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    source,
    connections,
    refresh,
    getChartById,
    getChartsByCategory,
  };
}
