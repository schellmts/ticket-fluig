import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import Swal from 'sweetalert2';
import { TicketService, Ticket } from '../../services/ticket';
import { LayoutComponent } from '../../layouts/layout.component';

@Component({
  selector: 'app-service-desk-dashboard',
  imports: [CommonModule, RouterModule, FormsModule, NgxEchartsModule, LayoutComponent],
  templateUrl: './service-desk-dashboard.component.html'
})
export class ServiceDeskDashboardComponent implements OnInit {
  private ticketService = inject(TicketService);

  ngOnInit() {
    // Aplicar filtro padrão ao carregar
    this.aplicarFiltro();
  }

  // Filtros selecionados (ainda não aplicados)
  tipoFiltroSelecionado: string = 'Todos Tickets';
  prioridadeFiltroSelecionado: string = 'Todas';
  modoDataSelecionado: string = 'Tempo Real';
  periodoSelecionado: string = 'Semana';

  // Filtros aplicados (usados para calcular métricas)
  tipoFiltroAplicado: string = 'Todos Tickets';
  prioridadeFiltroAplicado: string = 'Todas';
  periodoAplicado: string = 'Semana';

  get tickets(): Ticket[] {
    return this.ticketService.getTickets();
  }

  get ticketsFiltrados(): Ticket[] {
    let filtrados = [...this.tickets];

    // Filtro por tipo (status)
    if (this.tipoFiltroAplicado === 'Abertos') {
      filtrados = filtrados.filter(t => t.status === 'Aberto');
    } else if (this.tipoFiltroAplicado === 'Resolvidos') {
      filtrados = filtrados.filter(t => t.status === 'Resolvido');
    }

    // Filtro por prioridade
    if (this.prioridadeFiltroAplicado !== 'Todas') {
      filtrados = filtrados.filter(t => t.prioridade === this.prioridadeFiltroAplicado);
    }

    // Filtro por período (data)
    if (this.periodoAplicado === 'Hoje') {
      const hoje = new Date().toISOString().split('T')[0];
      filtrados = filtrados.filter(t => {
        const dataTicket = t.dataCriacao.split(' ')[0];
        return dataTicket === hoje;
      });
    } else if (this.periodoAplicado === 'Semana') {
      const hoje = new Date();
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
      filtrados = filtrados.filter(t => {
        const dataTicketStr = t.dataCriacao.split(' ')[0];
        const dataTicket = new Date(dataTicketStr + 'T00:00:00');
        return dataTicket >= umaSemanaAtras && dataTicket <= hoje;
      });
    } else if (this.periodoAplicado === 'Mês') {
      const hoje = new Date();
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      filtrados = filtrados.filter(t => {
        const dataTicketStr = t.dataCriacao.split(' ')[0];
        const dataTicket = new Date(dataTicketStr + 'T00:00:00');
        return dataTicket >= umMesAtras && dataTicket <= hoje;
      });
    }

    return filtrados;
  }

  get ticketsAbertos(): number {
    return this.ticketsFiltrados.filter(t => t.status === 'Aberto').length;
  }

  get tarefasConcluidas(): number {
    return this.ticketsFiltrados.filter(t => t.status === 'Resolvido').length;
  }

  get tempoMedioResolucao(): number {
    const resolvidos = this.ticketsFiltrados.filter(t => t.status === 'Resolvido' && t.dataResolucao);
    if (resolvidos.length === 0) return 4.2;
    
    const tempos = resolvidos.map(t => {
      const criacao = new Date(t.dataCriacao).getTime();
      const resolucao = new Date(t.dataResolucao!).getTime();
      return (resolucao - criacao) / (1000 * 60 * 60); // horas
    });
    
    const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    return Math.round(media * 10) / 10;
  }

  get slaCumprido(): number {
    const total = this.ticketsFiltrados.length;
    if (total === 0) return 94;
    
    const resolvidos = this.ticketsFiltrados.filter(t => t.status === 'Resolvido').length;
    return Math.round((resolvidos / total) * 100);
  }

