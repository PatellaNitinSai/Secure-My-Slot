// src/app/components/login-form/login-form.component.ts
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    Footer,
    MatSnackBarModule
  ],
  templateUrl: './login-form.html',
  styleUrls: ['./login-form.scss']
})
export class LoginForm implements OnInit {
  @Output() submitCredentials =
    new EventEmitter<{ email: string; password: string; remember: boolean }>();

  form!: FormGroup;
  loading = false;
  showPassword = false;
  authenticating = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  private showMessage(message: string, panelClass: string = 'info-snackbar') {
    this.snack.open(message, 'Close', {
      duration: 4000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [panelClass]
    });
  }
loginWithDaimler() {
  if (this.loading || this.authenticating) return;

  this.authenticating = true;

  setTimeout(() => {
    this.authenticating = false;

    this.form.patchValue({
      email: 'patesai@tbdir.net',
      password: 'Nitin12@sai',
      remember: false
    });

    this.onSubmit();
  }, 2000);
}


  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = {
      email: this.email.value,
      password: this.password.value
    };

    this.http
      .post('http://localhost:3000/api/auth/login', payload)
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('email', res.user.email);
          localStorage.setItem('name',res.user.name);
          localStorage.setItem('token',res.token);
          this.loading = false;
          this.router.navigate(['slot-types']);
        },
        error: (error) => {
          this.loading = false;

          if (error.status === 403) {
            this.showMessage(
              'Your account is not approved yet. Please contact the administrator.',
              'warn-snackbar'
            );
          } else if (error.status === 404 || error.status === 401) {
            this.showMessage(
              'Invalid email or password.',
              'error-snackbar'
            );
          } else {
            this.showMessage(
              'Login failed. Please try again later.',
              'error-snackbar'
            );
          }
        }
      });
  }
}
