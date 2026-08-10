import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { type DemoTenant } from '../lib/demoData';
import { validateCSV, CSVValidationResult } from '../lib/csvUtils';
import { MarketPerformanceChart } from './MarketPerformanceChart';
import { ImportResultModal } from './ImportResultModal';

interface MarketPerformanceProps {
  tenant: DemoTenant;
}

type TimeHorizon = '6M' | '1Y' | '3Y' | '5Y';

interface RentTrendPoint {
  date: Date;
  label: string;
  portfolioRent: number;
  marketBenchmark: number;
  occupancyRate: number;
  growthPct: number;
}

interface PropertyGrowthMetric {
  id: string;
  name: string;
  growthPct: number;
  noiContribution: number;
  occupancy: number;
  units: number;
}

export interface UnitOccupancyPoint {
  date: Date;
  monthLabel: string;
  propertyId: string;
  propertyName: string;
  unitTier: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  revenueLoss: number;
  momDelta?: number;
  isForecast?: boolean;
  regressionSlope?: number;
}

export function generateUnitLevelOccupancyData(tenant: DemoTenant): UnitOccupancyPoint[] {
  const result: UnitOccupancyPoint[] = [];
  const now = new Date();

  tenant.properties.forEach((prop) => {
    const tiers = [
      { name: 'Studio & Micro-units', ratio: 0.25, baseOccOffset: +0.9, avgRent: Math.round((tenant.monthlyRent / tenant.units) * 0.75) },
      { name: '1-Bed Executive', ratio: 0.45, baseOccOffset: +0.3, avgRent: Math.round((tenant.monthlyRent / tenant.units) * 0.90) },
      { name: '2-Bed Family Suite', ratio: 0.30, baseOccOffset: -0.8, avgRent: Math.round((tenant.monthlyRent / tenant.units) * 1.20) },
    ];

    tiers.forEach((tier, tIdx) => {
      const tierTotalUnits = Math.max(4, Math.round(prop.units * tier.ratio));
      const baseOcc = prop.occupancy + tier.baseOccOffset;

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        const seasonal = Math.sin((d.getMonth() / 12) * Math.PI * 2) * 2.2;
        const trendShift = (11 - i) * 0.12;
        const noise = Math.sin(i * 2 + tIdx * 4) * 1.1;

        const rawOcc = Math.min(100, Math.max(75, baseOcc + seasonal + trendShift + noise));
        const occupancyRate = Number(rawOcc.toFixed(1));
        const occupiedUnits = Math.min(tierTotalUnits, Math.max(0, Math.round((occupancyRate / 100) * tierTotalUnits)));
        const vacantUnits = tierTotalUnits - occupiedUnits;
        const revenueLoss = Math.round(vacantUnits * tier.avgRent);

        result.push({
          date: d,
          monthLabel,
          propertyId: prop.id,
          propertyName: prop.name,
          unitTier: tier.name,
          totalUnits: tierTotalUnits,
          occupiedUnits,
          occupancyRate,
          revenueLoss,
        });
      }
    });
  });

  return result;
}

