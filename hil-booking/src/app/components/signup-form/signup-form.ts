// src/app/components/signup-form/signup-form.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Footer], // <-- RouterLink for template links
  templateUrl: './signup-form.html',
  styleUrls: ['./signup-form.scss']
})
export class SignupForm {
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private router: Router,private http:HttpClient) {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  get name() { return this.form.get('name')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  passwordsMatch(): boolean {
    return this.password.value === this.confirmPassword.value;
  }

  async onSubmit() {
    if (this.form.invalid || !this.passwordsMatch()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload = { name: this.name.value, email: this.email.value, password: this.password.value };
    console.log('Signup payload', payload);
    this.http.post("https://secure-my-slot.onrender.com/api/auth/register",payload).subscribe({
      next : (res)=>{
        console.log(res)
      }
    })
    await new Promise(res => setTimeout(res, 700));
    this.loading = false;
    this.router.navigate(['/login']);
  }
}
