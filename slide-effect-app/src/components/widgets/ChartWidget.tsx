import type { SlideElement } from '../../types';

interface ChartWidgetProps {
  element: SlideElement;
}

const DEFAULT_DATA = {
  labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  datasets: [
    { label: 'Série A', data: [65, 78, 52, 91, 43, 88], color: '#6366f1' },
    { label: 'Série B', data: [40, 55, 80, 35, 70, 60], color: '#22d3ee' },
  ],
};

export const ChartWidget: React.FC<ChartWidgetProps> = ({ element }) => {
  const config = element.config || {};
  const chartType = config.chartType ?? 'bar';
  const data = config.chartData ?? DEFAULT_DATA;
  const color = element.style.color ?? '#ffffff';
  const fontSize = element.style.fontSize ?? 14;

  const maxVal = Math.max(...data.datasets.flatMap((d) => d.data));
  const labels = data.labels;
  const padding = 40;

  const renderBarChart = () => {
    const svgWidth = 400;
    const svgHeight = 220;
    const chartW = svgWidth - padding * 2;
    const chartH = svgHeight - padding * 1.5;
    const barGroupW = chartW / labels.length;
    const barW = (barGroupW / data.datasets.length) * 0.7;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding}
            y1={padding + chartH * (1 - t)}
            x2={svgWidth - padding / 2}
            y2={padding + chartH * (1 - t)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Bars */}
        {labels.map((label, li) => (
          <g key={li}>
            {data.datasets.map((ds, di) => {
              const barH = (ds.data[li] / maxVal) * chartH;
              const x = padding + li * barGroupW + di * (barW + 2) + barGroupW * 0.15;
              const y = padding + chartH - barH;
              return (
                <rect
                  key={di}
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={3}
                  fill={ds.color ?? '#6366f1'}
                  opacity={0.85}
                />
              );
            })}
            {/* X label */}
            <text
              x={padding + li * barGroupW + barGroupW / 2}
              y={svgHeight - 5}
              textAnchor="middle"
              fill={color}
              fontSize={fontSize * 0.7}
              opacity={0.7}
            >
              {label}
            </text>
          </g>
        ))}

        {/* Y axis */}
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={padding - 4}
            y={padding + chartH * (1 - t) + 4}
            textAnchor="end"
            fill={color}
            fontSize={fontSize * 0.65}
            opacity={0.5}
          >
            {Math.round(maxVal * t)}
          </text>
        ))}
      </svg>
    );
  };

  const renderLineChart = () => {
    const svgWidth = 400;
    const svgHeight = 220;
    const chartW = svgWidth - padding * 2;
    const chartH = svgHeight - padding * 1.5;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%' }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padding} y1={padding + chartH * (1 - t)} x2={svgWidth - padding / 2} y2={padding + chartH * (1 - t)}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}

        {/* Lines */}
        {data.datasets.map((ds, di) => {
          const points = ds.data.map((val, i) => {
            const x = padding + (i / (labels.length - 1)) * chartW;
            const y = padding + chartH - (val / maxVal) * chartH;
            return `${x},${y}`;
          }).join(' ');
          return (
            <g key={di}>
              <polyline points={points} fill="none" stroke={ds.color ?? '#6366f1'} strokeWidth={2.5} strokeLinejoin="round" />
              {ds.data.map((val, i) => {
                const x = padding + (i / (labels.length - 1)) * chartW;
                const y = padding + chartH - (val / maxVal) * chartH;
                return <circle key={i} cx={x} cy={y} r={4} fill={ds.color ?? '#6366f1'} />;
              })}
            </g>
          );
        })}

        {/* X Labels */}
        {labels.map((label, li) => (
          <text key={li} x={padding + (li / (labels.length - 1)) * chartW} y={svgHeight - 5}
            textAnchor="middle" fill={color} fontSize={fontSize * 0.7} opacity={0.7}>{label}</text>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    const totalByDataset = data.datasets[0].data.reduce((sum, v) => sum + v, 0);
    const svgSize = 200;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const r = svgSize * 0.38;
    const innerR = chartType === 'donut' ? r * 0.55 : 0;

    let currentAngle = -Math.PI / 2;
    const slices = data.datasets[0].data.map((val, i) => {
      const sliceAngle = (val / totalByDataset) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(currentAngle);
      const y1 = cy + r * Math.sin(currentAngle);
      const x2 = cx + r * Math.cos(currentAngle + sliceAngle);
      const y2 = cy + r * Math.sin(currentAngle + sliceAngle);
      const xi1 = cx + innerR * Math.cos(currentAngle);
      const yi1 = cy + innerR * Math.sin(currentAngle);
      const xi2 = cx + innerR * Math.cos(currentAngle + sliceAngle);
      const yi2 = cy + innerR * Math.sin(currentAngle + sliceAngle);
      const large = sliceAngle > Math.PI ? 1 : 0;
      const midAngle = currentAngle + sliceAngle / 2;
      const labelR = r * 0.7;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      const path = innerR > 0
        ? `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;

      const colors = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa'];
      currentAngle += sliceAngle;
      return { path, color: colors[i % colors.length], label: labels[i], lx, ly, val, pct: Math.round((val / totalByDataset) * 100) };
    });

    return (
      <svg viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ width: '60%', height: '100%' }}>
        {slices.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={s.color} opacity={0.85} />
            {s.pct > 5 && (
              <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize={fontSize * 0.65} fontWeight="bold">{s.pct}%</text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  const chartContent = chartType === 'bar' ? renderBarChart()
    : chartType === 'line' ? renderLineChart()
    : renderPieChart();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: element.style.backgroundColor || 'rgba(0,0,0,0.5)',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '16px',
        padding: element.style.padding ? `${element.style.padding}px` : '12px',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        gap: '8px',
      }}
    >
      {chartContent}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.datasets.map((ds, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: `${fontSize * 0.65}px`, color, opacity: 0.8 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: ds.color ?? '#6366f1', flexShrink: 0 }} />
            {ds.label}
          </div>
        ))}
      </div>
    </div>
  );
};
