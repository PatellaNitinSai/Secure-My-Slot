import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Footer } from '../footer/footer';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Navbar } from '../navbar/navbar';
export interface Slot {
  id: string | number;
  title: string;
  subtitle?: string;
  available?: boolean;
  meta?: string;
}

@Component({
  selector: 'slot-types',
  standalone: true,
  imports: [CommonModule,RouterLink,Footer,MatIconModule,MatButtonModule,Navbar,Footer],
  templateUrl: './slot-types.html',
  styleUrls: ['./slot-types.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotTypes {
  @Input() slots: Slot[] = [
    { id: 'hill-1', title: 'Book Hill Slot', subtitle: 'Reserve your time slot conveniently', available: true, meta: 'Available now' },
    { id: 'coming-soon', title: 'More Slots Coming Soon', subtitle: 'Exciting slots are on the way', available: false, meta: 'Stay tuned' }
  ];

  @Output() book = new EventEmitter<Slot>();
constructor(private router: Router) {}
  onApproveUser() {
    this.router.navigate(['/approve-user']);
  }
  admin_mail : any = localStorage.getItem("email")
  onBook(slot: Slot) {
    if (!slot.available) return;
    this.book.emit(slot);
  }
}
