// public/shared-worker.js
let connections = [];
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Supabase configuration
const SUPABASE_URL = "https://hbnudengjhumfoxnhfvx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibnVkZW5namh1bWZveG5oZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MDYxMDUsImV4cCI6MjA2MzM4MjEwNX0.orA9V_Y94bgGtA--n1semEUWQDd-O02sfnf-vC9iVUU";

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
  }

  async fetchCharts() {
    try {
      const response = await fetch(
        `${this.url}/rest/v1/profiling_charts?select=*&order=created_at.desc`,
        {
          method: "GET",
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch from Supabase:", error);
      throw Error(error);
    }
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchData(force = false) {
  const now = Date.now();

  // Use cache if available and not expired
  if (cachedData && !force && now - lastFetch < CACHE_DURATION) {
    return cachedData;
  }

  try {
    console.log("SharedWorker: Fetching fresh data from Supabase...");
    const data = await supabase.fetchCharts();

    // Process data for better performance
    const processedData = data.map((chart) => ({
      ...chart,
      // Pre-calculate chart bounds for performance
      bounds:
        chart.data_points.length > 0
          ? {
              minX: Math.min(...chart.data_points.map((p) => p.x)),
              maxX: Math.max(...chart.data_points.map((p) => p.x)),
              minY: Math.min(...chart.data_points.map((p) => p.y)),
              maxY: Math.max(...chart.data_points.map((p) => p.y)),
            }
          : null,
      // Add computed properties
      pointCount: chart.data_points.length,
      lastUpdated: new Date().toISOString(),
    }));

    cachedData = processedData;
    lastFetch = now;

    console.log(
      `SharedWorker: Cached ${processedData.length} charts`
    );
    return processedData;
  } catch (error) {
    console.error("SharedWorker: Error fetching data:", error);

    // Return cached data if available, otherwise fallback
    if (cachedData) {
      return cachedData;
    } else {
      cachedData = supabase.generateFallbackData();
      return cachedData;
    }
  }
}

// Broadcast data to all connected ports
function broadcastData(data) {
  const message = {
    type: "data",
    data: data,
    timestamp: Date.now(),
    source: cachedData ? "cache" : "fresh",
  };

  connections.forEach((port, index) => {
    try {
      port.postMessage(message);
    } catch (error) {
      console.warn(
        `SharedWorker: Failed to send data to connection ${index}:`,
        error
      );
      // Remove invalid connections
      connections.splice(index, 1);
    }
  });
}

// Auto-refresh data every 60 seconds
setInterval(async () => {
  if (connections.length > 0) {
    console.log("SharedWorker: Auto-refreshing data...");
    const data = await fetchData(true);
    broadcastData(data);
  }
}, 60000);

onconnect = function (e) {
  const port = e.ports[0];
  connections.push(port);

  console.log(
    `SharedWorker: New connection. Total: ${connections.length}`
  );

  port.start();

  // Send cached data immediately if available
  if (cachedData) {
    port.postMessage({
      type: "data",
      data: cachedData,
      timestamp: lastFetch,
      source: "cache",
    });
  }

  port.onmessage = async function (event) {
    const { type, payload } = event.data;

    switch (type) {
      case "requestData":
        try {
          const data = await fetchData(payload?.force || false);
          broadcastData(data);
        } catch (error) {
          port.postMessage({
            type: "error",
            error: error.message,
            timestamp: Date.now(),
          });
        }
        break;

      case "ping":
        port.postMessage({
          type: "pong",
          timestamp: Date.now(),
          connections: connections.length,
          cacheStatus: cachedData ? "loaded" : "empty",
          lastFetch: lastFetch,
        });
        break;

      default:
        console.warn("SharedWorker: Unknown message type:", type);
    }
  };

  port.onmessageerror = function (error) {
    console.error("SharedWorker: Message error:", error);
  };

  // Handle port closure
  port.addEventListener("close", () => {
    const index = connections.indexOf(port);
    if (index > -1) {
      connections.splice(index, 1);
      console.log(
        `SharedWorker: Connection closed. Total: ${connections.length}`
      );
    }
  });
};
