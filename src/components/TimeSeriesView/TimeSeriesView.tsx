import { useMemo, useState, useRef } from 'react';
import type { MarketTick, DateRange } from '../../types/market';
import styles from './TimeSeriesView.module.scss';

interface TimeSeriesViewProps {
  ticks: MarketTick[];
  dateRange: DateRange | null;
}

export function TimeSeriesView({ ticks, dateRange }: TimeSeriesViewProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const filteredTicks = useMemo(() => {
    if (!dateRange) return ticks;
    return ticks.filter((tick) => {
      const tickDate = new Date(tick.date);
      return tickDate >= dateRange.start && tickDate <= dateRange.end;
    });
  }, [ticks, dateRange]);

  const displayTicks = useMemo(() => {
    // Limit to last 100 for better candlestick visualization
    return filteredTicks.slice(0, 100).reverse(); // Reverse to show oldest to newest
  }, [filteredTicks]);

  const maxPrice = useMemo(() => {
    if (displayTicks.length === 0) return 1;
    return Math.max(...displayTicks.map((t) => t.high));
  }, [displayTicks]);

  const minPrice = useMemo(() => {
    if (displayTicks.length === 0) return 0;
    return Math.min(...displayTicks.map((t) => t.low));
  }, [displayTicks]);

  const priceRange = maxPrice - minPrice || 1;
  const padding = 0.05; // 5% padding on top and bottom

  const chartDimensions = useMemo(() => {
    const chartHeight = 400;
    const chartWidth = 1000;
    const candleWidth = displayTicks.length > 0 ? (chartWidth / displayTicks.length) * 0.7 : 10; // 70% of available space for candle body
    const candleSpacing = displayTicks.length > 0 ? chartWidth / displayTicks.length : 10;
    return { chartHeight, chartWidth, candleWidth, candleSpacing };
  }, [displayTicks.length]);

  const getPricePosition = (price: number) => {
    const normalizedPrice = (price - minPrice) / priceRange;
    return (1 - normalizedPrice) * (1 - 2 * padding) + padding; // Invert Y-axis and add padding
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgPoint = svg.createSVGPoint();

    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const svgCoordinates = svgPoint.matrixTransform(ctm.inverse());

    // Clamp coordinates to chart bounds
    const x = Math.max(0, Math.min(svgCoordinates.x, chartDimensions.chartWidth));
    const y = Math.max(0, Math.min(svgCoordinates.y, chartDimensions.chartHeight));

    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition(null);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  if (displayTicks.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Time Series</h2>
        </div>
        <div className={styles.empty}>
          <p>No data available for the selected date range</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Time Series</h2>
        <span className={styles.count}>{displayTicks.length} ticks</span>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.yAxis}>
          <div className={styles.yLabel}>${maxPrice.toFixed(2)}</div>
          <div className={styles.yLabel}>${((maxPrice + minPrice) / 2).toFixed(2)}</div>
          <div className={styles.yLabel}>${minPrice.toFixed(2)}</div>
        </div>

        <div className={styles.chart}>
          <svg
            ref={svgRef}
            className={styles.svg}
            viewBox={`0 0 ${chartDimensions.chartWidth} ${chartDimensions.chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines - horizontal lines at regular intervals */}
            {Array.from({ length: 11 }, (_, i) => i / 10).map((ratio) => {
              const y = chartDimensions.chartHeight * ratio;
              return (
                <line key={ratio} x1="0" y1={y} x2={chartDimensions.chartWidth} y2={y} className={styles.gridLine} />
              );
            })}

            {/* Candlesticks */}
            {displayTicks.map((tick, i) => {
              const isBullish = tick.close >= tick.open;
              const x = i * chartDimensions.candleSpacing + chartDimensions.candleSpacing / 2;
              const highY = getPricePosition(tick.high) * chartDimensions.chartHeight;
              const lowY = getPricePosition(tick.low) * chartDimensions.chartHeight;
              const openY = getPricePosition(tick.open) * chartDimensions.chartHeight;
              const closeY = getPricePosition(tick.close) * chartDimensions.chartHeight;

              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1); // Minimum 1px height

              return (
                <g key={`${tick.date}-${i}`} className={isBullish ? styles.candleBullish : styles.candleBearish}>
                  {/* Wick (high-low line) */}
                  <line x1={x} y1={highY} x2={x} y2={lowY} className={styles.wick} />
                  {/* Body (open-close rectangle) */}
                  <rect
                    x={x - chartDimensions.candleWidth / 2}
                    y={bodyTop}
                    width={chartDimensions.candleWidth}
                    height={bodyHeight}
                    className={styles.candleBody}
                  />
                </g>
              );
            })}

            {/* Crosshair lines - rendered on top for visibility */}
            {isHovering && mousePosition && (
              <>
                {/* Vertical line */}
                <line
                  x1={mousePosition.x}
                  y1="0"
                  x2={mousePosition.x}
                  y2={chartDimensions.chartHeight}
                  className={styles.crosshairLine}
                />
                {/* Horizontal line */}
                <line
                  x1="0"
                  y1={mousePosition.y}
                  x2={chartDimensions.chartWidth}
                  y2={mousePosition.y}
                  className={styles.crosshairLine}
                />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
