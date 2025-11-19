import { Component, OnInit, ChangeDetectionStrategy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

/* Material */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Footer } from '../footer/footer';
/* Datepicker */
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Navbar } from '../navbar/navbar';
import { RouterLink } from '@angular/router';
type SlotStatus = 'booked' | 'cancelled'

interface Slot {
  id: string;
  title: string;
  location: string;
  start: string; // ISO
  end: string;   // ISO
  capacity: number;
  booked: number;
  status: SlotStatus;
  tags?: string[];
  rawBooking?: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule,
    Footer,
    Navbar,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loading = false;
  errorMessage = '';

  viewMode: 'grid' | 'list' = 'grid';
  pageSize = 12;
  pageIndex = 0;

  slots: Slot[] = [];
  filteredSlots: Slot[] = [];
  pageSlice: Slot[] = [];

  total = 0;
  booked = 0;
  available = 0;
  upcoming = 0;

  bookings_data: any[] = [];

  filters!: FormGroup;
  statuses: SlotStatus[] = ['booked','cancelled'];

  selectedBooking: any = null;

  private readonly API = 'https://secure-my-slot.onrender.com/api/auth/get-bookings';

  private router = inject(Router);

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    // local token check on init
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[Home] No token -> redirect to /login');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isTokenExpired(token)) {
      console.warn('[Home] Token expired -> clearing and redirecting to login');
      this.clearAndRedirectLogin();
      return;
    }

    // Initialize filters
    this.filters = this.fb.group({
      q: [''],
      date: [new Date()], // store Date object for datepicker
      status: ['']
    });

    this.filters.valueChanges.subscribe(() => this.applyFilters());
    // call loadBookings which will re-check token before network call
    this.loadBookings();
  }

  // --- JWT helpers (safe decode & expiry check) ---
  private decodeJwt(token: string | null): any | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch (e) {
      console.error('[Home] decodeJwt failed', e);
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

  // Build auth headers for requests (used if you don't use the global interceptor)
  private makeAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') ?? '';
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  // Fetch bookings from API (re-check token right before calling)
  loadBookings() {
    // Check token before network call (prevents using tampered tokens locally)
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[Home] No token before loadBookings -> redirect to login');
      this.router.navigate(['/login']);
      return;
    }
    if (this.isTokenExpired(token)) {
      console.warn('[Home] Token expired before loadBookings -> clearing & redirect');
      this.clearAndRedirectLogin();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const opts = this.makeAuthHeaders();

    this.http.get(this.API, opts).subscribe({
      next: (res: any) => {
        // IMPORTANT: backend must enforce auth on this route. If backend doesn't, it will return data even with invalid token.
        this.bookings_data = Array.isArray(res?.data) ? res.data : (res?.data ?? []);
        this.slots = this.bookings_data.map(b => this.bookingToSlot(b));
        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        console.error('[Home] Error loading bookings', err);
        // If server rejects due to auth -> force logout and redirect
        if (err?.status === 401 || err?.status === 403) {
          console.warn('[Home] Server returned 401/403 -> clearing token and redirecting to login');
          this.clearAndRedirectLogin();
          return;
        }
        this.errorMessage = 'Failed to load bookings. Check server or CORS.';
        this.slots = [];
        this.applyFilters();
        this.loading = false;
      }
    });
  }

  // --- rest of your helpers unchanged ---
  private bookingToSlot(b: any): Slot {
    const id = b?.booking_id ?? b?._id ?? '';
    const title = b?.name ?? b?.email ?? 'Booking';
    const isoDate = this.extractISODate(b?.date ?? b?.created_at);
    const startISO = this.safeTimeToISO(isoDate, b?.selectedSlot?.startTime) ?? this.fallbackISO(isoDate, 9);
    const endISO = this.safeTimeToISO(isoDate, b?.selectedSlot?.endTime) ?? this.fallbackISO(isoDate, (new Date(startISO).getUTCHours() + 1));
    return {
      id,
      title,
      location: b?.location ?? '',
      start: startISO,
      end: endISO,
      capacity: 1,
      booked: 1,
      status: 'booked',
      tags: b?.tags ?? [],
      rawBooking: b
    };
  }

  private extractISODate(dateField: any): string {
    if (!dateField) return this.formatDateToISO(new Date());
    if (typeof dateField === 'object' && dateField.$date) return String(dateField.$date).split('T')[0];
    const s = String(dateField);
    if (s.includes('T')) return s.split('T')[0];
    return s.slice(0, 10);
  }

  private safeTimeToISO(isoDate: string, timeStr: string | undefined | null): string | null {
    if (!timeStr) return null;
    const raw = String(timeStr).trim().replace(/\s+/g, ' ').toUpperCase();
    const ampm = raw.match(/\b(AM|PM)\b/)?.[1] ?? '';
    const timePart = ampm ? raw.replace(/\s?(AM|PM)$/, '').trim() : raw;
    const [hStr, mStr] = (timePart.split(':')).map(s => s?.trim());
    let h = Number(hStr), m = Number(mStr ?? 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (ampm === 'AM') { if (h === 12) h = 0; }
    else if (ampm === 'PM') { if (h !== 12) h = h + 12; }
    const [y, mo, d] = isoDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, (mo - 1), d, h, m, 0));
    return dt.toISOString();
  }

  private fallbackISO(isoDate: string, hour = 9): string {
    const [y, mo, d] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, hour, 0, 0)).toISOString();
  }

  private formatDateToISO(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onDateSelected(date: Date | null) {
    if (!date) return;
    this.filters.patchValue({ date }, { emitEvent: true });
  }

  todayISO(): string { return this.formatDateToISO(new Date()); }

  toggleView() { this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'; }

  openNewBooking() { /* no-op; implement dialog if needed */ }

  openDetails(s: Slot) { this.selectedBooking = s.rawBooking ?? null; }

  selectSlot(s: Slot) { this.openDetails(s); }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.slicePage(); }

  private slicePage() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pageSlice = this.filteredSlots.slice(start, end);
  }

  private updateSummary() {
    this.total = this.slots.length;
    this.booked = this.slots.filter(s => s.status === 'booked').length;
    this.upcoming = this.slots.filter(s => new Date(s.start) > new Date()).length;
  }

  applyFilters() {
    const { q, date, status } = this.filters.value;
    const query = (q || '').toLowerCase().trim();
    const dateStr = date ? this.formatDateToISO(date instanceof Date ? date : new Date(date)) : null;

    this.filteredSlots = this.slots.filter(s => {
      if (dateStr && !s.start.startsWith(dateStr)) return false;
      if (status && s.status !== status) return false;
      if (query) {
        const hay = `${s.title} ${s.location} ${(s.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    this.updateSummary();
    this.pageIndex = 0;
    this.slicePage();
  }

  clearFilters() {
    this.filters.reset({ q: '', date: new Date(), status: '' });
  }

  isFull(_s: Slot) { return false; }

  timeRange(s: Slot) {
    const st = new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const en = new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${st} – ${en}`;
  }

  exportCSV() {
    const cols = ['booking_id','name','email','date','startTime','endTime','duration','created_at'];
    const rows = this.filteredSlots.map(s => {
      const b = s.rawBooking ?? {};
      const dateField = (b?.date?.$date ?? b?.date ?? '');
      const createdAt = (b?.created_at?.$date ?? b?.created_at ?? '');
      const startTime = b?.selectedSlot?.startTime ?? '';
      const endTime = b?.selectedSlot?.endTime ?? '';
      return [
        b?.booking_id ?? b?._id ?? '',
        b?.name ?? '',
        b?.email ?? '',
        dateField,
        startTime,
        endTime,
        b?.duration ?? '',
        createdAt
      ];
    });
    const csv = [cols.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const dateForFile = this.filters.value.date ? this.formatDateToISO(this.filters.value.date) : 'all';
    const a = document.createElement('a'); a.href = url;
    a.download = `bookings-${dateForFile}.csv`; a.click(); URL.revokeObjectURL(url);
  }
}
