import { Routes } from '@angular/router';
import { ServiceDeskDashboard } from './service-desk-dashboard/service-desk-dashboard';
import { TicketList } from './ticket-list/ticket-list';
import { KanbanBoard } from './kanban-board/kanban-board';
import { CreateTicket } from './create-ticket/create-ticket';
import { TicketDetail } from './ticket-detail/ticket-detail';
import { Inventory } from './inventory/inventory';

export const routes: Routes = [
  { path: '', component: ServiceDeskDashboard },
  { path: 'dashboard', component: ServiceDeskDashboard },
  { path: 'tickets', component: TicketList },
  { path: 'tickets/create', component: CreateTicket },
  { path: 'tickets/:id', component: TicketDetail },
  { path: 'kanban', component: KanbanBoard },
  { path: 'inventory', component: Inventory }
];
