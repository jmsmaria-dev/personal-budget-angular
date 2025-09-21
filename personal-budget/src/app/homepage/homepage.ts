import { Component, NO_ERRORS_SCHEMA, OnInit, inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { ArticleComponent } from '../article/article';
import { Breadcrumbs } from '../breadcrumbs/breadcrumbs';
import { DataService } from '../services/data.service';
import { Chart, registerables } from 'chart.js';
import { isPlatformBrowser } from '@angular/common';
import * as d3 from 'd3';

Chart.register(...registerables);



@Component({
  selector: 'pb-homepage',
  imports: [ArticleComponent, Breadcrumbs],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
  schemas: [NO_ERRORS_SCHEMA]
})
export class Homepage implements OnInit {
  private dataService = inject(DataService);
  private platformId = inject(PLATFORM_ID);
  private chart: Chart | undefined;
  private d3Chart: any;
  private svg: any;
  private width = 600;
  private height = 500;
  private radius = Math.min(this.width, this.height) / 2 - 80; // Reduce radius to make room for labels

  public dataSource = {
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          '#ffcd56',
          '#ff6384',
          '#36a2eb',
          '#fd6b19',
          '#4bc0c0',
          '#9966ff',
          '#00bcd4',
          '#e91e63',
          '#ffc107'
        ]
      }
    ],
    labels: [] as string[]
  };

  ngOnInit(): void {
    // Subscribe to budget data changes from the service
    this.dataService.budgetData$.subscribe(budgetData => {
      if (budgetData && budgetData.length > 0) {
        // Update Chart.js data source
        this.dataSource = this.dataService.getChartJsData();

        // Create/update charts
        this.createChart();
        this.createD3Chart();
      }
    });

    // Get budget data (will load from API only if empty)
    this.dataService.getBudgetData().subscribe();
  }  createChart() {
    // Only create chart if running in browser (not during SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const ctx = document.getElementById('myChart') as HTMLCanvasElement;

    if (!ctx) {
      console.error('Canvas element with id "myChart" not found');
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: this.dataSource,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Personal Budget'
          }
        }
      }
    });
    console.log('Chart created with data:', this.dataSource);
  }

  createD3Chart(): void {
    // Only create chart if running in browser (not during SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Get budget data asynchronously
    this.dataService.getBudgetData().subscribe(budgetData => {
      if (!budgetData || budgetData.length === 0) {
        console.warn('No budget data available for D3 chart');
        return;
      }

      // Convert to D3 format
      const d3Data = budgetData.map(item => ({
        label: item.title,
        value: item.budget
      }));

      console.log('Creating D3 chart with data:', d3Data);
      console.log('Chart dimensions:', this.width, 'x', this.height, 'radius:', this.radius);

      // Clear previous chart
      d3.select("#d3Chart").selectAll("*").remove();

      // Check if container exists
      const container = d3.select("#d3Chart");
      if (container.empty()) {
        console.error('D3Chart container not found');
        return;
      }

      // Set up SVG with explicit styling
      const svg = d3.select("#d3Chart")
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .style("background", "white")
        .style("display", "block");

      this.svg = svg.append("g")
        .attr("transform", `translate(${this.width/2},${this.height/2})`);

      console.log('SVG created with dimensions:', this.width, 'x', this.height);

      // Create groups for different chart elements
      this.svg.append("g").attr("class", "slices");
      this.svg.append("g").attr("class", "labels");
      this.svg.append("g").attr("class", "lines");

      // Set up color scale
      const color = d3.scaleOrdinal<string>()
        .domain(d3Data.map(d => d.label))
        .range([
          '#ffcd56', '#ff6384', '#36a2eb', '#fd6b19',
          '#4bc0c0', '#9966ff', '#00bcd4', '#e91e63', '#ffc107'
        ]);

      // Draw initial chart
      this.drawD3Chart(d3Data, color);

      // Set up randomize button
      d3.select(".randomize").on("click", () => {
        const randomData = d3Data.map(d => ({
          label: d.label,
          value: Math.random() * d.value
        }));
        this.drawD3Chart(randomData, color);
      });
    });
  }

  drawD3Chart(data: any[], color: d3.ScaleOrdinal<string, string>): void {
    const pie = d3.pie<any>()
      .sort(null)
      .value(d => d.value);

    const arc = d3.arc<any>()
      .outerRadius(this.radius * 0.8)
      .innerRadius(this.radius * 0.4);

    const outerArc = d3.arc<any>()
      .innerRadius(this.radius * 0.9)
      .outerRadius(this.radius * 0.9);

    const key = (d: any) => d.data.label;
    const radius = this.radius;

    // Helper function for label positioning
    const midAngle = (d: any) => d.startAngle + (d.endAngle - d.startAngle) / 2;

    /* ------- PIE SLICES ------- */
    const slice = this.svg.select(".slices").selectAll("path.slice")
      .data(pie(data), key);

    slice.enter()
      .insert("path")
      .style("fill", (d: any) => color(d.data.label))
      .attr("class", "slice");

    slice.transition().duration(1000)
      .attrTween("d", function(this: any, d: any) {
        const current = this._current || d;
        const interpolate = d3.interpolate(current, d);
        this._current = interpolate(0);
        return (t: number) => arc(interpolate(t));
      });

    slice.exit().remove();

    /* ------- TEXT LABELS ------- */
    const text = this.svg.select(".labels").selectAll("text")
      .data(pie(data), key);

    text.enter()
      .append("text")
      .attr("dy", ".35em")
      .text((d: any) => d.data.label);

    text.transition().duration(1000)
      .attrTween("transform", function(this: any, d: any) {
        const current = this._current || d;
        const interpolate = d3.interpolate(current, d);
        this._current = interpolate(0);
        return (t: number) => {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return `translate(${pos})`;
        };
      })
      .styleTween("text-anchor", function(this: any, d: any) {
        const current = this._current || d;
        const interpolate = d3.interpolate(current, d);
        this._current = interpolate(0);
        return (t: number) => {
          const d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });

    text.exit().remove();

    /* ------- SLICE TO TEXT POLYLINES ------- */
    const polyline = this.svg.select(".lines").selectAll("polyline")
      .data(pie(data), key);

    polyline.enter().append("polyline");

    polyline.transition().duration(1000)
      .attrTween("points", function(this: any, d: any) {
        const current = this._current || d;
        const interpolate = d3.interpolate(current, d);
        this._current = interpolate(0);
        return (t: number) => {
          const d2 = interpolate(t);
          const pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });

    polyline.exit().remove();
  }
}
