import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private excelDataSource = new BehaviorSubject<any[]>([]);
  excelData$ = this.excelDataSource.asObservable();

  setExcelData(data: any[]) {
    this.excelDataSource.next(data);
  }

  clearExcelData() {
    this.excelDataSource.next([]);
  }

  getTableData(): any[] {
    return this.excelDataSource.getValue();
  }

  clearTableData() {
    this.excelDataSource.next([]);
  }
}
