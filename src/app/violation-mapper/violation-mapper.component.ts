import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { SafteyCultureService } from '../Services/saftey-culture.service';
import { SharedDataService } from '../Services/shared-data.service';

@Component({
  selector: 'app-violation-mapper',
  templateUrl: './violation-mapper.component.html',
  styleUrls: ['./violation-mapper.component.css'],
})
export class ViolationMapperComponent implements OnInit {
  trafficViolationFileName: string | null = null;
  operationDataFileName: string | null = null;

  trafficData: any[] = [];
  operationData: any[] = [];

  matchedData: any[] = [];
  unmatchedData: any[] = [];

  pushSuccessData: any[] = [];
  pushErrorData: any[] = [];
  pushMessage: string = '';

  isLoading = false;
  error = '';
  success = '';
  showWhatsapp = false;

  constructor(
    private auditService: SafteyCultureService,
    private sharedService: SharedDataService
  ) {}
  ngOnInit(): void {}

  // Upload traffic violation
  onTrafficViolationUpload(event: Event) {
    this.isLoading = true;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.trafficViolationFileName = input.files[0].name;
      this.readExcel(input.files[0], 'traffic');
    }
  }

  // Upload operation data
  onOperationDataUpload(event: Event) {
    this.isLoading = true;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.operationDataFileName = input.files[0].name;
      this.readExcel(input.files[0], 'operation');
    }
  }

  private buildAuditPayload(item: any) {
    return {
      items: [
        {
          type: 'textsingle',
          responses: {
            text: item?.DriverName || 'Not Found',
            note: String(item.CarNo),
          },
          item_id: 'bbf68fb8-b23c-463c-9aa7-54e6ae6f4d74',
        },
        {
          type: 'textsingle',
          responses: {
            text: item?.EmployeeNo ? item.EmployeeNo : item?.DriverID || '',
          },
          item_id: '1f9aee2a-4f6b-4c33-bee3-8211e569d9da',
        },
        {
          type: 'textsingle',
          responses: { text: 'TRF/ ' + item.ViolationNumber || '' },
          item_id: 'f3245d46-ea77-11e1-aff1-0800200c9a66',
        },
        {
          type: 'textsingle',
          responses: { text: `${item.Date} ${item.Time}` || '' },
          item_id: '281e4918-bc37-4946-a18b-ab167dc82942',
        },
        {
          type: 'textsingle',
          responses: { text: item.Description || '' },
          item_id: '128faaff-dd99-4430-a03e-de6e9f037825',
        },
        {
          type: 'textsingle',
          responses: { text: item.Amount != null ? String(item.Amount) : '' },
          item_id: '1df4548e-ca38-45dc-a16c-0a20ce984d72',
        },
        {
          item_id: '471a8558-3e31-41de-bd7d-a0f6b2aa2d50',
          type: 'asset',
          responses: {
            asset_id: '9d2c8b9e-920b-4549-9818-86cc819d909f',
            note: 'hello',
          },
        },
      ],
    };
  }

  pushMatchedSequentially() {
    if (!this.matchedData || this.matchedData.length === 0) return;

    this.isLoading = true;
    this.pushSuccessData = [];
    this.pushErrorData = [];

    let index = 0;
    const maxIndex = Math.min(4, this.matchedData.length); // limit to first 4

    const pushNext = () => {
      if (index >= maxIndex) {
        this.isLoading = false;
        this.pushMessage = `Push complete! Success: ${this.pushSuccessData.length}, Failed: ${this.pushErrorData.length}`;

        return;
      }

      const item = this.matchedData[index];
      const payload = this.buildAuditPayload(item);

      this.auditService.postAudit(payload).subscribe({
        next: (res) => {
          this.pushSuccessData.push(item); // success table
          index++;
          pushNext(); // call next item
        },
        error: (err) => {
          this.pushErrorData.push({
            ...item,
            ErrorMessage: err.message || 'Unknown error',
          }); // error table
          index++;
          pushNext(); // call next item
        },
      });
    };

    pushNext(); // start the chain
  }

  onWhatsappClick() {
    if (!this.pushSuccessData || this.pushSuccessData.length === 0) {
      alert('Please upload Excel or load table data first..');
      return;
    }
    this.showWhatsapp = true;
    this.sharedService.setExcelData(this.pushSuccessData);
  }

  readExcel(file: File, type: 'traffic' | 'operation') {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arrayBuffer: ArrayBuffer = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(arrayBuffer, { type: 'array' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (type === 'traffic') this.trafficData = data;
      else this.operationData = data;

      this.isLoading = false;
    };
    reader.readAsArrayBuffer(file);
  }

  // Proceed to match data
  proceedData() {
    this.isLoading = true;
    this.matchedData = [];
    this.unmatchedData = [];
    const opMap = new Map<string, any[]>();
    this.operationData.forEach((o) => {
      const opVehicleNo = extractNumber(o['Vehicle No']);
      if (!opMap.has(opVehicleNo)) opMap.set(opVehicleNo, []);
      opMap.get(opVehicleNo)?.push(o);
    });

    // 🔄 Process traffic data
    this.trafficData.forEach((v) => {
      const violationDateTime = excelToJSDate(v['Date'], v['Time']);
      const violationVehicleNo = extractNumber(v['Car No']);
      const opList = opMap.get(violationVehicleNo) || [];
      const op = opList.find((o) => {
        const start = excelToJSDate(Number(o['Start Date Time']));
        const end = excelToJSDate(Number(o['End Date Time']));
        return violationDateTime >= start && violationDateTime <= end;
      });

      if (op) {
        this.matchedData.push({
          SNo: v['S.No'],
          CarNo: v['Car No'],
          Make: v['Make'],
          ViolationNumber: v['Violation Number'],
          Date: violationDateTime.toLocaleDateString(),
          Time: violationDateTime.toLocaleTimeString(),
          StartDateTime: excelToJSDate(
            Number(op['Start Date Time'])
          ).toLocaleString(),
          EndDateTime: excelToJSDate(
            Number(op['End Date Time'])
          ).toLocaleString(),
          Description: v['Description'] || '',
          Location: v['Location'] || '',
          Amount: v['Amount'] || '',
          AmountToPay: v['Amount to Pay'] || '',
          DriverID: op['Driver ID'] || '',
          DriverName: op['Driver Name'] || '',
          EmployeeNo: op['Employee No'] || '',
          PhoneNo: op['Phone No'] || '',
          VehicleType: op['Vehicle Type'] || '',
        });
      } else {
        this.unmatchedData.push({
          ...v,
          Date: violationDateTime.toLocaleDateString(),
          Time: violationDateTime.toLocaleTimeString(),
        });
      }
    });
    this.isLoading = false;
  }

  copyTableFallback(type: 'matched' | 'unmatched' | 'success' | 'failed') {
    let tableData: any[] = [];

    // Map data according to type
    switch (type) {
      case 'matched':
        tableData = this.matchedData;
        break;
      case 'success':
        tableData = this.pushSuccessData; // same columns as matched
        break;
      case 'unmatched':
        tableData = this.unmatchedData;
        break;
      case 'failed':
        // map failed data to same columns as unmatched
        tableData = this.pushErrorData.map((e) => ({
          'Car No': e.CarNo,
          Make: e.Make,
          'Violation Number': e.ViolationNumber,
          Date: e.Date,
          Time: e.Time,
          Description: e.Description,
          Location: e.Location,
          Amount: e.Amount,
          'Amount to Pay': e.AmountToPay,
          Point: e.Point || e.ErrorMessage,
        }));
        break;
    }

    if (!tableData || tableData.length === 0) return;

    // Define columns
    const columns =
      type === 'matched' || type === 'success'
        ? [
            'S.No',
            'CarNo',
            'Make',
            'ViolationNumber',
            'Date',
            'Time',
            'StartDateTime',
            'EndDateTime',
            'Description',
            'Location',
            'Amount',
            'AmountToPay',
            'DriverID',
            'DriverName',
            'EmployeeNo',
            'PhoneNo',
            'VehicleType',
          ]
        : [
            'S.No',
            'Car No',
            'Make',
            'Violation Number',
            'Date',
            'Time',
            'Description',
            'Location',
            'Amount',
            'Amount to Pay',
            'Point',
          ];

    // Add S.No if not present
    tableData.forEach((row, i) => {
      if (!('S.No' in row)) row['S.No'] = i + 1;
    });

    // Build tab-delimited text
    const header = columns.join('\t');
    const rows = tableData.map((row) =>
      columns
        .map((col) => row[col] ?? row[col.replace(/\s/g, '')] ?? '')
        .join('\t')
    );
    const text = [header, ...rows].join('\n');

    // Copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    alert(`${type} table copied!`);
  }

  exportTrafficViolation(type: 'matched' | 'success' | 'unmatched' | 'failed') {
    let data: any[] = [];
    let filename = '';
    const today = new Date();

    const day = today.getDate(); // no leading zero
    const month = today.getMonth() + 1; // numeric month

    // Add leading zero manually if month < 10
    const monthStr = month < 10 ? '0' + month : month.toString();

    const year = today.getFullYear();

    const exportDateStr = `${day}-${monthStr}-${year}`;

    switch (type) {
      case 'matched':
      case 'success':
        const sourceData =
          type === 'matched' ? this.matchedData : this.pushSuccessData;
        data = sourceData.map((item) => ({
          'S.No': item.SNo ?? '',
          'Car No': item.CarNo ?? '',
          Make: item.Make ?? '',
          'Violation Number': item.ViolationNumber ?? '',
          Date: item.Date ?? '',
          Time: item.Time ?? '',
          Description: item.Description ?? '',
          Location: item.Location ?? '',
          Amount: item.Amount ?? '',
          'Amount to Pay': item.AmountToPay ?? '',
          Point: item.Point ?? '',
          // Extra columns from operation data
          'Driver ID': item.DriverID ?? '',
          'Driver Name': item.DriverName ?? '',
          'Employee No': item.EmployeeNo ?? '',
          'Phone No': item.PhoneNo ?? '',
          'Vehicle Type': item.VehicleType ?? '',
          'Start Date Time': item.StartDateTime ?? '',
          'End Date Time': item.EndDateTime ?? '',
        }));
        filename =
          type === 'matched'
            ? 'Matched_Traffic_Violation' + exportDateStr + '.xlsx'
            : 'Success_Traffic_Violation' + exportDateStr + '.xlsx';
        break;

      case 'unmatched':
        data = this.unmatchedData.map((item) => ({
          ...item,
        }));
        filename = 'Unmatched_Traffic_Violation' + exportDateStr + '.xlsx';
        break;

      case 'failed':
        data = this.pushErrorData.map((item) => ({
          'S.No': item.SNo ?? '',
          'Car No': item.CarNo ?? '',
          Make: item.Make ?? '',
          'Violation Number': item.ViolationNumber ?? '',
          Date: item.Date ?? '',
          Time: item.Time ?? '',
          Description: item.Description ?? '',
          Location: item.Location ?? '',
          Amount: item.Amount ?? '',
          'Amount to Pay': item.AmountToPay ?? '',
          Point: item.Point ?? item.ErrorMessage ?? '',
        }));
        filename = 'Failed_Traffic_Violation' + exportDateStr + '.xlsx';
        break;
    }

    if (!data.length) return;

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  }

  retryFailedPush() {
    if (!this.pushErrorData.length) return;

    const failedData = [...this.pushErrorData];
    this.pushErrorData = []; // reset before retry
    this.isLoading = true;

    let index = 0;

    const pushNext = () => {
      if (index >= failedData.length) {
        this.isLoading = false;
        this.pushMessage = `Retry complete! Success: ${this.pushSuccessData.length}, Failed: ${this.pushErrorData.length}`;
        return;
      }

      const item = failedData[index];
      const payload = this.buildAuditPayload(item);

      this.auditService.postAudit(payload).subscribe({
        next: () => {
          this.pushSuccessData.push(item); // push to success
          index++;
          pushNext();
        },
        error: (err) => {
          this.pushErrorData.push({
            ...item,
            ErrorMessage: err.message || 'Unknown error',
          });
          index++;
          pushNext();
        },
      });
    };

    pushNext();
  }
}

