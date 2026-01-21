import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from '../../services/inventory';
import { LayoutComponent } from '../../layouts/layout.component';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, RouterModule, FormsModule, LayoutComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  private inventoryService = inject(InventoryService);

  searchTerm: string = '';
  tipoFiltro: string = 'Todos os Tipos';
  statusFiltro: string = 'Todos os Status';

  get items(): InventoryItem[] {
    return this.inventoryService.getItems();
  }

  get filteredItems(): InventoryItem[] {
    let filtered = this.items;

    // Filtro de busca
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.id.toLowerCase().includes(term) ||
        item.nome.toLowerCase().includes(term) ||
        item.serial.toLowerCase().includes(term) ||
        item.localizacao.toLowerCase().includes(term)
      );
    }

    // Filtro de tipo
    if (this.tipoFiltro !== 'Todos os Tipos') {
      filtered = filtered.filter(item => item.tipo === this.tipoFiltro);
    }

    // Filtro de status
    if (this.statusFiltro !== 'Todos os Status') {
      filtered = filtered.filter(item => item.status === this.statusFiltro);
    }

    return filtered;
  }

  get totalItens(): number {
    return this.items.length;
  }

  get disponivel(): number {
    return this.items.filter(item => item.status === 'Disponível').length;
  }

  get emUso(): number {
    return this.items.filter(item => item.status === 'Em Uso').length;
  }

  get manutencao(): number {
    return this.items.filter(item => item.status === 'Manutenção').length;
  }

  filtrarPorTipo(tipo: string) {
    this.tipoFiltro = tipo;
  }

  filtrarPorStatus(status: string) {
    this.statusFiltro = status;
  }

  getBadgeClassStatus(status: string): string {
    switch(status) {
      case 'Disponível': return 'bg-success';
      case 'Em Uso': return 'bg-info';
      case 'Manutenção': return 'bg-warning text-dark';
      case 'Obsoleto': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}
