import { Component, OnInit } from '@angular/core';
import { SafteyCultureService } from '../Services/saftey-culture.service';

@Component({
  selector: 'app-get-inspection',
  templateUrl: './get-inspection.component.html',
  styleUrls: ['./get-inspection.component.css'],
})
export class GetInspectionComponent implements OnInit {
  auditId: string = '';
  auditData: any;
  loading = false;
  error = '';

  constructor(private auditService: SafteyCultureService) {}

  ngOnInit(): void {}

  fetchAudit() {
    if (!this.auditId) return;

    this.loading = true;
    this.error = '';
    this.auditData = null;

    this.auditService.getAuditById(this.auditId).subscribe({
      next: (data) => {
        this.auditData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to fetch audit. Please check the ID.';
        this.loading = false;
      },
    });
  }
}
