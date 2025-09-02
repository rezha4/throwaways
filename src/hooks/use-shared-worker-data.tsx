import { useEffect, useState } from "react";

export default function useSharedWorkerData() {
  const [data, setData] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const worker = new SharedWorker("/shared-worker.js");
    worker.port.start();

    worker.port.onmessage = (event) => {
      if (event.data.type === "data") {
        setData(event.data.data);
      }
    };

    worker.port.postMessage({ type: "requestData" });

    return () => {
      worker.port.close();
    };
  }, []);

  return data;
}
