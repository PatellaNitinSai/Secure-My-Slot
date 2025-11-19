// src/app/routes.ts
import { Routes } from '@angular/router';

import { Home } from './components/home/home';
import { LoginForm } from './components/login-form/login-form';
import { SignupForm } from './components/signup-form/signup-form';
import { Categories } from './components/categories/categories';
import { BookingDialog } from './components/booking-dialog/booking-dialog';
import { SlotTypes } from './components/slot-types/slot-types';
import { UserApproval } from './components/user-approval/user-approval';
import { authGuard } from './auth-guard';

export const routes: Routes = [

  // Public routes
  { path: 'login', component: LoginForm },
  { path: 'register', component: SignupForm },

  // Protected routes (must be authenticated)
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'slot-categories', component: Categories, canActivate: [authGuard] },
  { path: 'booking', component: BookingDialog, canActivate: [authGuard] },
  { path: 'slot-types', component: SlotTypes, canActivate: [authGuard] },
  { path: 'users-approvals', component: UserApproval, canActivate: [authGuard] },

  // Default route → login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Wildcard route → redirect to login
  { path: '**', redirectTo: 'login' }
];
