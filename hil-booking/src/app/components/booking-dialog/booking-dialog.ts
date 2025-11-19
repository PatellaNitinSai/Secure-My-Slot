import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isSelected: boolean;
  bookedBy?: string | null;
  bookingId?: string | null;
}

interface BookingDetails {
  name: string;
  email: string;
  date: string; // "YYYY-MM-DD"
  selectedSlot: TimeSlot | null;
  duration: number;
  hil?: string;
  otherReason?: string;
}

@Component({
  selector: 'booking-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './booking-dialog.html',
  styleUrls: ['./booking-dialog.scss']
})
export class BookingDialog implements OnInit {
  private router = inject(Router);

  timeSlots: TimeSlot[] = [];
  today: string = '';
  current_user: string | null = localStorage.getItem('email');
  current_user_name: string | null = localStorage.getItem('name');

  bookingDetails: BookingDetails = {
    name: '',
    email: '',
    date: '',
    selectedSlot: null,
    duration: 1,
    hil: '',
    otherReason: ''
  };

  bookings_data: any[] = [];
  start_times: string[] = [];

  constructor(private http: HttpClient) {}

  isOtherSelected = false;

  // List of HIL options (except OTHER which is added in template)
  hilOptions: string[] = [
    'AJ1939',
    'DIAG',
    'MLD',
    'ASW',
    'BSW',
    'FLASH',
    'CUST',
    'SETUP'
  ];

  ngOnInit() {
    // Ensure user is authenticated (token present). If not, redirect to login.
    const token = localStorage.getItem('token');
    if (!token) {
      // no token -> redirect to login
      this.router.navigate(['/login']);
      return;
    }

    this.today = new Date().toISOString().split('T')[0];
    this.bookingDetails.date = this.today;

    // Prefill email and name if available
    if (this.current_user) {
      this.bookingDetails.email = this.current_user;
    }
    if (this.current_user_name) {
      this.bookingDetails.name = this.current_user_name;
    }

    // generate slots for today's date first
    this.generateTimeSlots();

    // fetch bookings once on init; markBookedSlots will re-run when date changes
    this.getBookings();
  }

  onDateChange(newDate: string) {
    this.bookingDetails.date = String(newDate).split('T')[0];
    this.bookingDetails.selectedSlot = null;
    this.generateTimeSlots();
    this.markBookedSlots();
  }

  generateTimeSlots(newDuration?: number | string) {
    const duration = Number(newDuration ?? this.bookingDetails.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      console.warn('Invalid duration, defaulting to 1');
      this.bookingDetails.duration = 1;
    } else {
      this.bookingDetails.duration = duration;
    }

    this.timeSlots = [];
    this.bookingDetails.selectedSlot = null;

    for (let currentHour = 0; currentHour < 24; currentHour += this.bookingDetails.duration) {
      const endHour = currentHour + this.bookingDetails.duration;
      if (endHour <= 24) {
        this.timeSlots.push({
          startTime: this.formatTime(currentHour),
          endTime: this.formatTime(endHour === 24 ? 0 : endHour),
          isAvailable: true,
          isSelected: false,
          bookedBy: null,
          bookingId: null
        });
      }
    }

    this.markBookedSlots();
  }

