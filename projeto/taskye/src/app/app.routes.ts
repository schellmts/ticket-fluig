import { Routes } from '@angular/router';
import { ServiceDeskDashboardComponent } from './pages/service-desk-dashboard/service-desk-dashboard.component';
import { TicketListComponent } from './pages/ticket-list/ticket-list.component';
import { KanbanBoardComponent } from './pages/kanban-board/kanban-board.component';
import { CreateTicketComponent } from './pages/create-ticket/create-ticket.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { TextReviewerComponent } from './pages/text-reviewer/text-reviewer.component';
import { LoginComponent } from './pages/login/login.component';
import { TicketChatComponent } from './pages/ticket-chat/ticket-chat.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: ServiceDeskDashboardComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: ServiceDeskDashboardComponent, canActivate: [authGuard] },
  { path: 'tickets', component: TicketListComponent, canActivate: [authGuard] },
  { path: 'tickets/create', component: CreateTicketComponent, canActivate: [authGuard] },
  { path: 'tickets/:id', component: TicketDetailComponent, canActivate: [authGuard] },
  { path: 'kanban', component: KanbanBoardComponent, canActivate: [authGuard] },
  { path: 'text-reviewer', component: TextReviewerComponent, canActivate: [authGuard] },
  { path: 'chat', component: TicketChatComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
