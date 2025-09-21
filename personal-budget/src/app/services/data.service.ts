import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface BudgetItem {
  title: string;
  budget: number;
}

export interface BudgetResponse {
  myBudget: BudgetItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3001/budget';

  // BehaviorSubject to store and emit budget data
  private budgetDataSubject = new BehaviorSubject<BudgetItem[]>([]);
  public budgetData$ = this.budgetDataSubject.asObservable();

  // Getter for current budget data
  get currentBudgetData(): BudgetItem[] {
    return this.budgetDataSubject.value;
  }

  constructor() {
    // Don't load data automatically on service initialization
    // Data will be loaded on-demand when requested
  }

  /**
   * Fetch budget data from the backend API only if data is empty
   */
  loadBudgetData(): Observable<BudgetResponse> {
    // Check if data already exists
    if (this.currentBudgetData.length > 0) {
      console.log('Budget data already loaded, skipping API call');
      // Return the existing data as an observable without making HTTP call
      return new Observable(observer => {
        observer.next({ myBudget: this.currentBudgetData });
        observer.complete();
      });
    }

    console.log('Loading budget data from API...');
    return this.http.get<BudgetResponse>(this.API_URL).pipe(
      tap((response: BudgetResponse) => {
        console.log('Budget data loaded from API:', response);
        this.budgetDataSubject.next(response.myBudget);
      })
    );
  }

  /**
   * Get budget data formatted for Chart.js
   * Automatically loads data if empty
   */
  getChartJsData() {
    // Load data if empty
    if (this.currentBudgetData.length === 0) {
      this.loadBudgetData().subscribe();
    }

    const data = this.currentBudgetData;
    return {
      datasets: [{
        data: data.map(item => item.budget),
        backgroundColor: [
          '#ffcd56', // Eat out
          '#ff6384', // Rent
          '#36a2eb', // Grocery
          '#fd6b19', // Utilities
          '#4bc0c0', // Transportation
          '#9966ff', // Entertainment
          '#00bcd4', // Savings
          '#e91e63', // Healthcare
          '#ffc107'  // Education
        ]
      }],
      labels: data.map(item => item.title)
    };
  }

  /**
   * Get budget data formatted for D3.js (synchronous - assumes data is already loaded)
   */
  getD3Data() {
    return this.currentBudgetData.map(item => ({
      label: item.title,
      value: item.budget
    }));
  }

  /**
   * Get budget data - loads from API only if data is empty
   */
  getBudgetData(): Observable<BudgetItem[]> {
    if (this.currentBudgetData.length > 0) {
      console.log('Returning cached budget data');
      // Return existing data as observable
      return new Observable(observer => {
        observer.next(this.currentBudgetData);
        observer.complete();
      });
    }

    // Load data from API and return the budget items
    return this.loadBudgetData().pipe(
      tap(() => console.log('Budget data loaded and cached')),
      // Map the response to return just the budget items
      map((response: BudgetResponse) => response.myBudget)
    );
  }

  /**
   * Force refresh budget data from the API (ignores cache)
   */
  refreshData(): Observable<BudgetResponse> {
    console.log('Force refreshing budget data from API...');
    return this.http.get<BudgetResponse>(this.API_URL).pipe(
      tap((response: BudgetResponse) => {
        console.log('Budget data force refreshed from API:', response);
        this.budgetDataSubject.next(response.myBudget);
      })
    );
  }
}
