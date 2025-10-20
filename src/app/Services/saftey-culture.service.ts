import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SafteyCultureService {
  private baseUrl = 'https://data-integration-qrk9.onrender.com';

  // Derived URLs for specific endpoints
  private auditApiBase = `${this.baseUrl}/api/audit`;
  private assetApiBase = `${this.baseUrl}/api/asset`;

  constructor(private http: HttpClient) {}

  getAuditById(auditId: string): Observable<any> {
    return this.http.get(`${this.auditApiBase}/${auditId}`);
  }

  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    return this.http.post(`${this.baseUrl}/api/login`, body);
  }

  postAudit(auditData: any): Observable<any> {
    return this.http.post(this.auditApiBase, auditData);
  }

  getAssetByCode(code: string): Observable<any> {
    return this.http.get(`${this.assetApiBase}/${encodeURIComponent(code)}`);
  }
}
