import { Component, NO_ERRORS_SCHEMA, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ArticleComponent } from '../article/article';
import { Chart, registerables } from 'chart.js';
import { isPlatformBrowser } from '@angular/common';

Chart.register(...registerables);



@Component({
  selector: 'pb-homepage',
  imports: [ArticleComponent],
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss',
  schemas: [NO_ERRORS_SCHEMA]
})
export class Homepage implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private chart: Chart | undefined;

  public dataSource = {
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          '#ffcd56',
          '#ff6384',
          '#36a2eb',
          '#fd6b19',
        ]
      }
    ],
    labels: [] as string[]
  };

  ngOnInit(): void {
    this.http.get('http://localhost:3001/budget')
      .subscribe((res: any) => {
        for (var i = 0; i < res.myBudget.length; i++) {
          this.dataSource.datasets[0].data[i] = res.myBudget[i].budget;
          this.dataSource.labels[i] = res.myBudget[i].title;
        }
        this.createChart();
      });
  }

  createChart() {
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
}
