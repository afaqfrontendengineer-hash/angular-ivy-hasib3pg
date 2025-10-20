import { Component, OnInit } from '@angular/core';
import { AuthService } from '../Services/Auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  loggedIn = false;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.loggedIn$.subscribe((status) => {
      this.loggedIn = status;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
