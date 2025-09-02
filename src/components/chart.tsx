export default function Chart({
  data,
}: {
  data: { x: number; y: number };
}) {
  return (
    <canvas
      id="chart"
      width="400"
      height="300"
      style={{ border: "1px solid #ccc" }}
      ref={(canvas) => {
        if (canvas && data) {
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.moveTo(0, 200);

          const x = data.x;
          const y = data.y;
          ctx.lineTo(x, y);

          ctx.strokeStyle = "blue";
          ctx.stroke();
        }
      }}
    />
  );
}