  private makeAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') ?? '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return { headers };
  }

  getBookings() {
    // include token in header
    const opts = this.makeAuthHeaders();

    this.http.get("https://secure-my-slot.onrender.com/api/auth/get-bookings", opts).subscribe({
      next: (res: any) => {
        this.bookings_data = res?.data ?? [];
        this.start_times = this.bookings_data.map(b => b?.selectedSlot?.startTime).filter(Boolean);
        console.log('Bookings fetched (server):', this.bookings_data);

        if (!this.timeSlots?.length) {
          this.generateTimeSlots();
        } else {
          this.markBookedSlots();
        }
      },
      error: (err) => {
        console.error('Error fetching bookings:', err);
        // If unauthorized, redirect to login
        if (err?.status === 401 || err?.status === 403) {
          // Clear token and user info and redirect
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        } else {
          this.bookings_data = [];
        }
      }
    });
  }

  private parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const s = String(timeStr).trim().replace(/\s+/g, ' ').toUpperCase();
    const ampmMatch = s.match(/(AM|PM)$/);
    let timePart = s;
    let modifier = '';
    if (ampmMatch) {
      modifier = ampmMatch[1];
      timePart = s.replace(/\s?(AM|PM)$/, '');
    }

    const [hStr, mStr] = timePart.split(':');
    let h = Number(hStr);
    const m = Number(mStr ?? 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;

    if (modifier === 'AM') {
      if (h === 12) h = 0;
    } else if (modifier === 'PM') {
      if (h !== 12) h = h + 12;
    } else {
      if (h === 24) h = 0;
    }
    return h * 60 + m;
  }

  private normalizeDate(dateVal: string | Date | undefined | null): string {
    if (!dateVal) return '';
    const s = String(dateVal);
    return s.includes('T') ? s.split('T')[0] : s.trim();
  }

  private markBookedSlots(): void {
    if (!this.timeSlots?.length) return;

    this.timeSlots.forEach(s => {
      s.isAvailable = true;
      s.isSelected = false;
      s.bookedBy = null;
      s.bookingId = null;
    });

    const selectedDate = this.bookingDetails?.date;
    if (!selectedDate) return;

    for (const booking of this.bookings_data ?? []) {
      if (!booking) continue;
      const bookingDate = this.normalizeDate(booking.date ?? booking.created_at ?? booking._id);
      if (String(bookingDate).trim() !== String(selectedDate).trim()) continue;

      const bStartStr = booking.selectedSlot?.startTime;
      const bEndStr = booking.selectedSlot?.endTime;
      if (!bStartStr || !bEndStr) continue;

      let bookingStart = this.parseTimeToMinutes(bStartStr);
      let bookingEnd = this.parseTimeToMinutes(bEndStr);
      if (bookingEnd <= bookingStart) bookingEnd += 24 * 60;

      for (const slot of this.timeSlots) {
        const slotStart = this.parseTimeToMinutes(slot.startTime);
        let slotEnd = this.parseTimeToMinutes(slot.endTime);
        if (slotEnd <= slotStart) slotEnd += 24 * 60;

        const overlap = bookingStart < slotEnd && bookingEnd > slotStart;
        if (overlap) {
          slot.isAvailable = false;
          slot.isSelected = false;
          slot.bookedBy = booking.name ?? booking.email ?? 'booked';
          slot.bookingId = booking.booking_id ?? booking._id ?? null;
        }
      }
    }
  }

  formatTime(hour: number): string {
    hour = ((hour % 24) + 24) % 24;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  selectSlot(slot: TimeSlot) {
    if (!slot.isAvailable) return;
    this.timeSlots.forEach(s => s.isSelected = false);
    slot.isSelected = true;
    this.bookingDetails.selectedSlot = slot;
  }

  onHilChange(value: string) {
    this.isOtherSelected = (value === 'OTHER');
    if (!this.isOtherSelected) {
      this.bookingDetails.otherReason = '';
    }
  }

  confirmBooking(event: Event) {
    event.preventDefault();

    if (!this.bookingDetails.name || !this.bookingDetails.email) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.bookingDetails.selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    if (this.bookingDetails.hil === 'OTHER' && !this.bookingDetails.otherReason?.trim()) {
      alert('Please provide a reason when OTHER is selected.');
      return;
    }

    const payload: any = {
      name: this.bookingDetails.name,
      email: this.bookingDetails.email,
      date: this.bookingDetails.date,
      duration: this.bookingDetails.duration,
      selectedSlot: {
        startTime: this.bookingDetails.selectedSlot.startTime,
        endTime: this.bookingDetails.selectedSlot.endTime
      },
      hil: this.bookingDetails.hil,
      otherReason: this.bookingDetails.otherReason
    };

    console.log('Sending booking payload:', payload);

    const opts = this.makeAuthHeaders();

    this.http.post('https://secure-my-slot.onrender.com/api/auth/bookings', payload, opts).subscribe({
      next: (res: any) => {
        console.log('Booking POST response:', res);

        // immediate local disable (UX)
        const sel = this.bookingDetails.selectedSlot!;
        const selStart = this.parseTimeToMinutes(sel.startTime);
        const selEndRaw = this.parseTimeToMinutes(sel.endTime);
        const selEnd = selEndRaw <= selStart ? selEndRaw + 24 * 60 : selEndRaw;

        const idx = this.timeSlots.findIndex(s => {
          const sStart = this.parseTimeToMinutes(s.startTime);
          const sEndRaw = this.parseTimeToMinutes(s.endTime);
          const sEnd = sEndRaw <= sStart ? sEndRaw + 24 * 60 : sEndRaw;
          return sStart === selStart && sEnd === selEnd;
        });

        if (idx !== -1) {
          this.timeSlots[idx].isAvailable = false;
          this.timeSlots[idx].isSelected = false;
          this.timeSlots[idx].bookedBy = payload.name;
          this.timeSlots[idx].bookingId = res?.data?.booking_id ?? res?.data?._id ?? null;
        } else {
          console.warn('Local slot match failed; relying on server-marking', sel);
        }

        // re-fetch authoritative bookings then mark slots
        this.getBookings();
        alert('Booking Successful (server confirmed)');
        // clear form but keep date
        this.bookingDetails.name = '';
        this.bookingDetails.email = this.current_user ?? '';
        this.bookingDetails.selectedSlot = null;
      },
      error: (error) => {
        console.error('Booking Failed', error);
        if (error?.status === 401 || error?.status === 403) {
          // token invalid/expired -> clear and redirect to login
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return;
        }
        alert('Booking failed. Try again.');
      }
    });
  }

  resetFormKeepDate() {
    this.bookingDetails.name = '';
    this.bookingDetails.email = this.current_user ?? '';
    this.bookingDetails.selectedSlot = null;
    this.generateTimeSlots();
  }

  resetForm() {
    this.bookingDetails = {
      name: '',
      email: this.current_user ?? '',
      date: this.today,
      selectedSlot: null,
      duration: 1,
      hil: '',
      otherReason: ''
    };
    this.generateTimeSlots();
  }
}
