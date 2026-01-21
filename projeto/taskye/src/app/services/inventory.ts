import { Injectable } from '@angular/core';

export interface InventoryItem {
  id: string;
  nome: string;
  tipo: 'Computador' | 'Monitor' | 'Impressora' | 'Servidor' | 'Notebook' | 'Outros';
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Obsoleto';
  localizacao: string;
  atribuidoA?: string;
  serial: string;
  garantia: string; // Data de expiração ou "Expirada"
  icone?: string; // Ícone Bootstrap para o tipo
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly STORAGE_KEY = 'axis_inventory';
  
  private items: InventoryItem[] = this.carregarDoLocalStorage();
  
  private carregarDoLocalStorage(): InventoryItem[] {
    const dados = localStorage.getItem(this.STORAGE_KEY);
    if (dados) {
      try {
        return JSON.parse(dados);
      } catch (e) {
        console.error('Erro ao carregar inventário do localStorage:', e);
      }
    }
    // Dados padrão baseados na imagem
    return [
      {
        id: 'INV-001',
        nome: 'Dell OptiPlex 7090',
        tipo: 'Computador',
        status: 'Em Uso',
        localizacao: 'Sala 205',
        atribuidoA: 'João Silva',
        serial: 'DL7090-2023-001',
        garantia: '2026-03-15',
        icone: 'bi-pc-display'
      },
      {
        id: 'INV-002',
        nome: 'Monitor LG 24"',
        tipo: 'Monitor',
        status: 'Em Uso',
        localizacao: 'Sala 205',
        atribuidoA: 'João Silva',
        serial: 'LG24-2023-045',
        garantia: '2026-03-15',
        icone: 'bi-display'
      },
      {
        id: 'INV-003',
        nome: 'HP LaserJet Pro M404n',
        tipo: 'Impressora',
        status: 'Disponível',
        localizacao: 'Almoxarifado',
        serial: 'HP404-2023-012',
        garantia: 'Expirada',
        icone: 'bi-printer'
      },
      {
        id: 'INV-004',
        nome: 'Dell PowerEdge R740',
        tipo: 'Servidor',
        status: 'Em Uso',
        localizacao: 'Data Center',
        atribuidoA: 'Infraestrutura',
        serial: 'DL740-2022-008',
        garantia: '2027-08-10',
        icone: 'bi-server'
      },
      {
        id: 'INV-005',
        nome: 'Lenovo ThinkPad X1',
        tipo: 'Notebook',
        status: 'Em Uso',
        localizacao: 'Home Office',
        atribuidoA: 'Maria Santos',
        serial: 'LN-X1-2023-025',
        garantia: '2026-06-12',
        icone: 'bi-laptop'
      },
      {
        id: 'INV-006',
        nome: 'Dell OptiPlex 5080',
        tipo: 'Computador',
        status: 'Manutenção',
        localizacao: 'TI - Manutenção',
        atribuidoA: 'Suporte TI',
        serial: 'DL5080-2022-156',
        garantia: 'Expirada',
        icone: 'bi-pc-display'
      },
      {
        id: 'INV-007',
        nome: 'Monitor Samsung 27"',
        tipo: 'Monitor',
        status: 'Disponível',
        localizacao: 'Almoxarifado',
        serial: 'SM27-2023-089',
        garantia: '2026-07-08',
        icone: 'bi-display'
      },
      {
        id: 'INV-008',
        nome: 'HP OfficeJet Pro 9015',
        tipo: 'Impressora',
        status: 'Em Uso',
        localizacao: 'Sala 310',
        atribuidoA: 'Administrativo',
        serial: 'HP9015-2023-034',
        garantia: 'Expirada',
        icone: 'bi-printer'
      },
      {
        id: 'INV-009',
        nome: 'Dell OptiPlex 3060',
        tipo: 'Computador',
        status: 'Obsoleto',
        localizacao: 'Almoxarifado',
        serial: 'DL3060-2019-245',
        garantia: 'Expirada',
        icone: 'bi-pc-display'
      },
      {
        id: 'INV-010',
        nome: 'Lenovo ThinkCentre M720',
        tipo: 'Computador',
        status: 'Em Uso',
        localizacao: 'Sala 108',
        atribuidoA: 'Carlos Oliveira',
        serial: 'LN-M720-2023-067',
        garantia: '2026-01-18',
        icone: 'bi-pc-display'
      }
    ];
  }

  getItems(): InventoryItem[] {
    return [...this.items];
  }

  getItemById(id: string): InventoryItem | undefined {
    return this.items.find(item => item.id === id);
  }

  adicionarItem(item: Omit<InventoryItem, 'id'>): InventoryItem {
    const novoId = this.gerarNovoId();
    const novoItem: InventoryItem = {
      ...item,
      id: novoId
    };
    this.items.push(novoItem);
    this.salvarNoLocalStorage();
    return novoItem;
  }

  atualizarItem(item: InventoryItem): void {
    const index = this.items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.items[index] = item;
      this.salvarNoLocalStorage();
    }
  }

  removerItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    this.salvarNoLocalStorage();
  }

  private gerarNovoId(): string {
    const maxNum = this.items.reduce((max, item) => {
      const num = parseInt(item.id.replace('INV-', '')) || 0;
      return num > max ? num : max;
    }, 0);
    return `INV-${String(maxNum + 1).padStart(3, '0')}`;
  }

  private salvarNoLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Erro ao salvar inventário no localStorage:', e);
    }
  }
}

