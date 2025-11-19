import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Layout components
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'declined';
  approved?: boolean;
}

@Component({
  selector: 'user-approval',
  standalone: true,
  templateUrl: './user-approval.html',
  styleUrls: ['./user-approval.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Navbar,
    Footer
  ]
})
export class UserApproval implements OnInit {
  users: AppUser[] = [];
  loading = false;
  total: number = 0;
  private readonly baseUrl = 'https://secure-my-slot.onrender.com/api/auth';
  private router = inject(Router);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    // => Only check if token exists and is not expired
    if (!token || this.isTokenExpired(token)) {
      this.clearAndRedirectLogin();
      return;
    }

    // token valid → allow to stay on user-approvals
    this.fetchUsers();
  }

  // --- JWT helpers ---
  private decodeJwt(token: string | null): any | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string | null): boolean {
    const decoded = this.decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }

  private clearAndRedirectLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Helper to create Authorization header
  private makeAuthHeaders() {
    const token = localStorage.getItem('token') ?? '';
    return {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    };
  }

  fetchUsers(): void {
    this.loading = true;

    this.http.get<{ data: AppUser[] }>(`${this.baseUrl}/get-users`, this.makeAuthHeaders())
      .subscribe({
        next: (res) => {
          this.users = res?.data ?? [];
          this.total = this.users.length;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to fetch users', err);
          this.loading = false;

          // if token invalid → logout
          if (err?.status === 401 || err?.status === 403) {
            this.clearAndRedirectLogin();
          }
        }
      });
  }

  changeStatus(user: AppUser, status: 'approved' | 'declined', id: string): void {
    if (user.status === status) return;

    const approved = status === 'approved';

    this.http.patch(
      `${this.baseUrl}/update-users/${id}`,
      { collection: 'users', updateFields: { approved, status } },
      this.makeAuthHeaders()
    ).subscribe({
      next: () => {
        user.status = status;
        user.approved = approved;
      },
      error: (err) => {
        console.error('Failed to update user status', err);
        if (err?.status === 401 || err?.status === 403) {
          this.clearAndRedirectLogin();
        }
      }
    });
  }
}
