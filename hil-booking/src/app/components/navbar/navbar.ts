import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,          // IMPORTANT ✔
    MatIconModule,
    MatMenuModule,         // IMPORTANT ✔ for matMenuTriggerFor
    MatButtonModule,       // IMPORTANT ✔ for mat-icon-button & mat-menu-item
    RouterModule,RouterLink
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar {

  logout() {
    console.log('Logout clicked');
  }

}
