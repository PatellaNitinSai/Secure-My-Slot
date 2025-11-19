import { Component, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
/* Angular Material (NgModule imports for this component's template) */
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Footer } from '../footer/footer';
/* Dialog service (inject only; DO NOT put in imports array) */
import { MatDialog } from '@angular/material/dialog';
import { Navbar } from '../navbar/navbar';
/* Dialog component type (for dialog.open); do NOT put in imports array */
import { BookingDialog } from '../booking-dialog/booking-dialog';

export type CategoryId = 'engine' | 'dyno' | 'diagnostic' | 'calibration';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  description: string;
  accent: string;            // accent color for chip & avatar ring
  totalSlots: number;
  bookedSlots: number;
  eta?: string;              // next available time
  plant: 'WhiteField';
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatToolbarModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatMenuModule, MatChipsModule,
    MatProgressBarModule, MatTooltipModule, MatDividerModule,
    MatBadgeModule, MatDatepickerModule, MatNativeDateModule,RouterLink,Footer,Navbar,MatIconModule,MatButtonModule
    // DO NOT include MatDialog (service), BookingDialog (opened via service), or MatIcon (standalone)
  ],
  templateUrl: './categories.html',
  styleUrls: ['./categories.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Categories {
  @Output() openNewBooking = new EventEmitter<CategoryId>();
  @Output() openCategory = new EventEmitter<CategoryId>();
  @Output() openDetails = new EventEmitter<CategoryId>();

  // Filters
  plantCtrl = new FormControl<string>('', { nonNullable: true });
  dateCtrl = new FormControl<Date | null>(null);
  searchCtrl = new FormControl<string>('', { nonNullable: true });

  form = new FormGroup({
    plant: this.plantCtrl,
    date: this.dateCtrl,
    q: this.searchCtrl
  });

  constructor(private dialog: MatDialog) {}

  plants = ['WhiteField'];

  // KPI
  kpis = [
    { label: 'Total Slots', value: 66, icon: 'widgets' },
    { label: 'Booked Today', value: 41, icon: 'event_available' },
    { label: 'Available Now', value: 25, icon: 'event' },
    { label: 'Utilization', value: '62%', icon: 'data_usage' }
  ];

  // Categories
  categories: Category[] = [
    {
      id: 'engine',
      title: 'Engine Test',
      icon: 'engineering',
      description: 'HIL engine benches, fixtures & sensors.',
      accent: '#0ea5a4',
      totalSlots: 28, bookedSlots: 16, eta: '10:30 AM', plant: 'WhiteField'
    },
    {
      id: 'dyno',
      title: 'Dyno Bay',
      icon: 'speed',
      description: 'Chassis/engine dynamometer bays.',
      accent: '#7c3aed',
      totalSlots: 16, bookedSlots: 11, eta: '11:00 AM', plant: 'WhiteField'
    },
    {
      id: 'diagnostic',
      title: 'Diagnostics',
      icon: 'biotech',
      description: 'Rigs & instrumentation for RCA.',
      accent: '#16a34a',
      totalSlots: 22, bookedSlots: 7, eta: 'Now', plant: 'WhiteField'
    },
    {
      id: 'calibration',
      title: 'Calibration',
      icon: 'tune',
      description: 'Calibration & software validation.',
      accent: '#f59e0b',
      totalSlots: 18, bookedSlots: 15, eta: '1:15 PM', plant: 'WhiteField'
    }
  ];

  get filtered() {
    const plant = this.plantCtrl.value;
    const q = this.searchCtrl.value.trim().toLowerCase();
    return this.categories.filter(c => {
      const okPlant = plant ? c.plant === plant : true;
      const okQ = q ? (c.title + ' ' + c.description).toLowerCase().includes(q) : true;
      return okPlant && okQ;
    });
  }

  available(c: Category) {
    return Math.max(c.totalSlots - c.bookedSlots, 0);
  }
  utilization(c: Category) {
    return Math.round((c.bookedSlots / Math.max(c.totalSlots, 1)) * 100);
  }

  onViewSlots(c: Category) { this.openCategory.emit(c.id); }
  onDetails(c: Category) { this.openDetails.emit(c.id); }

  clearFilters() {
    this.plantCtrl.setValue('');
    this.dateCtrl.setValue(null);
    this.searchCtrl.setValue('');
  }

 
}