function excelToJSDate(date: any, time: any = 0): Date | null {
  let jsDate: Date | null = null;

  // 🧩 1️⃣ Handle numeric date (Excel serial)
  if (typeof date === 'number') {
    const d = XLSX.SSF.parse_date_code(date);
    if (d) jsDate = new Date(d.y, d.m - 1, d.d, d.H, d.M, d.S);
  }

  // 🧩 2️⃣ Handle string date (like "10/09/2025")
  else if (typeof date === 'string') {
    const trimmed = date.trim();
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) jsDate = parsed;
    else {
      // Try dd/mm/yyyy manually
      const parts = trimmed.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        jsDate = new Date(year, month, day);
      }
    }
  }

  if (!jsDate) return null; // invalid date

  // 🕒 3️⃣ Handle time (number or string)
  if (typeof time === 'number') {
    // Excel fractional time
    jsDate.setSeconds(jsDate.getSeconds() + Math.round(time * 24 * 60 * 60));
  } else if (typeof time === 'string') {
    const timeStr = time.trim(); // <— ✅ handles "   6:03 AM"
    if (timeStr !== '') {
      const timeParts = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (timeParts) {
        let hours = Number(timeParts[1]);
        const minutes = Number(timeParts[2]);
        const ampm = timeParts[3]?.toUpperCase();

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        jsDate.setHours(hours, minutes, 0, 0);
      }
    }
  }

  return jsDate;
}

function extractNumber(str: string | number): string {
  if (!str) return '';
  return String(str).replace(/\D/g, ''); // Remove all non-digit characters
}
