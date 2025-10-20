import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../Services/Auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  ngOnInit() {}
  loginForm: FormGroup;
  submitting = false;
  errorMessage: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.submitting = true;
    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/get-inspection']); // navigate after successful login
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'Invalid email or password.';
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