  aplicarFiltro() {
    // Aplica os filtros selecionados
    this.tipoFiltroAplicado = this.tipoFiltroSelecionado;
    this.prioridadeFiltroAplicado = this.prioridadeFiltroSelecionado;
    this.periodoAplicado = this.periodoSelecionado;

    const totalFiltrado = this.ticketsFiltrados.length;
    
    // Não mostrar toast se for aplicação automática no ngOnInit
    if (totalFiltrado > 0) {
      Swal.fire({
        title: 'Filtros aplicados!',
        text: `Foram encontrados ${totalFiltrado} ticket(s) com os filtros selecionados.`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1e3a5f',
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
    }
  }

  filtrarPorTipo(tipo: string) {
    this.tipoFiltroSelecionado = tipo;
    this.aplicarFiltro();
  }

  // Gráfico de Distribuição por Categoria (Donut)
  get chartDistribuicao(): EChartsOption {
    const ticketsFiltrados = this.ticketsFiltrados;
    // Ordem exata da legenda: Hardware, Acesso, Software, Outros, Rede
    const categorias = ['Hardware', 'Acesso', 'Software', 'Outros', 'Rede'];
    // Cores correspondentes: bg-primary (#0d6efd), bg-info (#0dcaf0), roxo (#6f42c1), bg-secondary (#6c757d), bg-warning (#ffc107)
    const cores = ['#0d6efd', '#0dcaf0', '#6f42c1', '#6c757d', '#ffc107'];
    
    const dados = categorias.map((cat, index) => ({
      value: ticketsFiltrados.filter(t => t.categoria === cat).length,
      name: cat,
      itemStyle: { color: cores[index] }
    }));

    const dadosComValor = dados.filter(d => d.value > 0);
    
    // Se não houver dados, mostrar gráfico vazio mas renderizado
    if (dadosComValor.length === 0) {
      return {
        textStyle: {
          fontFamily: 'Poppins, sans-serif'
        },
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            name: 'Distribuição por Categoria',
            type: 'pie',
            radius: ['40%', '70%'],
            data: [{ value: 0, name: 'Sem dados' }],
            itemStyle: { color: '#e0e0e0' }
          }
        ]
      };
    }

    return {
      textStyle: {
        fontFamily: 'Poppins, sans-serif'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} tickets ({d}%)',
        textStyle: {
          fontFamily: 'Poppins, sans-serif'
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          name: 'Distribuição por Categoria',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            fontFamily: 'Poppins, sans-serif'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              fontFamily: 'Poppins, sans-serif'
            }
          },
          data: dadosComValor
        }
      ]
    };
  }

  get temDadosParaGrafico(): boolean {
    // Sempre mostrar gráficos, mesmo sem dados
    return true;
  }

  // Gráfico de Atividades da Semana (Line Chart)
  get chartAtividades(): EChartsOption {
    const ticketsFiltrados = this.ticketsFiltrados;
    
    // Mapear dias da semana com base nas datas dos tickets
    const hoje = new Date();
    const diasSemanaLabels: string[] = [];
    const tarefasConcluidas: number[] = [];
    const ticketsAbertos: number[] = [];
    const ticketsEmAndamento: number[] = [];

    // Calcular dados dos últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      
      // Obter dia da semana
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      diasSemanaLabels.push(dias[data.getDay()]);
      
      // Filtrar tickets do dia
      const ticketsDoDia = ticketsFiltrados.filter(t => {
        const ticketData = t.dataCriacao.split(' ')[0];
        return ticketData === dataStr;
      });
      
      tarefasConcluidas.push(ticketsDoDia.filter(t => t.status === 'Resolvido').length);
      ticketsAbertos.push(ticketsDoDia.filter(t => t.status === 'Aberto').length);
      ticketsEmAndamento.push(ticketsDoDia.filter(t => t.status === 'Em Andamento').length);
    }

    // Calcular máximo para yAxis
    const todosValores = [...tarefasConcluidas, ...ticketsAbertos, ...ticketsEmAndamento];
    const maxValue = Math.max(...todosValores, 1); // Mínimo de 1
    const maxYAxis = maxValue > 0 ? Math.ceil(maxValue / 5) * 5 : 10; // Mínimo de 10 se não houver dados

    return {
      textStyle: {
        fontFamily: 'Poppins, sans-serif'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        textStyle: {
          fontFamily: 'Poppins, sans-serif'
        }
      },
      legend: {
        data: ['Tarefas Concluídas', 'Tickets Abertos', 'Em Andamento'],
        bottom: 0,
        textStyle: {
          fontFamily: 'Poppins, sans-serif',
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: diasSemanaLabels,
        axisLabel: {
          fontFamily: 'Poppins, sans-serif'
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxYAxis,
        interval: Math.max(1, Math.ceil(maxYAxis / 5)),
        axisLabel: {
          fontFamily: 'Poppins, sans-serif'
        }
      },
      series: [
        {
          name: 'Tarefas Concluídas',
          type: 'line',
          data: tarefasConcluidas,
          lineStyle: {
            type: 'dashed',
            color: '#28a745',
            width: 2
          },
          itemStyle: {
            color: '#28a745'
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        },
        {
          name: 'Tickets Abertos',
          type: 'line',
          data: ticketsAbertos,
          lineStyle: {
            color: '#1e3a5f',
            width: 2
          },
          itemStyle: {
            color: '#1e3a5f'
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        },
        {
          name: 'Em Andamento',
          type: 'line',
          data: ticketsEmAndamento,
          lineStyle: {
            color: '#0dcaf0',
            width: 2
          },
          itemStyle: {
            color: '#0dcaf0'
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    };
  }
}
