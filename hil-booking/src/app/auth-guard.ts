// src/app/auth-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

// Public pages that do NOT require login
const PUBLIC_ROUTES = ['/login', '/register'];

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Token stored after successful login
  const token = localStorage.getItem('token');

  // Target URL user is trying to open
  const url = state?.url ?? '/';

  // Allow login/register if not logged in; if already logged-in redirect to slot-types
  if (PUBLIC_ROUTES.includes(url)) {
    if (token) {
      router.navigate(['/slot-types'], { replaceUrl: true });
      return false;
    }
    return true;
  }

  // For all other routes -> require token
  if (!token) {
    router.navigate(['/login'], { replaceUrl: true });
    return false;
  }

  // Token exists -> allow navigation
  return true;
};
