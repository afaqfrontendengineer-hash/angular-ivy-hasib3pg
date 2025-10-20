import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { SharedDataService } from '../Services/shared-data.service';

interface ExcelRow {
  'Phone No'?: string;
  'Mobile No'?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-whatsapp',
  templateUrl: './whatsapp.component.html',
  styleUrls: ['./whatsapp.component.css'],
})
export class WhatsappComponent implements OnInit {
  constructor(private sharedService: SharedDataService) {}
  ngOnInit(): void {
    this.sharedService.excelData$.subscribe((data) => {
      if (data && data.length > 0) {
        this.updateNumbers();
        this.method = 'excel';
        this.excelData = data
          .map((row) => ({
            ...row,
            phone: String(row['PhoneNo'] || row['Mobile No'] || '').trim(),
          }))
          .filter((row) => row.phone);

        this.numbers = [...this.excelData];
      }
    });
  }
  method: 'single' | 'multiple' | 'excel' = 'single';
  messageType: 'custom' | 'traffic' = 'custom';

  singleNumber = '';
  multipleNumbersText = '';
  customMessage = '';

  excelData: ExcelRow[] = [];
  numbers: any[] = [];
  numbersStatus: { [key: number]: boolean } = {};

  // Clear previous data when method changes
  updateNumbers() {
    this.numbers = [];
    this.numbersStatus = {};
    this.singleNumber = '';
    this.multipleNumbersText = '';
    this.excelData = [];
    this.customMessage = '';
    this.messageType = 'custom';
  }

  // Update numbers for single/multiple input
  updateList() {
    this.numbers = [];
    this.numbersStatus = {};

    if (this.method === 'single' && this.singleNumber.trim()) {
      this.numbers = [{ phone: this.singleNumber.trim() }];
    } else if (this.method === 'multiple' && this.multipleNumbersText.trim()) {
      this.numbers = this.multipleNumbersText
        .split(/\r?\n/)
        .map((num) => ({ phone: num.trim() }))
        .filter((row) => row.phone);
    }
  }

  // Handle Excel file upload
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const workbook = XLSX.read(new Uint8Array(e.target.result), {
        type: 'array',
      });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any = XLSX.utils.sheet_to_json(sheet);

      this.excelData = jsonData
        .map((row) => ({
          ...row,
          phone: String(row['Phone No'] || row['Mobile No'] || '').trim(),
        }))
        .filter((row) => row.phone);

      this.numbers = [...this.excelData];
      this.messageType = 'custom'; // default to custom, user can select traffic
    };

    reader.readAsArrayBuffer(file);
  }

  // Generate traffic violation message
  // Generate traffic violation message with Car No and Time
  generateTrafficMessage(row: any): string {
    const carNumber = row['Car No'] || row['CarNo'] || '';
    const violationNumber =
      row['Violation Number'] || row['ViolationNumber'] || '';
    const amount = row['Amount'] || row['Amount'] || '';
    const date = row['Date'] || '';
    const time = row['Time'] || '';

    return `Dear Driver,
  your vehicle (${carNumber}) has a traffic violation.
  Violation No: ${violationNumber}, Amount: ${amount}
  Date & Time: ${date} ${time}
  Plz come to fleet.`;
  }

  // Helper to get message for preview
  getMessage(row: any): string {
    if (this.messageType === 'custom') {
      return this.customMessage || '';
    } else if (this.messageType === 'traffic') {
      return this.generateTrafficMessage(row);
    }
    return '';
  }

  // Send WhatsApp
  sendWhatsapp(row: any, index: number) {
    let msg = '';

    if (this.messageType === 'custom') {
      if (!this.customMessage) {
        alert('Enter a custom message');
        return;
      }
      msg = this.customMessage;
    } else if (this.messageType === 'traffic') {
      msg = this.generateTrafficMessage(row);
    }

    const phone = row.phone || row['Phone No'] || row['Mobile No'];
    if (!phone) {
      alert('Phone number missing!');
      return;
    }

    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
      msg
    )}`;
    window.open(url, '_blank');

    // Mark as done by index
    this.numbersStatus[index] = true;
  }
}
