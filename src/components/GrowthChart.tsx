import { useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useParamsStore } from '../state/useParams';
import { simulateAggregate } from '../lib/simulateAggregate';
import { POPULATIONS } from '../data/populations';
import { formatJa } from '../lib/format';

export function GrowthChart() {
  const params = useParamsStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    // Generate up to N=40 to show future growth even if current N is smaller
    const fullParams = { ...params, N: 50 };
    return simulateAggregate(fullParams, false).levels; // Use deterministic for smooth chart
  }, [params.meanChildren, params.sdChildren, params.partnerRate]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    // Below ~480px there isn't room for the 200px-wide label gutter to the right of the
    // plot (it would squeeze the plot itself down to a few px and garble the x-axis ticks),
    // so on narrow screens drop the gutter and draw reference labels inside the plot instead.
    const isCompact = container.clientWidth < 480;
    const margin = { top: 20, right: isCompact ? 12 : 200, bottom: 40, left: isCompact ? 45 : 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis (Degree)
    const x = d3.scaleLinear()
      .domain([0, 50])
      .range([0, width]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(isCompact ? 5 : 10))
      .attr('color', 'hsl(var(--muted-foreground))');

    svg.append('text')
      .attr('text-anchor', 'end')
      .attr('x', width)
      .attr('y', height + margin.top + 15)
      .attr('fill', 'hsl(var(--foreground))')
      .attr('font-size', '12px')
      .text('親等 (N)');

    // Y axis (Log Cumulative Pop)
    const maxPop = Math.max(d3.max(data, d => d.cumulative) || 10, POPULATIONS[0].pop * 100);
    const y = d3.scaleLog()
      .domain([1, maxPop])
      .range([height, 0])
      .clamp(true);

    // Filter Y ticks for log scale
    const yAxis = d3.axisLeft(y)
      .ticks(10, (d: d3.NumberValue) => {
        const str = d.toString();
        if (str.startsWith('1') && str.replace(/0/g, '').length === 1) return formatJa(d as number);
        return '';
      });

    svg.append('g')
      .call(yAxis)
      .attr('color', 'hsl(var(--muted-foreground))');

    svg.append('text')
      .attr('text-anchor', 'end')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', 0)
      .attr('fill', 'hsl(var(--foreground))')
      .attr('font-size', '12px')
      .text('累計親族数 (対数)');

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''))
      .attr('stroke-opacity', 0.1)
      .attr('color', 'hsl(var(--border))');

    // Population Reference Lines
    const referencePops = POPULATIONS.filter(p => 
      ['world', 'japan', 'cosmic', 'biology'].includes(p.category) || p.name === '東京都' || p.name === '鳥取県'
    );
    
    referencePops.forEach((pop) => {
      if (pop.pop > maxPop) return;
      const yPos = y(pop.pop);
      
      svg.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yPos)
        .attr('y2', yPos)
        .attr('stroke', 'hsl(var(--muted-foreground))')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-opacity', 0.5);

      // On wide screens the label sits in the right-hand gutter; on narrow screens there
      // is no gutter, so tuck it inside the plot instead (short form to keep it out of the way).
      svg.append('text')
        .attr('x', isCompact ? 4 : width + 5)
        .attr('y', isCompact ? yPos - 3 : yPos + 4)
        .attr('fill', 'hsl(var(--muted-foreground))')
        .attr('font-size', '10px')
        .text(isCompact ? pop.name : `${pop.name} (${formatJa(pop.pop)})`);
    });

    // The Line
    const line = d3.line<typeof data[0]>()
      .x(d => x(d.degree))
      .y(d => y(d.cumulative));

    svg.append('path')
      .datum([{ degree: 0, ancestors: 0, descendantsCollateral: 0, total: 1, cumulative: 1 }, ...data])
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 3)
      .attr('d', line);

  }, [data]); // Removed params.N

  // Separate effect to only update the indicator (much faster)
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = d3.select(containerRef.current).select('svg > g');
    if (svg.empty()) return;

    const isCompact = containerRef.current.clientWidth < 480;
    const width = containerRef.current.clientWidth - (isCompact ? 45 + 12 : 60 + 200); // width - margin.left - margin.right
    const height = 400 - 20 - 40; // height - margin.top - margin.bottom

    const x = d3.scaleLinear().domain([0, 50]).range([0, width]);
    const maxPop = Math.max(d3.max(data, d => d.cumulative) || 10, POPULATIONS[0].pop * 100);
    const y = d3.scaleLog().domain([1, maxPop]).range([height, 0]).clamp(true);

    // Remove old indicator
    svg.selectAll('.indicator').remove();

    // Current N indicator
    const currentData = data.find(d => d.degree === params.N);
    if (currentData) {
      const g = svg.append('g').attr('class', 'indicator');

      g.append('circle')
        .attr('cx', x(currentData.degree))
        .attr('cy', y(currentData.cumulative))
        .attr('r', 6)
        .attr('fill', 'hsl(var(--primary))');

      g.append('line')
        .attr('x1', x(currentData.degree))
        .attr('x2', x(currentData.degree))
        .attr('y1', height)
        .attr('y2', y(currentData.cumulative))
        .attr('stroke', 'hsl(var(--primary))')
        .attr('stroke-dasharray', '2,2');
    }

  }, [data, params.N]);

  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm mt-6">
      <h3 className="text-lg font-bold mb-2">親等と累計人数の推移 (対数スケール)</h3>
      <div ref={containerRef} className="w-full overflow-hidden" />
    </div>
  );
}
