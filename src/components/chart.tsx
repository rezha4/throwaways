import { useRef, useEffect, useCallback, useMemo } from "react";

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
}

interface ChartProps {
  data: ChartData;
  width?: number;
  height?: number;
  animate?: boolean;
}

export default function Chart({
  data,
  width = 400,
  height = 200,
  animate = true,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  // Memoize chart calculations for performance
  const chartConfig = useMemo(() => {
    if (!data.data_points || data.data_points.length === 0) {
      return null;
    }

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Use pre-calculated bounds or calculate them
    const bounds = data.bounds || {
      minX: Math.min(...data.data_points.map((p) => p.x)),
      maxX: Math.max(...data.data_points.map((p) => p.x)),
      minY: Math.min(...data.data_points.map((p) => p.y)),
      maxY: Math.max(...data.data_points.map((p) => p.y)),
    };

    const xRange = bounds.maxX - bounds.minX || 1;
    const yRange = bounds.maxY - bounds.minY || 1;

    return {
      padding,
      chartWidth,
      chartHeight,
      bounds,
      xRange,
      yRange,
      xScale: (x: number) =>
        padding + ((x - bounds.minX) / xRange) * chartWidth,
      yScale: (y: number) =>
        height - padding - ((y - bounds.minY) / yRange) * chartHeight,
    };
  }, [data, width, height]);

  // Optimized drawing function
  const drawChart = useCallback(
    (ctx: CanvasRenderingContext2D, progress: number = 1) => {
      if (!chartConfig) return;

      const {
        padding,
        chartWidth,
        chartHeight,
        xScale,
        yScale,
        bounds,
      } = chartConfig;
      const { data_points, chart_type, metadata } = data;

      // Clear canvas with better performance
      ctx.clearRect(0, 0, width, height);

      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw background grid
      ctx.strokeStyle = "#f0f0f0";
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
      }

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
      ctx.stroke();

      // Draw axes
      ctx.strokeStyle = "#d0d0d0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = "#666";
      ctx.font = "11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";

      // Y-axis labels
      for (let i = 0; i <= 5; i++) {
        const value =
          bounds.minY + (i / 5) * (bounds.maxY - bounds.minY);
        const y = height - padding - (i / 5) * chartHeight;
        ctx.textAlign = "right";
        ctx.fillText(value.toFixed(1), padding - 5, y + 3);
      }

      // X-axis labels (show only a few to avoid crowding)
      const labelCount = Math.min(
        5,
        Math.floor(data_points.length / 10)
      );
      for (let i = 0; i <= labelCount; i++) {
        const dataIndex = Math.floor(
          (i / labelCount) * (data_points.length - 1)
        );
        const point = data_points[dataIndex];
        if (point) {
          const x = xScale(point.x);
          ctx.textAlign = "center";
          ctx.fillText(point.x.toFixed(0), x, height - padding + 15);
        }
      }

      // Draw data based on chart type
      const visiblePoints = Math.floor(data_points.length * progress);
      const points = data_points.slice(0, visiblePoints);

      if (points.length === 0) return;

      ctx.strokeStyle = metadata.color;
      ctx.fillStyle = metadata.color;
      ctx.lineWidth = 2;

      if (chart_type === "line") {
        // Draw line chart with smooth curves
        ctx.beginPath();
        let prevX = xScale(points[0].x);
        let prevY = yScale(points[0].y);
        ctx.moveTo(prevX, prevY);

        for (let i = 1; i < points.length; i++) {
          const currentX = xScale(points[i].x);
          const currentY = yScale(points[i].y);

          // Use quadratic curve for smooth lines
          const cpX = prevX + (currentX - prevX) * 0.5;
          ctx.quadraticCurveTo(cpX, prevY, currentX, currentY);

          prevX = currentX;
          prevY = currentY;
        }
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = metadata.color;
        for (const point of points) {
          const x = xScale(point.x);
          const y = yScale(point.y);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (chart_type === "area") {
        // Draw area chart
        ctx.beginPath();
        ctx.moveTo(xScale(points[0].x), height - padding);

        for (const point of points) {
          ctx.lineTo(xScale(point.x), yScale(point.y));
        }

        ctx.lineTo(
          xScale(points[points.length - 1].x),
          height - padding
        );
        ctx.closePath();

        // Fill area with gradient
        const gradient = ctx.createLinearGradient(
          0,
          padding,
          0,
          height - padding
        );
        gradient.addColorStop(0, metadata.color + "80");
        gradient.addColorStop(1, metadata.color + "20");
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line on top
        ctx.beginPath();
        ctx.moveTo(xScale(points[0].x), yScale(points[0].y));
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(xScale(points[i].x), yScale(points[i].y));
        }
        ctx.strokeStyle = metadata.color;
        ctx.stroke();
      } else if (chart_type === "bar") {
        // Draw bar chart
        const barWidth = Math.max(
          2,
          (chartWidth / points.length) * 0.8
        );

        for (const point of points) {
          const x = xScale(point.x) - barWidth / 2;
          const y = yScale(point.y);
          const barHeight = height - padding - y;

          ctx.fillStyle = metadata.color;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Add subtle border
          ctx.strokeStyle = metadata.color + "dd";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, barWidth, barHeight);
        }
      }

      // Draw title and unit
      ctx.fillStyle = "#333";
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(data.chart_name, padding, 20);

      if (metadata.unit) {
        ctx.font = "10px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText(metadata.unit, padding, 35);
      }
    },
    [chartConfig, data, width, height]
  );

  // Animation loop
  const animate_chart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    progressRef.current += 0.02;
    if (progressRef.current >= 1) {
      progressRef.current = 1;
      drawChart(ctx, 1);
      return;
    }

    drawChart(ctx, progressRef.current);
    animationRef.current = requestAnimationFrame(animate_chart);
  }, [drawChart]);

  // Effect to handle drawing and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.scale(dpr, dpr);

    if (animate) {
      progressRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animate_chart();
    } else {
      drawChart(ctx, 1);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, animate, drawChart, animate_chart]);

  if (!data.data_points || data.data_points.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded border"
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium">No Data</div>
          <div className="text-xs">{data.chart_name}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
        style={{ width, height }}
      />

      {/* Chart info overlay */}
      <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        <div>{data.category}</div>
        <div>{data.pointCount} points</div>
        <div className="capitalize">{data.chart_type}</div>
      </div>
    </div>
  );
}
