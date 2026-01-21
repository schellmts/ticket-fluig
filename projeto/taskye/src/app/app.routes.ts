import { Routes } from '@angular/router';
import { ServiceDeskDashboardComponent } from './pages/service-desk-dashboard/service-desk-dashboard.component';
import { TicketListComponent } from './pages/ticket-list/ticket-list.component';
import { KanbanBoardComponent } from './pages/kanban-board/kanban-board.component';
import { CreateTicketComponent } from './pages/create-ticket/create-ticket.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { TextReviewerComponent } from './pages/text-reviewer/text-reviewer.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: ServiceDeskDashboardComponent },
  { path: 'dashboard', component: ServiceDeskDashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'tickets', component: TicketListComponent },
  { path: 'tickets/create', component: CreateTicketComponent },
  { path: 'tickets/:id', component: TicketDetailComponent },
  { path: 'kanban', component: KanbanBoardComponent },
  { path: 'text-reviewer', component: TextReviewerComponent }
];
