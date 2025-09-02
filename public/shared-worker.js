let connections = [];
let cachedData = null;

function generateMockData() {
  return Array.from({ length: 200 }, (_, i) => ({
    x: Math.sin(i / 100) + Math.random() * 100,
    y: Math.sin(i / 100) + Math.random() * 100,
  }));
}

onconnect = function (e) {
  const port = e.ports[0];
  connections.push(port);

  port.start();

  if (cachedData) {
    port.postMessage({ type: "data", data: cachedData });
  }

  port.onmessage = (event) => {
    if (event.data.type === "requestData") {
      if (!cachedData) {
        cachedData = generateMockData();
      }
      connections.forEach((c) =>
        c.postMessage({ type: "data", data: cachedData })
      );
    }
  };
};
