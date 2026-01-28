import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { TicketAIService } from '../../services/ticket-ai.service';
import { TicketService } from '../../services/ticket';
import { AuthService } from '../../services/auth.service';
import { ModelOption } from '../../interfaces/text-reviewer.interface';
import Swal from 'sweetalert2';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  loading?: boolean;
  data?: any;
  attachment?: {
    name: string;
    type: string;
    data: string;
  };
}

@Component({
  selector: 'app-floating-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-chat.component.html',
  styleUrl: './floating-chat.component.css'
})
export class FloatingChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private ticketAIService = inject(TicketAIService);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private readonly STORAGE_KEY_MODEL = 'ticket_chat_selected_model';

  chatOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = signal('');
  loading = signal(false);
  shouldScroll = signal(false);
  availableModels = signal<ModelOption[]>([]);
  selectedModel = signal<string>('');
  isLoadingModels = signal(false);
  selectedFile = signal<File | null>(null);
  filePreview = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAvailableModels();
    if (this.chatOpen()) {
      this.addSystemMessage('Olá! Sou o Axis AI, seu assistente virtual para abertura de chamados. Descreva seu problema e eu criarei um ticket automaticamente para você.');
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll()) {
      this.scrollToBottom();
      this.shouldScroll.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat(): void {
    this.chatOpen.set(!this.chatOpen());
    if (this.chatOpen() && this.messages().length === 0) {
      this.addSystemMessage('Olá! Sou o Axis AI, seu assistente virtual para abertura de chamados. Descreva seu problema e eu criarei um ticket automaticamente para você.');
    }
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  loadAvailableModels(): void {
    this.isLoadingModels.set(true);
    this.ticketAIService.buscarModelosDisponiveis()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelos) => {
          this.availableModels.set(modelos);
          const savedModel = localStorage.getItem(this.STORAGE_KEY_MODEL);
          let modeloParaUsar = '';
          
          if (savedModel && modelos.some(m => m.name === savedModel)) {
            modeloParaUsar = savedModel;
          } else if (modelos.length > 0) {
            modeloParaUsar = modelos[0].name;
          }
          
          if (modeloParaUsar) {
            this.selectedModel.set(modeloParaUsar);
            this.salvarModeloSelecionado(modeloParaUsar);
          }
          
          this.isLoadingModels.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar modelos:', err);
          this.availableModels.set([
            { name: 'models/gemini-1.5-flash', displayName: '(Free) Gemini 1.5 Flash' },
            { name: 'models/gemini-2.0-flash-exp', displayName: '(Free) Gemini 2.0 Flash' },
            { name: 'models/gemini-2.5-flash-exp', displayName: '(Free) Gemini 2.5 Flash' },
            { name: 'models/gemini-1.5-pro', displayName: '(Pro) Gemini 1.5 Pro' }
          ]);
          const savedModel = localStorage.getItem(this.STORAGE_KEY_MODEL);
          const modeloPadrao = savedModel || 'models/gemini-2.5-flash-exp';
          this.selectedModel.set(modeloPadrao);
          this.salvarModeloSelecionado(modeloPadrao);
          this.isLoadingModels.set(false);
        }
      });
  }

  onModelChange(modelName: string): void {
    this.selectedModel.set(modelName);
    this.salvarModeloSelecionado(modelName);
  }

  private salvarModeloSelecionado(modelName: string): void {
    if (modelName) {
      localStorage.setItem(this.STORAGE_KEY_MODEL, modelName);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_MODEL);
    }
  }

  sendMessage(): void {
    const message = this.currentMessage().trim();
    const file = this.selectedFile();
    
    if ((!message && !file) || this.loading()) {
      return;
    }

    const userMessage = message || (file ? `Anexo: ${file.name}` : '');
    this.addUserMessage(userMessage, file);
    this.currentMessage.set('');
    this.clearFile();
    
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);

    this.processWithAI(message, file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Tipo de arquivo não suportado',
          text: 'Por favor, envie apenas imagens (JPG, PNG, GIF, WEBP) ou PDFs.',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Arquivo muito grande',
          text: 'O arquivo deve ter no máximo 10MB.',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }

      this.selectedFile.set(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.filePreview.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreview.set(null);
      }
    }
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.filePreview.set(null);
    const fileInput = document.getElementById('floatingFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'bi-image';
    } else if (ext === 'pdf') {
      return 'bi-file-pdf';
    }
    return 'bi-file';
  }

  private processWithAI(userMessage: string, file?: File | null): void {
    this.loading.set(true);
    const loadingMessage = this.addAssistantMessage('Analisando sua solicitação' + (file ? ' e anexo' : '') + '...', true);

    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser?.nome || 'Usuário';
    const modelo = this.selectedModel();

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        
        this.ticketAIService.criarTicketComIA(userMessage || 'Analise o anexo fornecido', userName, modelo, {
          mimeType,
          data: base64Data,
          name: file.name
        }).pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading.set(false);
            this.messages.update(msgs => msgs.filter(m => m.id !== loadingMessage.id));
          })
        ).subscribe({
          next: (ticketData) => this.handleTicketResponse(ticketData),
          error: (err: Error) => this.handleError(err)
        });
      };
      reader.onerror = () => {
        this.loading.set(false);
        this.messages.update(msgs => msgs.filter(m => m.id !== loadingMessage.id));
        this.addAssistantMessage('Erro ao processar o arquivo. Tente novamente.');
      };
      reader.readAsDataURL(file);
    } else {
      this.ticketAIService.criarTicketComIA(userMessage, userName, modelo)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.loading.set(false);
            this.messages.update(msgs => msgs.filter(m => m.id !== loadingMessage.id));
          })
        )
        .subscribe({
          next: (ticketData) => this.handleTicketResponse(ticketData),
          error: (err: Error) => this.handleError(err)
        });
    }
  }

  private handleTicketResponse(ticketData: any): void {
    this.addAssistantMessage(
      `Entendi! Vou criar um ticket com as seguintes informações:\n\n` +
      `📋 **Título:** ${ticketData.titulo}\n` +
      `📝 **Descrição:** ${ticketData.descricao}\n` +
      `⚡ **Prioridade:** ${ticketData.prioridade}\n` +
      `🏷️ **Categoria:** ${ticketData.categoria}\n\n` +
      `Deseja criar este ticket?`
    );
    this.addSystemMessage('CONFIRM_TICKET', ticketData);
  }

  private handleError(err: Error): void {
    let errorMsg = 'Desculpe, ocorreu um erro ao processar sua solicitação.';
    
    if (err.message.includes('Chave da API')) {
      errorMsg = '⚠️ Chave da API Gemini não configurada. Configure em Configurações > Revisor com Gemini.';
    } else if (err.message.includes('Cota')) {
      errorMsg = '⚠️ Cota da API excedida. Tente novamente mais tarde.';
    } else {
      errorMsg = `Erro: ${err.message}`;
    }

    this.addAssistantMessage(errorMsg);
  }

  confirmTicketCreation(ticketData: any): void {
    const currentUser = this.authService.getCurrentUser();
    
    const novoTicket = this.ticketService.adicionarTicket({
      titulo: ticketData.titulo,
      descricao: ticketData.descricao,
      prioridade: ticketData.prioridade,
      status: 'Aberto',
      categoria: ticketData.categoria,
      criadoPor: currentUser?.nome || 'Usuário'
    });

    Swal.fire({
      icon: 'success',
      title: 'Ticket criado!',
      html: `
        <p><strong>ID:</strong> ${novoTicket.id}</p>
        <p><strong>Título:</strong> ${novoTicket.titulo}</p>
        <p><strong>Prioridade:</strong> ${novoTicket.prioridade}</p>
      `,
      confirmButtonText: 'Ver Ticket',
      cancelButtonText: 'Fechar',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/tickets', novoTicket.id]);
        this.toggleChat();
      } else {
        this.messages.set([]);
        this.addSystemMessage('Ticket criado com sucesso! Deseja abrir outro chamado?');
      }
    });
  }

  cancelTicketCreation(): void {
    this.addSystemMessage('Operação cancelada. Descreva seu problema novamente para criar um novo ticket.');
  }

  private addUserMessage(content: string, file?: File | null): ChatMessage {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        message.attachment = {
          name: file.name,
          type: file.type,
          data: (reader.result as string).split(',')[1]
        };
      };
      reader.readAsDataURL(file);
    }
    
    this.messages.update(msgs => [...msgs, message]);
    this.shouldScroll.set(true);
    return message;
  }

  private addAssistantMessage(content: string, loading: boolean = false): ChatMessage {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content,
      timestamp: new Date(),
      loading
    };
    this.messages.update(msgs => [...msgs, message]);
    this.shouldScroll.set(true);
    return message;
  }

  private addSystemMessage(content: string, data?: any): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date()
    };
    if (data) {
      (message as any).data = data;
    }
    this.messages.update(msgs => [...msgs, message]);
    this.shouldScroll.set(true);
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erro ao fazer scroll:', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