export default function MarketPerformance({ tenant }: MarketPerformanceProps) {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('1Y');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showOccupancyOverlay, setShowOccupancyOverlay] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<RentTrendPoint | null>(null);
  const [hoveredProperty, setHoveredProperty] = useState<PropertyGrowthMetric | null>(null);

  // Unit-Level Occupancy Chart State
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('ALL');
  const [unitChartMode, setUnitChartMode] = useState<'trend' | 'heatmap'>('trend');
  const [heatmapGranularity, setHeatmapGranularity] = useState<'property' | 'unit'>('property');
  const [showHeatmapForecast, setShowHeatmapForecast] = useState<boolean>(true);
  const [hoveredUnitPoint, setHoveredUnitPoint] = useState<UnitOccupancyPoint | null>(null);

  // Custom CSV Dataset State
  const [customTrendData, setCustomTrendData] = useState<RentTrendPoint[] | null>(null);
  const [customPropertyGrowthData, setCustomPropertyGrowthData] = useState<PropertyGrowthMetric[] | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingParsedData, setPendingParsedData] = useState<{rawText: string, filename: string} | null>(null);

  // CSV Tour & Format Guide State
  const [showTourModal, setShowTourModal] = useState(false);
  const [tourStep, setTourStep] = useState<1 | 2 | 3>(1);
  const [showImportTipsBanner, setShowImportTipsBanner] = useState(true);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [activeHeaderTip, setActiveHeaderTip] = useState<string>('date');
  const [showExportModal, setShowExportModal] = useState(false);

  const copyHeaderRow = (headerText: string = 'date,occupancy_rate,property_id,portfolio_rent,market_benchmark') => {
    navigator.clipboard.writeText(headerText);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2500);
  };

  const downloadMarketPerformanceCsv = (exportType: 'trends' | 'occupancy' | 'full' = 'full') => {
    let csvRows: string[] = [];
    const sanitizedTenantName = tenant.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStamp = new Date().toISOString().split('T')[0];
    let fileName = `${sanitizedTenantName}_Market_Performance_${dateStamp}.csv`;

    if (exportType === 'trends') {
      fileName = `${sanitizedTenantName}_Rent_Trends_${dateStamp}.csv`;
      csvRows.push('date,occupancy_rate,portfolio_rent,market_benchmark,rent_growth_pct');
      trendData.forEach((pt) => {
        const dateStr = pt.date.toISOString().split('T')[0];
        csvRows.push(`${dateStr},${pt.occupancyRate.toFixed(1)},${pt.portfolioRent},${pt.marketBenchmark},${pt.growthPct}`);
      });
    } else if (exportType === 'occupancy') {
      fileName = `${sanitizedTenantName}_Occupancy_Heatmap_${dateStamp}.csv`;
      const unitPoints = generateUnitLevelOccupancyData(tenant);
      csvRows.push('date,month_label,property_id,property_name,unit_tier,occupancy_rate,occupied_units,total_units,revenue_loss,is_forecast,regression_slope');
      unitPoints.forEach((pt) => {
        const dateStr = pt.date.toISOString().split('T')[0];
        csvRows.push(`${dateStr},"${pt.monthLabel}","${pt.propertyId}","${pt.propertyName}","${pt.unitTier}",${pt.occupancyRate.toFixed(1)},${pt.occupiedUnits},${pt.totalUnits},${pt.revenueLoss},${pt.isForecast ? 'true' : 'false'},${pt.regressionSlope ?? 0}`);
      });
    } else {
      // Full master dataset combining historical trend lines, market benchmarks, and occupancy rates
      fileName = `${sanitizedTenantName}_Market_Performance_Full_${dateStamp}.csv`;
      csvRows.push('date,occupancy_rate,portfolio_rent,market_benchmark,rent_growth_pct,property_count,total_units,occupied_units');
      const totalUnits = tenant.units;
      trendData.forEach((pt) => {
        const dateStr = pt.date.toISOString().split('T')[0];
        const occupiedUnits = Math.round((pt.occupancyRate / 100) * totalUnits);
        csvRows.push(`${dateStr},${pt.occupancyRate.toFixed(1)},${pt.portfolioRent},${pt.marketBenchmark},${pt.growthPct},${tenant.properties.length},${totalUnits},${occupiedUnits}`);
      });
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCsvTemplate = () => {
    const sampleCsvContent = `date,occupancy_rate,property_id\n2025-01-01,95.2,PROP-101\n2025-02-01,96.5,PROP-102\n2025-03-01,94.0,PROP-103`;
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'market_performance_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const barChartRef = useRef<SVGSVGElement | null>(null);
  const unitChartRef = useRef<SVGSVGElement | null>(null);
  const lineContainerRef = useRef<HTMLDivElement | null>(null);
  const barContainerRef = useRef<HTMLDivElement | null>(null);
  const unitContainerRef = useRef<HTMLDivElement | null>(null);

  // Generate deterministic trend points based on tenant and selected time horizon
  const generateTrendData = (): RentTrendPoint[] => {
    const monthsCount = timeHorizon === '6M' ? 6 : timeHorizon === '1Y' ? 12 : timeHorizon === '3Y' ? 36 : 60;
    const baseAvgRent = Math.round(tenant.monthlyRent / tenant.units);
    const result: RentTrendPoint[] = [];

    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: monthsCount > 12 ? '2-digit' : undefined });

      // Organic trend calculation
      const progress = (monthsCount - i) / monthsCount;
      const seasonalFactor = Math.sin((d.getMonth() / 12) * Math.PI * 2) * 0.03;
      const trendGrowth = progress * 0.08 + (Math.sin(i * 0.5) * 0.015);
      
      const portfolioRent = Math.round(baseAvgRent * (1 - (monthsCount - i) * 0.005 + trendGrowth + seasonalFactor));
      const marketBenchmark = Math.round(portfolioRent * (0.92 + Math.cos(i * 0.3) * 0.03));
      const occupancyRate = Math.min(99.5, Math.max(88, tenant.occupancy + (Math.sin(i) * 1.8)));
      const growthPct = Number((((portfolioRent - baseAvgRent * 0.9) / (baseAvgRent * 0.9)) * 100).toFixed(1));

      result.push({
        date: d,
        label,
        portfolioRent,
        marketBenchmark,
        occupancyRate,
        growthPct,
      });
    }

    return result;
  };

  // Generate property growth dataset
  const generatePropertyGrowthData = (): PropertyGrowthMetric[] => {
    return tenant.properties.map((p, idx) => {
      // Deterministic calculation from property attributes
      const growthPct = Number(((p.occupancy - 85) * 0.35 + (p.collections - 90) * 0.2 + (idx * 0.8)).toFixed(1));
      const noiContribution = Number(((p.units / tenant.units) * 100).toFixed(1));

      return {
        id: p.id,
        name: p.name,
        growthPct,
        noiContribution,
        occupancy: p.occupancy,
        units: p.units,
      };
    });
  };

  const trendData = customTrendData || generateTrendData();
  const propertyGrowthData = customPropertyGrowthData || generatePropertyGrowthData();

  // CSV Parser Handler
  const handleParseCsv = (rawText: string, filename: string = 'Custom_Rent_Dataset.csv') => {
    try {
      setCsvError(null);
      if (!rawText || !rawText.trim()) {
        throw new Error('Please paste CSV content or upload a valid CSV file.');
      }
      
      const parsedRows = d3.csvParse(rawText.trim());
      const vResult = validateCSV(parsedRows);
      
      if (!vResult.isValid) {
        setValidationResult(vResult);
        setShowValidationModal(true);
        if (showCsvModal) setShowCsvModal(false);
        return;
      }
      
      if (!parsedRows || parsedRows.length === 0) {
        throw new Error('CSV file appears empty or missing readable headers.');
      }

      const headers = Object.keys(parsedRows[0]).map(h => h.trim().toLowerCase());

      const isTrend = headers.some(h => h.includes('date') || h.includes('rent') || h.includes('month') || h.includes('benchmark') || h.includes('occupancy'));
      const isProperty = headers.some(h => h.includes('property') || h.includes('building') || h.includes('growth') || h.includes('unit'));

      if (isTrend) {
        const trendPoints: RentTrendPoint[] = parsedRows.map((row, idx) => {
          const rawDate = row.date || row.Date || row.month || row.Month || row.Year || `2025-${(idx % 12) + 1}-01`;
          const d = new Date(rawDate);
          const validDate = isNaN(d.getTime()) ? new Date(2025, idx, 1) : d;

          const portfolioRent = Number(row.portfolio_rent || row.portfolioRent || row.PortfolioRent || row.rent || row.Rent || row.rate || 2000);
          const marketBenchmark = Number(row.market_benchmark || row.marketBenchmark || row.MarketBenchmark || row.benchmark || row.Benchmark || portfolioRent * 0.93);
          const rawOccupancy = row.occupancy_rate || row.occupancyRate || row.OccupancyRate || row.occupancy || row.Occupancy || 95;
          let occupancyRate = Number(rawOccupancy);
          if (occupancyRate > 0 && occupancyRate <= 1.0) {
            occupancyRate = Number((occupancyRate * 100).toFixed(1)); // Convert decimal (e.g., 0.952 -> 95.2)
          }

          return {
            date: validDate,
            label: d3.timeFormat('%b %y')(validDate),
            portfolioRent,
            marketBenchmark,
            occupancyRate,
            growthPct: Number((((portfolioRent - 1800) / 1800) * 100).toFixed(1)),
          };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        if (trendPoints.length === 0) throw new Error('No valid date and rent rows parsed from CSV.');

        setCustomTrendData(trendPoints);
        setCustomFileName(filename);
        setShowCsvModal(false);
        setCsvText('');
      } else if (isProperty) {
        const propMetrics: PropertyGrowthMetric[] = parsedRows.map((row, idx) => {
          return {
            id: `custom-prop-${idx}`,
            name: row.name || row.Name || row.property || row.Property || `Property ${idx + 1}`,
            growthPct: Number(row.growthPct || row.GrowthPct || row.growth || row.Growth || 5.0),
            noiContribution: Number(row.noiContribution || row.NOI || row.units || 15.0),
            occupancy: Number(row.occupancy || row.Occupancy || 96.0),
            units: Number(row.units || row.Units || 40),
          };
        });

        setCustomPropertyGrowthData(propMetrics);
        setCustomFileName(filename);
        setShowCsvModal(false);
        setCsvText('');
      } else {
        throw new Error('CSV headers not recognized. Required columns: "Date, PortfolioRent, MarketBenchmark, OccupancyRate" OR "PropertyName, GrowthPct, Occupancy, Units".');
      }
    } catch (err: any) {
      setCsvError(err.message || 'Error processing CSV dataset.');
      setShowValidationModal(false);
      setShowCsvModal(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        handleParseCsv(text, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadSampleDataset = () => {
    const sampleCsv = `date,occupancy_rate,property_id,portfolio_rent,market_benchmark
2025-01-01,95.2,PROP-101,2150,2010
2025-02-01,95.8,PROP-101,2180,2025
2025-03-01,96.4,PROP-101,2210,2040
2025-04-01,97.0,PROP-101,2250,2065
2025-05-01,97.5,PROP-101,2290,2090
2025-06-01,98.1,PROP-101,2340,2110
2025-07-01,98.4,PROP-101,2380,2135
2025-08-01,98.0,PROP-101,2410,2150
2025-09-01,97.8,PROP-101,2430,2170
2025-10-01,98.2,PROP-101,2460,2190
2025-11-01,98.6,PROP-101,2490,2210
2025-12-01,99.0,PROP-101,2520,2230`;

    setCsvText(sampleCsv);
    handleParseCsv(sampleCsv, 'Sample_Metro_Rent_Dataset.csv');
  };

  const handleResetData = () => {
    setCustomTrendData(null);
    setCustomPropertyGrowthData(null);
    setCustomFileName(null);
  };

  // Compute summary stats
  const latestPoint = trendData[trendData.length - 1];
  const earliestPoint = trendData[0];
  const totalRentGrowthPct = (((latestPoint.portfolioRent - earliestPoint.portfolioRent) / earliestPoint.portfolioRent) * 100).toFixed(1);
  const avgPortfolioRent = latestPoint.portfolioRent;
  const avgMarketRent = latestPoint.marketBenchmark;
  const outperformancePct = (((avgPortfolioRent - avgMarketRent) / avgMarketRent) * 100).toFixed(1);

  // ── Render D3 Line Chart with Interactive Zoom & Pan ──────────────────────
  useEffect(() => {
    if (!lineChartRef.current || !lineContainerRef.current) return;

    const container = lineContainerRef.current;
    const svg = d3.select(lineChartRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = container.clientWidth || 600;
    const height = 320;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Clip path for zoomed content
    const defs = svg.append('defs');
    const clipId = `line-chart-clip-${Math.floor(Math.random() * 1000000)}`;
    defs.append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Initial Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(trendData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    let currentXScale = xScale;

    const yMin = d3.min(trendData, d => Math.min(d.portfolioRent, d.marketBenchmark))! * 0.95;
    const yMax = d3.max(trendData, d => Math.max(d.portfolioRent, d.marketBenchmark))! * 1.05;

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // Gridlines
    const yAxisGrid = d3.axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .style('stroke', 'rgba(255,255,255,0.06)')
      .style('stroke-dasharray', '3,3')
      .call(yAxisGrid)
      .selectAll('.domain').remove();

    // Defs for Area Gradients
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'portfolio-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#39bff6')
      .attr('stop-opacity', 0.35);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#39bff6')
      .attr('stop-opacity', 0.0);

    // Group for chart elements bounded by clip-path
    const chartBody = g.append('g')
      .attr('clip-path', `url(#${clipId})`);

    // Area generator for Portfolio
    const areaGenerator = d3.area<RentTrendPoint>()
      .x(d => currentXScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.portfolioRent))
      .curve(d3.curveMonotoneX);

    const areaPath = chartBody.append('path')
      .datum(trendData)
      .attr('fill', 'url(#portfolio-area-gradient)')
      .attr('d', areaGenerator);

    // Line generators
    const linePortfolio = d3.line<RentTrendPoint>()
      .x(d => currentXScale(d.date))
      .y(d => yScale(d.portfolioRent))
      .curve(d3.curveMonotoneX);

    const lineBenchmark = d3.line<RentTrendPoint>()
      .x(d => currentXScale(d.date))
      .y(d => yScale(d.marketBenchmark))
      .curve(d3.curveMonotoneX);

    // Benchmark line
    let benchmarkPath: any = null;
    if (showBenchmark) {
      benchmarkPath = chartBody.append('path')
        .datum(trendData)
        .attr('fill', 'none')
        .attr('stroke', '#a78bfa')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', lineBenchmark);
    }

    // Main Portfolio line
    const portfolioPath = chartBody.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#39bff6')
      .attr('stroke-width', 3.5)
      .attr('d', linePortfolio);

    // Animate line path drawing on mount
    const totalLength = (portfolioPath.node() as SVGPathElement)?.getTotalLength() || 0;
    portfolioPath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Circles for Data Points
    const dotsGroup = chartBody.append('g').attr('class', 'dots-group');
    const updateDots = (scale: d3.ScaleTime<number, number>) => {
      const dots = dotsGroup.selectAll('.dot-portfolio').data(trendData);
      dots.enter()
        .append('circle')
        .attr('class', 'dot-portfolio')
        .attr('r', 4)
        .attr('fill', '#0f172a')
        .attr('stroke', '#39bff6')
        .attr('stroke-width', 2)
        .merge(dots as any)
        .attr('cx', d => scale(d.date))
        .attr('cy', d => yScale(d.portfolioRent));
    };
    updateDots(currentXScale);

    // Axes
    const xAxisFormat = (d: any) => d3.timeFormat(timeHorizon === '3Y' || timeHorizon === '5Y' ? '%b %y' : '%b')(d as Date);
    const xAxisGenerator = d3.axisBottom(xScale)
      .ticks(timeHorizon === '6M' ? 6 : 8)
      .tickFormat(xAxisFormat);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${tenant.currency} ${d3.format(',.0f')(d)}`);

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxisGenerator)
      .style('color', '#64748b')
      .style('font-size', '11px');

    xAxisGroup.selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

    g.append('g')
      .call(yAxis)
      .style('color', '#64748b')
      .style('font-size', '11px')
      .selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

    // Overlay for Hover Mouse Tracking & Zoom
    const overlay = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'grab');

    const hoverLine = chartBody.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0);

    const hoverDot = chartBody.append('circle')
      .attr('r', 6)
      .attr('fill', '#39bff6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    // D3 Zoom Behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [innerWidth, innerHeight]])
      .extent([[0, 0], [innerWidth, innerHeight]])
      .on('zoom', (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        currentXScale = newXScale;

        // Update X Axis
        xAxisGroup.call(
          d3.axisBottom(newXScale)
            .ticks(timeHorizon === '6M' ? 6 : 8)
            .tickFormat(xAxisFormat)
        ).selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

        // Redraw path line & area
        linePortfolio.x(d => newXScale(d.date));
        portfolioPath.attr('d', linePortfolio);

        if (showBenchmark && benchmarkPath) {
          lineBenchmark.x(d => newXScale(d.date));
          benchmarkPath.attr('d', lineBenchmark);
        }

        areaGenerator.x(d => newXScale(d.date));
        areaPath.attr('d', areaGenerator);

        // Update dots positions
        updateDots(newXScale);
      });

    svg.call(zoomBehavior as any);

    // Zoom Button Handlers attached to window/element
    const resetBtn = document.getElementById('reset-line-zoom-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        svg.transition().duration(750).call(zoomBehavior.transform as any, d3.zoomIdentity);
      };
    }

    const zoomInBtn = document.getElementById('zoom-in-line-btn');
    if (zoomInBtn) {
      zoomInBtn.onclick = () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 1.4);
      };
    }

    const zoomOutBtn = document.getElementById('zoom-out-line-btn');
    if (zoomOutBtn) {
      zoomOutBtn.onclick = () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy as any, 0.7);
      };
    }

    // Hover mouse tracking
    overlay
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);
        const xDate = currentXScale.invert(mouseX);

        // Bisector to find closest data point
        const bisect = d3.bisector((d: RentTrendPoint) => d.date).left;
        const index = bisect(trendData, xDate, 1);
        const d0 = trendData[index - 1];
        const d1 = trendData[index];
        let d = d0;
        if (d1 && d0) {
          d = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
        }

        if (d) {
          const xPos = currentXScale(d.date);
          const yPos = yScale(d.portfolioRent);

          hoverLine.attr('x1', xPos).attr('x2', xPos).style('opacity', 1);
          hoverDot.attr('cx', xPos).attr('cy', yPos).style('opacity', 1);

          setHoveredPoint(d);
        }
      })
      .on('mouseleave', () => {
        hoverLine.style('opacity', 0);
        hoverDot.style('opacity', 0);
        setHoveredPoint(null);
      });

  }, [tenant, timeHorizon, showBenchmark, customTrendData]);

  // ── Render D3 Bar Chart (Property Growth) ──────────────────────
  useEffect(() => {
    if (!barChartRef.current || !barContainerRef.current) return;

    const container = barContainerRef.current;
    const svg = d3.select(barChartRef.current);
    svg.selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = 280;
    const margin = { top: 20, right: 30, bottom: 50, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
      .domain(propertyGrowthData.map(d => d.name))
      .range([0, innerHeight])
      .padding(0.35);

    const maxGrowth = d3.max(propertyGrowthData, d => d.growthPct) || 10;
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(12, maxGrowth * 1.25)])
      .range([0, innerWidth]);

    // Gridlines
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(innerHeight)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .style('stroke', 'rgba(255,255,255,0.05)')
      .style('stroke-dasharray', '3,3')
      .call(xAxisGrid)
      .selectAll('.domain').remove();

    // Bars
    const bars = g.selectAll('.bar')
      .data(propertyGrowthData)
      .enter()
      .append('g');

    bars.append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.name)!)
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', 0) // Start at 0 for animation
      .attr('rx', 6)
      .attr('fill', (d, i) => i === 0 ? 'url(#bar-gradient-primary)' : 'url(#bar-gradient-secondary)')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHoveredProperty(d))
      .on('mouseleave', () => setHoveredProperty(null))
      .transition()
      .duration(800)
      .delay((_, i) => i * 150)
      .attr('width', d => xScale(d.growthPct));

    // Defs for Bar Gradients
    const defs = svg.append('defs');

    const gradPrimary = defs.append('linearGradient')
      .attr('id', 'bar-gradient-primary')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    gradPrimary.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8');
    gradPrimary.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb');

    const gradSecondary = defs.append('linearGradient')
      .attr('id', 'bar-gradient-secondary')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    gradSecondary.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradSecondary.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Values on bars
    bars.append('text')
      .attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2 + 4)
      .attr('x', d => xScale(d.growthPct) + 8)
      .attr('fill', '#f1f5f9')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text(d => `+${d.growthPct}%`);

    // Axes
    const yAxis = d3.axisLeft(yScale);
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => `+${d}%`);

    g.append('g')
      .call(yAxis)
      .style('color', '#cbd5e1')
      .style('font-size', '12px')
      .selectAll('.domain').remove();

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .style('color', '#64748b')
      .style('font-size', '11px')
      .selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

  }, [tenant, customPropertyGrowthData]);

  // ── Render D3 Unit-Level Occupancy Chart (Multi-Series Line or Heatmap Matrix) ──
  useEffect(() => {
    if (!unitChartRef.current || !unitContainerRef.current) return;

    const container = unitContainerRef.current;
    const svg = d3.select(unitChartRef.current);
    svg.selectAll('*').remove();

    const rawData = generateUnitLevelOccupancyData(tenant);
    const filteredData = selectedPropertyFilter === 'ALL'
      ? rawData
      : rawData.filter(d => d.propertyId === selectedPropertyFilter);

    const width = container.clientWidth || 600;

    if (unitChartMode === 'trend') {
      const height = 360;
      const margin = { top: 30, right: 30, bottom: 40, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const defs = svg.append('defs');
      const clipId = `unit-chart-clip-${Math.floor(Math.random() * 1000000)}`;
      defs.append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight);

      // Group by property + unitTier
      const seriesMap = d3.group(filteredData, d => `${d.propertyName} — ${d.unitTier}`);
      const seriesKeys = Array.from(seriesMap.keys());

      const dates = Array.from(new Set(filteredData.map(d => d.date.getTime()))).sort().map(t => new Date(t));

      const xScale = d3.scaleTime()
        .domain(d3.extent(dates) as [Date, Date])
        .range([0, innerWidth]);

      let currentXScale = xScale;

      const yScale = d3.scaleLinear()
        .domain([70, 100])
        .range([innerHeight, 0]);

      // Gridlines
      const yAxisGrid = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
        .ticks(6);

      g.append('g')
        .attr('class', 'grid')
        .style('stroke', 'rgba(255,255,255,0.06)')
        .style('stroke-dasharray', '3,3')
        .call(yAxisGrid)
        .selectAll('.domain').remove();

      // Target 95.0% line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(95))
        .attr('y2', yScale(95))
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0.7);

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', yScale(95) - 6)
        .attr('fill', '#10b981')
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('font-weight', '700')
        .text('95.0% Target Occupancy');

      const chartBody = g.append('g').attr('clip-path', `url(#${clipId})`);

      const colorPalette = ['#38bdf8', '#10b981', '#a78bfa', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e'];

      seriesKeys.forEach((key, idx) => {
        const seriesPoints = seriesMap.get(key) || [];
        const color = colorPalette[idx % colorPalette.length];

        const lineGen = d3.line<UnitOccupancyPoint>()
          .x(d => currentXScale(d.date))
          .y(d => yScale(d.occupancyRate))
          .curve(d3.curveMonotoneX);

        const path = chartBody.append('path')
          .datum(seriesPoints)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2.5)
          .attr('d', lineGen);

        const totalLen = (path.node() as SVGPathElement)?.getTotalLength() || 0;
        path.attr('stroke-dasharray', `${totalLen} ${totalLen}`)
          .attr('stroke-dashoffset', totalLen)
          .transition()
          .duration(900)
          .delay(idx * 80)
          .attr('stroke-dashoffset', 0);

        // Dots
        chartBody.selectAll(`.dot-${idx}`)
          .data(seriesPoints)
          .enter()
          .append('circle')
          .attr('class', `dot-${idx}`)
          .attr('r', 3.5)
          .attr('cx', d => currentXScale(d.date))
          .attr('cy', d => yScale(d.occupancyRate))
          .attr('fill', '#0f172a')
          .attr('stroke', color)
          .attr('stroke-width', 2);
      });

      // Axes
      const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d => d3.timeFormat('%b %y')(d as Date));
      const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d}%`);

      const xAxisGroup = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .style('color', '#64748b')
        .style('font-size', '11px');
      xAxisGroup.selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

      g.append('g')
        .call(yAxis)
        .style('color', '#64748b')
        .style('font-size', '11px')
        .selectAll('.domain').style('stroke', 'rgba(255,255,255,0.1)');

      // Overlay hover tracking
      const hoverLine = chartBody.append('line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'rgba(255,255,255,0.3)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2')
        .style('opacity', 0);

      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'crosshair')
        .on('mousemove', (event) => {
          const [mouseX] = d3.pointer(event);
          const xDate = currentXScale.invert(mouseX);

          const bisect = d3.bisector((d: UnitOccupancyPoint) => d.date).left;
          const sampleSeries = filteredData;
          const idx = bisect(sampleSeries, xDate, 1);
          const d0 = sampleSeries[idx - 1];
          const d1 = sampleSeries[idx];
          let closest = d0;
          if (d1 && d0) {
            closest = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
          }
          if (closest) {
            const xPos = currentXScale(closest.date);
            hoverLine.attr('x1', xPos).attr('x2', xPos).style('opacity', 1);
            setHoveredUnitPoint(closest);
          }
        })
        .on('mouseleave', () => {
          hoverLine.style('opacity', 0);
          setHoveredUnitPoint(null);
        });

      // Zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 6])
        .translateExtent([[0, 0], [innerWidth, innerHeight]])
        .on('zoom', (e) => {
          const newX = e.transform.rescaleX(xScale);
          currentXScale = newX;

          xAxisGroup.call(d3.axisBottom(newX).ticks(8).tickFormat(d => d3.timeFormat('%b %y')(d as Date)));

          seriesKeys.forEach((key, idx) => {
            const seriesPoints = seriesMap.get(key) || [];
            const color = colorPalette[idx % colorPalette.length];
            const lineGen = d3.line<UnitOccupancyPoint>()
              .x(d => newX(d.date))
              .y(d => yScale(d.occupancyRate))
              .curve(d3.curveMonotoneX);

            chartBody.selectAll('path').filter((_, i) => i === idx).attr('d', lineGen as any);

            chartBody.selectAll(`.dot-${idx}`)
              .data(seriesPoints)
              .attr('cx', d => newX(d.date));
          });
        });

      svg.call(zoom as any);

      const resetBtn = document.getElementById('reset-unit-zoom-btn');
      if (resetBtn) resetBtn.onclick = () => svg.transition().duration(750).call(zoom.transform as any, d3.zoomIdentity);
      const zoomInBtn = document.getElementById('zoom-in-unit-btn');
      if (zoomInBtn) zoomInBtn.onclick = () => svg.transition().duration(300).call(zoom.scaleBy as any, 1.4);
      const zoomOutBtn = document.getElementById('zoom-out-unit-btn');
      if (zoomOutBtn) zoomOutBtn.onclick = () => svg.transition().duration(300).call(zoom.scaleBy as any, 0.7);

    } else {
      // Temporal Heatmap View
      let processedData: UnitOccupancyPoint[] = [];

      if (heatmapGranularity === 'property') {
        const groupedByPropMonth = d3.group(filteredData, d => d.propertyId, d => d.monthLabel);

        groupedByPropMonth.forEach((monthsGroup, propId) => {
          monthsGroup.forEach((pts, mLabel) => {
            const firstPt = pts[0];
            const totalUnits = d3.sum(pts, d => d.totalUnits);
            const occupiedUnits = d3.sum(pts, d => d.occupiedUnits);
            const occupancyRate = Number(((occupiedUnits / (totalUnits || 1)) * 100).toFixed(1));
            const revenueLoss = d3.sum(pts, d => d.revenueLoss);

            processedData.push({
              date: firstPt.date,
              monthLabel: mLabel,
              propertyId: propId,
              propertyName: firstPt.propertyName,
              unitTier: 'Portfolio Property Aggregate',
              totalUnits,
              occupiedUnits,
              occupancyRate,
              revenueLoss,
            });
          });
        });
      } else {
        processedData = [...filteredData];
      }

      const seriesMap = d3.group(processedData, d =>
        heatmapGranularity === 'property' ? d.propertyName : `${d.propertyName} — ${d.unitTier}`
      );
      const seriesKeys = Array.from(seriesMap.keys());

      // Linear Regression 6-Month Projected Forecast
      if (showHeatmapForecast) {
        seriesKeys.forEach((key) => {
          const pts = seriesMap.get(key) || [];
          pts.sort((a, b) => a.date.getTime() - b.date.getTime());

          if (pts.length >= 2) {
            const N = pts.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            pts.forEach((p, idx) => {
              sumX += idx;
              sumY += p.occupancyRate;
              sumXY += idx * p.occupancyRate;
              sumXX += idx * idx;
            });

            const slope = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX || 1);
            const intercept = (sumY - slope * sumX) / N;

            const lastHistorical = pts[N - 1];
            const avgRentPerVacantUnit = lastHistorical.totalUnits > lastHistorical.occupiedUnits
              ? Math.round(lastHistorical.revenueLoss / (lastHistorical.totalUnits - lastHistorical.occupiedUnits))
              : Math.round((tenant.monthlyRent / tenant.units) * 0.9);

            for (let k = 1; k <= 6; k++) {
              const xVal = (N - 1) + k;
              const rawProj = slope * xVal + intercept;
              const projectedRate = Number(Math.min(100, Math.max(70, rawProj)).toFixed(1));

              const futureDate = new Date(lastHistorical.date.getFullYear(), lastHistorical.date.getMonth() + k, 1);
              const futureMonthLabel = futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

              const occupiedUnits = Math.min(lastHistorical.totalUnits, Math.max(0, Math.round((projectedRate / 100) * lastHistorical.totalUnits)));
              const vacantUnits = lastHistorical.totalUnits - occupiedUnits;
              const revenueLoss = Math.round(vacantUnits * avgRentPerVacantUnit);

              const forecastPt: UnitOccupancyPoint = {
                date: futureDate,
                monthLabel: futureMonthLabel,
                propertyId: lastHistorical.propertyId,
                propertyName: lastHistorical.propertyName,
                unitTier: lastHistorical.unitTier,
                totalUnits: lastHistorical.totalUnits,
                occupiedUnits,
                occupancyRate: projectedRate,
                revenueLoss,
                isForecast: true,
                regressionSlope: Number(slope.toFixed(2)),
              };

              pts.push(forecastPt);
              processedData.push(forecastPt);
            }
          }
        });
      }

      const months = Array.from(new Set(processedData.map(d => d.monthLabel)));

      // Calculate MoM Delta for each series
      seriesKeys.forEach((key) => {
        const points = seriesMap.get(key) || [];
        points.sort((a, b) => a.date.getTime() - b.date.getTime());
        points.forEach((pt, i) => {
          if (i > 0) {
            pt.momDelta = Number((pt.occupancyRate - points[i - 1].occupancyRate).toFixed(1));
          } else {
            pt.momDelta = 0;
          }
        });
      });

      const rowHeight = heatmapGranularity === 'property' ? 52 : 42;
      const height = Math.max(300, seriesKeys.length * rowHeight + 80);
      const margin = { top: 40, right: 30, bottom: 40, left: heatmapGranularity === 'property' ? 180 : 230 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleBand().domain(months).range([0, innerWidth]).padding(0.08);
      const yScale = d3.scaleBand().domain(seriesKeys).range([0, innerHeight]).padding(0.12);

      const getCellColor = (val: number, isForecast?: boolean) => {
        if (isForecast) {
          if (val >= 96) return 'rgba(6,95,70,0.85)';
          if (val >= 92) return 'rgba(2,132,199,0.85)';
          if (val >= 88) return 'rgba(180,83,9,0.85)';
          return 'rgba(153,27,27,0.85)';
        }
        if (val >= 96) return '#065f46';
        if (val >= 92) return '#0284c7';
        if (val >= 88) return '#b45309';
        return '#991b1b';
      };

      const getCellBorder = (val: number, isForecast?: boolean) => {
        if (isForecast) return '#c084fc'; // Purple accent border for forecast cells
        if (val >= 96) return '#10b981';
        if (val >= 92) return '#38bdf8';
        if (val >= 88) return '#f59e0b';
        return '#ef4444';
      };

      // Draw vertical month column guides
      months.forEach(m => {
        const xPos = xScale(m)! + xScale.bandwidth() / 2;
        g.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', 'rgba(255,255,255,0.05)')
          .attr('stroke-dasharray', '2,2');
      });

      // Historical vs Forecast Divider Line
      if (showHeatmapForecast && months.length > 12) {
        const m11 = months[11];
        const m12 = months[12];
        if (xScale(m11) !== undefined && xScale(m12) !== undefined) {
          const dividerX = xScale(m11)! + xScale.bandwidth() + (xScale(m12)! - (xScale(m11)! + xScale.bandwidth())) / 2;

          g.append('line')
            .attr('x1', dividerX)
            .attr('x2', dividerX)
            .attr('y1', -20)
            .attr('y2', innerHeight + 6)
            .attr('stroke', '#a855f7')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,3');

          g.append('text')
            .attr('x', dividerX - 8)
            .attr('y', -24)
            .attr('text-anchor', 'end')
            .attr('fill', '#94a3b8')
            .style('font-size', '10px')
            .style('font-weight', '700')
            .text('◄ 12-Month Historical');

          g.append('text')
            .attr('x', dividerX + 8)
            .attr('y', -24)
            .attr('text-anchor', 'start')
            .attr('fill', '#c084fc')
            .style('font-size', '10px')
            .style('font-weight', '700')
            .text('6-Mo Regression Forecast ►');
        }
      }

      seriesKeys.forEach((key, rowIdx) => {
        const points = seriesMap.get(key) || [];
        points.forEach((pt) => {
          const cellG = g.append('g')
            .style('cursor', 'pointer')
            .on('mouseenter', (event) => {
              d3.select(event.currentTarget).select('rect')
                .attr('stroke', pt.isForecast ? '#e9d5ff' : '#ffffff')
                .attr('stroke-width', 2.5)
                .style('filter', 'drop-shadow(0 0 10px rgba(168,85,247,0.5))');
              setHoveredUnitPoint(pt);
            })
            .on('mouseleave', (event) => {
              d3.select(event.currentTarget).select('rect')
                .attr('stroke', getCellBorder(pt.occupancyRate, pt.isForecast))
                .attr('stroke-width', pt.isForecast ? 1.5 : 1)
                .style('filter', 'none');
              setHoveredUnitPoint(null);
            });

          const rect = cellG.append('rect')
            .attr('x', xScale(pt.monthLabel)!)
            .attr('y', yScale(key)!)
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 6)
            .attr('fill', getCellColor(pt.occupancyRate, pt.isForecast))
            .attr('stroke', getCellBorder(pt.occupancyRate, pt.isForecast))
            .attr('stroke-width', pt.isForecast ? 1.5 : 1)
            .style('opacity', 0);

          if (pt.isForecast) {
            rect.attr('stroke-dasharray', '3,2');
          }

          rect.transition()
            .duration(400)
            .delay(rowIdx * 30)
            .style('opacity', 0.92);

          cellG.append('text')
            .attr('x', xScale(pt.monthLabel)! + xScale.bandwidth() / 2)
            .attr('y', yScale(key)! + yScale.bandwidth() / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', pt.isForecast ? '#e9d5ff' : '#ffffff')
            .style('font-size', '11px')
            .style('font-weight', '700')
            .text(`${pt.occupancyRate}%${pt.isForecast ? ' *' : ''}`);
        });
      });

      // Axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .style('color', '#64748b')
        .style('font-size', '11px')
        .selectAll('.domain').remove();

      g.append('g')
        .call(yAxis)
        .style('color', '#f1f5f9')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .selectAll('.domain').remove();
    }
  }, [tenant, selectedPropertyFilter, unitChartMode, heatmapGranularity, showHeatmapForecast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Print-Only CSS Styles */}
      <style>{`
        @media print {
          body {
            background: #0f172a !important;
            color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, nav, header, sidebar, button {
            display: none !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #39bff6;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          svg {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* Printable Report Title Header */}
      <div className="print-header">
        <h1 style={{ margin: 0, fontSize: 22, color: '#39bff6' }}>
          Executive Market Performance & Yield Analytics Report
        </h1>
        <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>
          Portfolio: <strong>{tenant.name}</strong> | Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Header Bar & Filters ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '16px 20px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📈</span> Market Performance & Rent Analytics
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
            Interactive D3 visualization comparing {tenant.name} yield trends against regional property indices.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Horizon Selector */}
          <div className="no-print" style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['6M', '1Y', '3Y', '5Y'] as TimeHorizon[]).map((hz) => (
              <button
                key={hz}
                onClick={() => setTimeHorizon(hz)}
                style={{
                  background: timeHorizon === hz ? '#39bff6' : 'transparent',
                  color: timeHorizon === hz ? '#0f172a' : '#64748b',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {hz}
              </button>
            ))}
          </div>

          {/* Benchmark Toggle */}
          <button
            onClick={() => setShowBenchmark((prev) => !prev)}
            className="no-print"
            style={{
              background: showBenchmark ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
              color: showBenchmark ? '#a78bfa' : '#64748b',
              border: `1px solid ${showBenchmark ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {showBenchmark ? '✓ Regional Benchmark' : '+ Compare Benchmark'}
          </button>

          {/* CSV Download Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="no-print"
            id="download-csv-btn"
            title="Export occupancy rates and rent trend dataset as structured CSV"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.45)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(16,185,129,0.15)',
            }}
          >
            📥 Download CSV
          </button>

          {/* Download CSV Template Button */}
          <button
            onClick={downloadCsvTemplate}
            className="no-print"
            id="download-template-btn"
            title="Download formatted CSV template with required headers (date, occupancy_rate, property_id) and dummy data"
            style={{
              background: 'rgba(56,189,248,0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(56,189,248,0.12)',
            }}
          >
            📄 Download Template
          </button>

          {/* Import CSV Button */}
          <div className="no-print" style={{ position: 'relative' }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="header-csv-upload"
            />
            <label
              htmlFor="header-csv-upload"
              title="Import property dataset from a CSV file"
              style={{
                background: 'rgba(56,189,248,0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.35)',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(56,189,248,0.15)',
                margin: 0,
              }}
            >
              📁 Import CSV
            </label>
          </div>

          {/* Import Tips & Guided Tour Button */}
          <button
            onClick={() => setShowTourModal(true)}
            className="no-print"
            title="Interactive CSV formatting guide & template generator"
            style={{
              background: 'rgba(167,139,250,0.15)',
              color: '#a78bfa',
              border: '1px solid rgba(167,139,250,0.35)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💡 Import Tips & Tour
          </button>

          {/* Print Dashboard Button */}
          <button
            onClick={() => window.print()}
            className="no-print"
            id="print-dashboard-btn"
            title="Print or save currently rendered D3 charts as PDF report"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            🖨️ Print Dashboard
          </button>
        </div>
      </div>

      {/* Active Custom Dataset Banner */}
      {customFileName && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(37,99,235,0.12))',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: 12,
          padding: '12px 18px',
          color: '#38bdf8',
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>
                Custom Dataset Active: <span style={{ color: '#38bdf8' }}>{customFileName}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Visualizing user-uploaded market rent metrics across D3 interactive charts.
              </div>
            </div>
          </div>

          <button
            onClick={handleResetData}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#f1f5f9',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset to Default Portfolio
          </button>
        </div>
      )}

      {/* ── Key Metrics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(57,191,246,0.2)',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Average Rent / Unit
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#39bff6', marginTop: 6 }}>
            {tenant.currency} {avgPortfolioRent.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>▲ +{totalRentGrowthPct}%</span>
            <span style={{ color: '#64748b' }}>({timeHorizon} Growth)</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Market Rent Benchmark
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', marginTop: 6 }}>
            {tenant.currency} {avgMarketRent.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: Number(outperformancePct) >= 0 ? '#10b981' : '#f87171', marginTop: 4 }}>
            {Number(outperformancePct) >= 0 ? `+${outperformancePct}% Outperformance` : `${outperformancePct}% Lagging`}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            NOI Yield Index
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 6 }}>
            {tenant.noi.toFixed(1)}%
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Market Median: 68.5%
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Occupancy Efficiency
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 6 }}>
            {tenant.occupancy}%
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>
            High Density Target (&gt;92%)
          </div>
        </div>
      </div>

      {/* ── Interactive CSV Import Tips & Schema Explorer ── */}
      {showImportTipsBanner && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                  CSV Import Tips & Header Schema Guide
                </h3>
                <span style={{
                  background: 'rgba(167, 139, 250, 0.2)',
                  color: '#c084fc',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  borderRadius: 20,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  Rent Trend Dataset
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', maxWidth: 680 }}>
                Click or hover any required column header below to inspect format rules, expected data types, and parser auto-aliases for custom CSV rent data.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => copyHeaderRow('date,occupancy_rate,property_id,portfolio_rent,market_benchmark')}
                style={{
                  background: copiedHeader ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                  color: copiedHeader ? '#34d399' : '#e2e8f0',
                  border: copiedHeader ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <span>{copiedHeader ? '✓ Copied!' : '📋 Copy Header Row'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTourModal(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(124,58,237,0.25))',
                  color: '#c084fc',
                  border: '1px solid rgba(167,139,250,0.45)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(167,139,250,0.15)',
                }}
              >
                <span>🚀 Launch Guided Tour</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportTipsBanner(false)}
                title="Dismiss tips guide"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Interactive Header Column Badges */}
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 16,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {[
              { id: 'date', name: 'date', req: true, type: 'ISO Date (YYYY-MM-DD)', example: '2025-01-01', desc: 'Timestamp or month label for rent trend chronological sorting.' },
              { id: 'occupancy_rate', name: 'occupancy_rate', req: true, type: 'Numeric (%)', example: '95.2', desc: 'Portfolio or property occupancy percentage value (80–100 or 0.8–1.0).' },
              { id: 'property_id', name: 'property_id', req: false, type: 'Text / ID', example: 'PROP-101', desc: 'Unique identifier or building name for multi-property filtering.' },
              { id: 'portfolio_rent', name: 'portfolio_rent', req: false, type: 'Currency ($)', example: '2150', desc: 'Average achieved monthly rent amount per unit in local currency.' },
              { id: 'market_benchmark', name: 'market_benchmark', req: false, type: 'Currency ($)', example: '2010', desc: 'Regional submarket benchmark rent for yield comparison.' },
            ].map(col => {
              const isActive = activeHeaderTip === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setActiveHeaderTip(col.id)}
                  onMouseEnter={() => setActiveHeaderTip(col.id)}
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#38bdf8' : '#e2e8f0',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{col.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: col.req ? 'rgba(239, 68, 68, 0.25)' : 'rgba(148, 163, 184, 0.2)',
                    color: col.req ? '#fca5a5' : '#94a3b8',
                    border: col.req ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(148, 163, 184, 0.3)',
                    fontFamily: 'sans-serif',
                  }}>
                    {col.req ? 'Required' : 'Optional'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Header Detail Card Callout */}
          {activeHeaderTip && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px dashed rgba(56, 189, 248, 0.35)',
              borderRadius: 12,
              padding: '14px 18px',
              fontSize: 12,
              color: '#cbd5e1',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px 20px',
              alignItems: 'center',
            }}>
              {activeHeaderTip === 'date' && (
                <>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block', marginBottom: 2 }}>
                      Column: <code>date</code>
                    </strong>
                    <span style={{ color: '#94a3b8' }}>Chronological date or month indicator used for plotting the X-axis time series.</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Expected Format:</span>
                    <code style={{ color: '#f1f5f9' }}>YYYY-MM-DD</code> or <code style={{ color: '#f1f5f9' }}>Month Year</code>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Supported Aliases:</span>
                    <span style={{ color: '#a78bfa' }}>date, Date, month, Month, Year</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Example Value:</span>
                    <code style={{ color: '#34d399' }}>2025-01-01</code>
                  </div>
                </>
              )}

              {activeHeaderTip === 'occupancy_rate' && (
                <>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block', marginBottom: 2 }}>
                      Column: <code>occupancy_rate</code>
                    </strong>
                    <span style={{ color: '#94a3b8' }}>Occupancy percentage mapped to D3 secondary overlay and unit heatmap matrix.</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Expected Format:</span>
                    <code style={{ color: '#f1f5f9' }}>95.2</code> (%) or <code style={{ color: '#f1f5f9' }}>0.952</code> (Decimal)
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Supported Aliases:</span>
                    <span style={{ color: '#a78bfa' }}>occupancy_rate, occupancyRate, OccupancyRate, occupancy</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Example Value:</span>
                    <code style={{ color: '#34d399' }}>95.8</code>
                  </div>
                </>
              )}

              {activeHeaderTip === 'property_id' && (
                <>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block', marginBottom: 2 }}>
                      Column: <code>property_id</code>
                    </strong>
                    <span style={{ color: '#94a3b8' }}>Identifies specific portfolio properties for unit heatmap & property filter dropdown.</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Expected Format:</span>
                    <code style={{ color: '#f1f5f9' }}>String / ID</code>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Supported Aliases:</span>
                    <span style={{ color: '#a78bfa' }}>property_id, propertyId, PropertyId, property_name, property</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Example Value:</span>
                    <code style={{ color: '#34d399' }}>PROP-101</code>
                  </div>
                </>
              )}

              {activeHeaderTip === 'portfolio_rent' && (
                <>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block', marginBottom: 2 }}>
                      Column: <code>portfolio_rent</code>
                    </strong>
                    <span style={{ color: '#94a3b8' }}>Monthly rent per unit rendered as primary solid line in D3 trend chart.</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Expected Format:</span>
                    <code style={{ color: '#f1f5f9' }}>Raw Number</code> (No dollar signs or commas)
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Supported Aliases:</span>
                    <span style={{ color: '#a78bfa' }}>portfolio_rent, portfolioRent, PortfolioRent, rent, rate</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Example Value:</span>
                    <code style={{ color: '#34d399' }}>2150</code>
                  </div>
                </>
              )}

              {activeHeaderTip === 'market_benchmark' && (
                <>
                  <div>
                    <strong style={{ color: '#38bdf8', fontSize: 13, display: 'block', marginBottom: 2 }}>
                      Column: <code>market_benchmark</code>
                    </strong>
                    <span style={{ color: '#94a3b8' }}>Regional submarket average rent rendered as purple dashed line.</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Expected Format:</span>
                    <code style={{ color: '#f1f5f9' }}>Raw Number</code>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Supported Aliases:</span>
                    <span style={{ color: '#a78bfa' }}>market_benchmark, marketBenchmark, MarketBenchmark, benchmark</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block' }}>Example Value:</span>
                    <code style={{ color: '#34d399' }}>2010</code>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Action Footer inside Tips */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>
              💡 Quick Header String: <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4 }}>date,occupancy_rate,property_id,portfolio_rent,market_benchmark</code>
            </span>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => downloadMarketPerformanceCsv('full')}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                📥 Export Dataset CSV
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                📥 Download Template .CSV
              </button>
              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: 'none',
                  color: '#0f172a',
                  padding: '5px 14px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(56,189,248,0.25)',
                }}
              >
                📁 Open Upload Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Line Chart (D3 Rent Trends) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
              Historical Rent Trend & Benchmark Trajectory
            </h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>Hover over data points to inspect monthly yield breakdown</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
            {/* Zoom Controls */}
            <div className="no-print" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '2px 4px',
            }}>
              <span style={{ fontSize: 11, color: '#64748b', padding: '0 6px', fontWeight: 600 }}>🔍 Zoom & Pan</span>
              <button
                id="zoom-in-line-btn"
                title="Zoom In"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: 4,
                  width: 26,
                  height: 24,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>
              <button
                id="zoom-out-line-btn"
                title="Zoom Out"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: 4,
                  width: 26,
                  height: 24,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                −
              </button>
              <button
                id="reset-line-zoom-btn"
                title="Reset Zoom View"
                style={{
                  background: 'rgba(57,191,246,0.15)',
                  color: '#39bff6',
                  border: '1px solid rgba(57,191,246,0.3)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  height: 24,
                }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 3, background: '#39bff6', borderRadius: 2 }} />
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{tenant.name}</span>
            </div>
            {showBenchmark && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 2, background: '#a78bfa', borderTop: '1px dashed #a78bfa' }} />
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>Regional Market</span>
              </div>
            )}
          </div>
        </div>

        {/* D3 SVG Container */}
        <div ref={lineContainerRef} style={{ width: '100%', minHeight: 320, position: 'relative' }}>
          <svg ref={lineChartRef} style={{ width: '100%', height: 320, overflow: 'visible' }} />

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 16,
              background: '#0f172a',
              border: '1px solid rgba(57,191,246,0.4)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#f1f5f9',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <div style={{ fontWeight: 700, color: '#39bff6', marginBottom: 4 }}>
                {hoveredPoint.label} ({hoveredPoint.date.getFullYear()})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <span style={{ color: '#94a3b8' }}>Portfolio Rent:</span>
                <strong style={{ color: '#ffffff', textAlign: 'right' }}>{tenant.currency} {hoveredPoint.portfolioRent.toLocaleString()}</strong>
                <span style={{ color: '#94a3b8' }}>Market Rent:</span>
                <strong style={{ color: '#a78bfa', textAlign: 'right' }}>{tenant.currency} {hoveredPoint.marketBenchmark.toLocaleString()}</strong>
                <span style={{ color: '#94a3b8' }}>Occupancy:</span>
                <strong style={{ color: '#10b981', textAlign: 'right' }}>{hoveredPoint.occupancyRate.toFixed(1)}%</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Occupancy Rate Trend (Recharts) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              📈 Occupancy Rate Trend
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              Historical portfolio occupancy based on current dataset.
            </p>
          </div>
        </div>
        <MarketPerformanceChart data={trendData} />
      </div>

      {/* ── Property Growth Bar Chart (D3) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '20px 24px',
      }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
            Property Growth & Annual Appreciation Rates
          </h3>
          <span style={{ fontSize: 11, color: '#64748b' }}>Individual asset annual rent growth vs portfolio average</span>
        </div>

        <div ref={barContainerRef} style={{ width: '100%', minHeight: 280, position: 'relative' }}>
          <svg ref={barChartRef} style={{ width: '100%', height: 280, overflow: 'visible' }} />

          {hoveredProperty && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 16,
              background: '#0f172a',
              border: '1px solid rgba(56,189,248,0.4)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#f1f5f9',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
                {hoveredProperty.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <span style={{ color: '#94a3b8' }}>Annual Growth:</span>
                <strong style={{ color: '#10b981', textAlign: 'right' }}>+{hoveredProperty.growthPct}%</strong>
                <span style={{ color: '#94a3b8' }}>Total Units:</span>
                <strong style={{ color: '#ffffff', textAlign: 'right' }}>{hoveredProperty.units} units</strong>
                <span style={{ color: '#94a3b8' }}>Occupancy Rate:</span>
                <strong style={{ color: '#a78bfa', textAlign: 'right' }}>{hoveredProperty.occupancy}%</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 12-Month Unit-Level Occupancy Analytics (D3 Chart) ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 16,
        padding: '20px 24px',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                Unit-Level Occupancy Analytics (12-Month Historical Trajectory)
              </h3>
              <span style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                Live Property Dataset
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
              Unit-level occupancy rate trends over the last 12 months across {tenant.properties.length} portfolio properties ({tenant.units} total units).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Property Filter Selector */}
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="no-print"
              style={{
                background: '#0f172a',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.35)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">All Properties ({tenant.properties.length})</option>
              {tenant.properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.units} units)</option>
              ))}
            </select>

            {/* Mode Switcher */}
            <div className="no-print" style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setUnitChartMode('trend')}
                style={{
                  background: unitChartMode === 'trend' ? '#10b981' : 'transparent',
                  color: unitChartMode === 'trend' ? '#0f172a' : '#94a3b8',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📈 Line Trajectory
              </button>
              <button
                type="button"
                onClick={() => setUnitChartMode('heatmap')}
                style={{
                  background: unitChartMode === 'heatmap' ? '#10b981' : 'transparent',
                  color: unitChartMode === 'heatmap' ? '#0f172a' : '#94a3b8',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🧱 Heatmap Matrix
              </button>
            </div>

            {/* Granularity Switcher & Forecast Toggle for Heatmap Mode */}
            {unitChartMode === 'heatmap' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div className="no-print" style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setHeatmapGranularity('property')}
                    style={{
                      background: heatmapGranularity === 'property' ? '#38bdf8' : 'transparent',
                      color: heatmapGranularity === 'property' ? '#0f172a' : '#94a3b8',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🏢 Property Level
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapGranularity('unit')}
                    style={{
                      background: heatmapGranularity === 'unit' ? '#38bdf8' : 'transparent',
                      color: heatmapGranularity === 'unit' ? '#0f172a' : '#94a3b8',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🏷️ Category Level
                  </button>
                </div>

                <button
                  type="button"
                  className="no-print"
                  onClick={() => setShowHeatmapForecast(!showHeatmapForecast)}
                  style={{
                    background: showHeatmapForecast ? 'rgba(168,85,247,0.2)' : 'rgba(0,0,0,0.4)',
                    color: showHeatmapForecast ? '#c084fc' : '#94a3b8',
                    border: showHeatmapForecast ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    padding: '5px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>🔮 6-Mo Forecast</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: showHeatmapForecast ? '#a855f7' : '#475569', color: '#fff' }}>
                    {showHeatmapForecast ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}

            {/* Zoom Controls for Line Mode */}
            {unitChartMode === 'trend' && (
              <div className="no-print" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '2px 4px',
              }}>
                <button type="button" id="zoom-in-unit-btn" title="Zoom In" style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: 'none', borderRadius: 4, width: 24, height: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
                <button type="button" id="zoom-out-unit-btn" title="Zoom Out" style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: 'none', borderRadius: 4, width: 24, height: 22, fontWeight: 700, cursor: 'pointer' }}>−</button>
                <button type="button" id="reset-unit-zoom-btn" title="Reset View" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Spectrum Legend Bar */}
        {unitChartMode === 'heatmap' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>12-Month Occupancy Spectrum:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#991b1b', border: '1px solid #ef4444' }}></span> &lt;88% At Risk
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#b45309', border: '1px solid #f59e0b' }}></span> 88–91.9% Sub-Optimal
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0284c7', border: '1px solid #38bdf8' }}></span> 92–95.9% Target
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#065f46', border: '1px solid #10b981' }}></span> 96%+ Peak Yield
              </span>
            </div>

            <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              Hover over cells to inspect monthly vacancies, MoM deltas, and estimated revenue loss.
            </div>
          </div>
        )}

        {/* D3 Unit SVG Container */}
        <div ref={unitContainerRef} style={{ width: '100%', minHeight: 300, position: 'relative' }}>
          <svg ref={unitChartRef} style={{ width: '100%', minHeight: 300, overflow: 'visible' }} />

          {/* Interactive Unit Tooltip */}
          {hoveredUnitPoint && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 16,
              background: '#0f172a',
              border: hoveredUnitPoint.isForecast ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(16,185,129,0.4)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 12,
              color: '#f1f5f9',
              pointerEvents: 'none',
              zIndex: 10,
              maxWidth: 320,
            }}>
              {hoveredUnitPoint.isForecast ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(168,85,247,0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  marginBottom: 6,
                }}>
                  🔮 6-Mo Linear Regression Forecast
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  marginBottom: 6,
                }}>
                  📊 Historical Record
                </div>
              )}

              <div style={{ fontWeight: 700, color: hoveredUnitPoint.isForecast ? '#e9d5ff' : '#10b981', marginBottom: 2 }}>
                {hoveredUnitPoint.propertyName}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                {hoveredUnitPoint.unitTier} — {hoveredUnitPoint.monthLabel}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                <span style={{ color: '#94a3b8' }}>Occupancy Rate:</span>
                <strong style={{ color: hoveredUnitPoint.isForecast ? '#c084fc' : '#10b981', textAlign: 'right' }}>
                  {hoveredUnitPoint.occupancyRate}%{hoveredUnitPoint.isForecast ? ' (Proj)' : ''}
                </strong>
                {hoveredUnitPoint.regressionSlope !== undefined && (
                  <>
                    <span style={{ color: '#94a3b8' }}>Trend Slope (m):</span>
                    <strong style={{
                      color: hoveredUnitPoint.regressionSlope > 0 ? '#10b981' : hoveredUnitPoint.regressionSlope < 0 ? '#f87171' : '#94a3b8',
                      textAlign: 'right'
                    }}>
                      {hoveredUnitPoint.regressionSlope > 0 ? `+${hoveredUnitPoint.regressionSlope}% / mo` : `${hoveredUnitPoint.regressionSlope}% / mo`}
                    </strong>
                  </>
                )}
                {hoveredUnitPoint.momDelta !== undefined && (
                  <>
                    <span style={{ color: '#94a3b8' }}>MoM Shift:</span>
                    <strong style={{
                      color: hoveredUnitPoint.momDelta > 0 ? '#10b981' : hoveredUnitPoint.momDelta < 0 ? '#f87171' : '#94a3b8',
                      textAlign: 'right'
                    }}>
                      {hoveredUnitPoint.momDelta > 0 ? `▲ +${hoveredUnitPoint.momDelta}%` : hoveredUnitPoint.momDelta < 0 ? `▼ ${hoveredUnitPoint.momDelta}%` : '► 0.0%'}
                    </strong>
                  </>
                )}
                <span style={{ color: '#94a3b8' }}>Occupied Units:</span>
                <strong style={{ color: '#ffffff', textAlign: 'right' }}>{hoveredUnitPoint.occupiedUnits} / {hoveredUnitPoint.totalUnits}</strong>
                <span style={{ color: '#94a3b8' }}>Vacant Units:</span>
                <strong style={{ color: '#f87171', textAlign: 'right' }}>{hoveredUnitPoint.totalUnits - hoveredUnitPoint.occupiedUnits} units</strong>
                <span style={{ color: '#94a3b8' }}>Est. Vacancy Loss:</span>
                <strong style={{ color: '#f59e0b', textAlign: 'right' }}>{tenant.currency} {hoveredUnitPoint.revenueLoss.toLocaleString()}/mo</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CSV Data Upload Modal ── */}
      {showCsvModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowCsvModal(false)}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            borderRadius: 18,
            width: '100%',
            maxWidth: 620,
            padding: 28,
            color: '#f1f5f9',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📁</span> Upload Custom Rent Dataset (CSV)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Visualize your custom market rent trends or property growth metrics across D3 interactive charts.
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {csvError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>⚠️</span> {csvError}
              </div>
            )}

            {/* File Upload Zone */}
            <div style={{
              border: '2px dashed rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.04)',
              borderRadius: 12,
              padding: '24px 16px',
              textAlign: 'center',
              marginBottom: 16,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>
                  Click to choose CSV file or drag & drop here
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Supports .csv format with headers: Date, PortfolioRent, MarketBenchmark, OccupancyRate
                </div>
              </label>
            </div>

            {/* Pasting CSV directly */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Or paste raw CSV text:</span>
                <button
                  type="button"
                  onClick={loadSampleDataset}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  ⚡ Try Sample Metro Rent CSV
                </button>
              </div>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`date,occupancy_rate,property_id,portfolio_rent,market_benchmark\n2025-01-01,95.2,PROP-101,2150,2010\n2025-02-01,95.8,PROP-101,2180,2025`}
                rows={5}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#f1f5f9',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Expected Format Guide */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 11,
              color: '#94a3b8',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ color: '#cbd5e1' }}>Supported CSV Formats:</strong>
                <button
                  type="button"
                  onClick={() => setShowTourModal(true)}
                  style={{
                    background: 'rgba(167,139,250,0.15)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    color: '#a78bfa',
                    borderRadius: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💡 Launch Interactive Format Tour →
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li><strong>Property Data:</strong> Headers must contain exactly <code>date</code>, <code>occupancy_rate</code>, and <code>property_id</code>. Optional: <code>portfolio_rent</code>, <code>market_benchmark</code></li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                style={{
                  background: 'rgba(56,189,248,0.12)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  color: '#38bdf8',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                📄 Download CSV Template
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#cbd5e1',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleParseCsv(csvText)}
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    border: 'none',
                    color: '#0f172a',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(56,189,248,0.3)',
                  }}
                >
                  Parse & Visualize CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive CSV Import Tour & Format Guide Modal ── */}
      {showTourModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowTourModal(false)}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(167, 139, 250, 0.35)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 680,
            padding: 30,
            color: '#f1f5f9',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                  <span>💡</span> CSV Import Guided Tour & Best Practices
                </div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                  Formatting Guide for Market Rent Trends
                </h3>
              </div>
              <button
                onClick={() => setShowTourModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Stepper Header Bar */}
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {[
                { step: 1, title: '1. Required Headers' },
                { step: 2, title: '2. Formatting Dos & Don\'ts' },
                { step: 3, title: '3. Template & Live Test' },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setTourStep(s.step as any)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: tourStep === s.step ? 700 : 500,
                    background: tourStep === s.step ? 'rgba(167,139,250,0.25)' : 'transparent',
                    color: tourStep === s.step ? '#a78bfa' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Step 1 Content: Schema Headers */}
            {tourStep === 1 && (
              <div>
                <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 0, marginBottom: 16 }}>
                  The D3 market engine expects row 1 to contain standard column headers. We support flexible capitalization:
                </p>

                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  marginBottom: 16,
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontWeight: 700 }}>
                        <th style={{ padding: '10px 14px' }}>Column Header</th>
                        <th style={{ padding: '10px 14px' }}>Type</th>
                        <th style={{ padding: '10px 14px' }}>Description</th>
                        <th style={{ padding: '10px 14px' }}>Example</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: '#e2e8f0' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>date</td>
                        <td style={{ padding: '10px 14px' }}>Date / Text</td>
                        <td style={{ padding: '10px 14px' }}>ISO date (YYYY-MM-DD) or Month Year</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>2025-01-01</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>occupancy_rate</td>
                        <td style={{ padding: '10px 14px' }}>Number (%)</td>
                        <td style={{ padding: '10px 14px' }}>Portfolio or unit occupancy percentage</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>95.2</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>property_id</td>
                        <td style={{ padding: '10px 14px' }}>Text / Identifier</td>
                        <td style={{ padding: '10px 14px' }}>Property code or building name</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>PROP-101</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>portfolio_rent</td>
                        <td style={{ padding: '10px 14px' }}>Number ($)</td>
                        <td style={{ padding: '10px 14px' }}>Average monthly rent amount per unit</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>2150</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#38bdf8' }}>market_benchmark</td>
                        <td style={{ padding: '10px 14px' }}>Number ($)</td>
                        <td style={{ padding: '10px 14px' }}>Regional market benchmark rent</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>2010</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 2 Content: Dos and Don'ts */}
            {tourStep === 2 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✅</span> DO THIS (Clean Format)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li>Use raw numeric values without currency symbols (e.g., <code>2150</code> instead of <code>$2,150</code>).</li>
                    <li>Ensure row 1 contains exact header names.</li>
                    <li>Sort rows chronologically by date for clean line chart rendering.</li>
                    <li>Save files with <code>UTF-8</code> encoding and <code>.csv</code> extension.</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>❌</span> AVOID THIS (Common Errors)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li>Don't include percent signs in numbers (e.g. <code>95.2%</code>).</li>
                    <li>Avoid blank header lines or title banners above row 1.</li>
                    <li>Avoid thousand commas inside values unless wrapped in quotes.</li>
                    <li>Don't merge cells across multiple columns.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3 Content: Downloads & Actions */}
            {tourStep === 3 && (
              <div>
                <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 0, marginBottom: 16 }}>
                  Test your setup immediately with our pre-configured CSV template or load sample metro data:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 18,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📥</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>Download Starter CSV</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>
                      Get a pre-formatted 12-month CSV dataset ready for Microsoft Excel or Google Sheets.
                    </div>
                    <button
                      onClick={downloadCsvTemplate}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        background: 'rgba(56,189,248,0.18)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.35)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Download .CSV Template
                    </button>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 18,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>Instantly Load Metro Sample</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>
                      Directly parse and visualize sample market data in the D3 chart engine right now.
                    </div>
                    <button
                      onClick={() => {
                        loadSampleDataset();
                        setShowTourModal(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(167,139,250,0.3)',
                      }}
                    >
                      Load & Render Metro Sample
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18 }}>
              <button
                onClick={() => setTourStep(tourStep === 1 ? 3 : (tourStep - 1) as any)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#cbd5e1',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Previous Step
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setShowTourModal(false);
                    setShowCsvModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(56,189,248,0.3)',
                  }}
                >
                  Proceed to Upload CSV →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export CSV Dataset Selection Modal ── */}
      {showExportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 20,
            maxWidth: 720,
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>📥</span>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                    Export Market Performance Dataset (.CSV)
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                  Select structured CSV export scope for {tenant.name}. Formatted for Microsoft Excel, Google Sheets, or BI tools.
                </p>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Export Scope Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 22 }}>
              {/* Option 1: Master Combined Dataset */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#34d399' }}>
                      📊 Master Combined Performance Dataset
                    </span>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      Recommended
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#cbd5e1' }}>
                    Complete dataset including monthly occupancy rates, portfolio rents, market benchmarks, growth percentages, and unit capacity metrics.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {['date', 'occupancy_rate', 'portfolio_rent', 'market_benchmark', 'rent_growth_pct', 'total_units'].map(col => (
                      <code key={col} style={{ background: 'rgba(0,0,0,0.4)', color: '#a78bfa', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>{col}</code>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    downloadMarketPerformanceCsv('full');
                    setShowExportModal(false);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📥 Download Master CSV
                </button>
              </div>

              {/* Option 2: Rent Trends Time Series */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#38bdf8', marginBottom: 4 }}>
                    📈 Rent Trend Time Series CSV
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#cbd5e1' }}>
                    Streamlined time series focused purely on date, occupancy rate, portfolio rent, and market benchmark trajectory over selected time horizon ({timeHorizon}).
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {['date', 'occupancy_rate', 'portfolio_rent', 'market_benchmark', 'rent_growth_pct'].map(col => (
                      <code key={col} style={{ background: 'rgba(0,0,0,0.4)', color: '#38bdf8', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>{col}</code>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    downloadMarketPerformanceCsv('trends');
                    setShowExportModal(false);
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📈 Download Trends CSV
                </button>
              </div>

              {/* Option 3: Property & Unit Occupancy Heatmap + Forecast */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#c084fc', marginBottom: 4 }}>
                    🔮 Property Occupancy & 6-Month Regression Forecast CSV
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#cbd5e1' }}>
                    Property and unit category level breakdown including 12 months historical occupancy, revenue loss ($), and 6-month projected linear regression values.
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {['date', 'property_name', 'unit_tier', 'occupancy_rate', 'occupied_units', 'revenue_loss', 'is_forecast', 'regression_slope'].map(col => (
                      <code key={col} style={{ background: 'rgba(0,0,0,0.4)', color: '#c084fc', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>{col}</code>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    downloadMarketPerformanceCsv('occupancy');
                    setShowExportModal(false);
                  }}
                  style={{
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔮 Download Forecast CSV
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                📁 Export format: UTF-8 CSV with standard comma delimiter
              </span>

              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f1f5f9',
                  borderRadius: 8,
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      <ImportResultModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          // Re-open CSV modal if they cancel? Sure, or maybe just stay closed
          setShowCsvModal(true);
        }}
        result={validationResult}
      />
    </div>
  );
}
