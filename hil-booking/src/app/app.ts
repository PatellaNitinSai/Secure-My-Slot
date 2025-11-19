// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginForm } from './components/login-form/login-form';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,LoginForm], // only what the template uses
  templateUrl: './app.html'
})
export class App {}
