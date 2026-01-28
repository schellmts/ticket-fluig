import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Layout } from '../../components/layout/layout.component';
import { TextReviewerService } from '../../services/text-reviewer.service';
import { GeminiApiKeyService } from '../../services/gemini-api-key.service';
import { ModelOption, AnalysisResult } from '../../interfaces/text-reviewer.interface';

@Component({
  selector: 'app-text-reviewer',
  imports: [CommonModule, FormsModule, Layout],
  templateUrl: './text-reviewer.component.html',
  styleUrl: './text-reviewer.component.css'
})
export class TextReviewerComponent implements OnInit, OnDestroy {
  private textReviewerService = inject(TextReviewerService);
  private apiKeyService = inject(GeminiApiKeyService);
  private destroy$ = new Subject<void>();

  inputText = signal('');
  loading = signal(false);
  result = signal<AnalysisResult | null>(null);
  error = signal('');
  tone = signal('profissional');

  defaultModels: ModelOption[] = [
    { name: 'models/gemini-1.5-flash', displayName: '(Free) Gemini 1.5 Flash (Recomendado - Grátis/Rápido)' },
    { name: 'models/gemini-1.5-flash-8b', displayName: '(Free) Gemini 1.5 Flash-8B (Super Rápido)' },
    { name: 'models/gemini-2.0-flash-exp', displayName: '(Free) Gemini 2.0 Flash (Experimental)' },
    { name: 'models/gemini-1.5-pro', displayName: '(PRO) Gemini 1.5 Pro (Pode ter limite de cota)' },
  ];

  availableModels = signal<ModelOption[]>(this.defaultModels);
  selectedModel = signal(this.defaultModels[0].name);
  isValidatingKey = signal(false);
  keyValidated = signal(false);
  
  // Chave da API inserida pelo usuário
  apiKeyInput = signal('');
  showApiKeyInput = signal(false);

  ngOnInit(): void {
    // Carregar chave salva se existir
    const savedKey = this.apiKeyService.getApiKey();
    if (savedKey) {
      this.apiKeyInput.set(savedKey);
      this.validateKeyAndFetchModels();
    } else {
      // Se não houver chave salva, mostrar input
      this.showApiKeyInput.set(true);
    }
  }
  
  /**
   * Salva a chave da API e valida
   */
  saveApiKey(): void {
    const key = this.apiKeyInput().trim();
    if (!key) {
      this.error.set('Por favor, insira uma chave da API válida.');
      return;
    }
    
    this.apiKeyService.setApiKey(key);
    this.showApiKeyInput.set(false);
    this.validateKeyAndFetchModels();
  }
  
  /**
   * Altera a chave da API
   */
  changeApiKey(): void {
    this.showApiKeyInput.set(true);
    this.keyValidated.set(false);
  }
  
  /**
   * Remove a chave da API
   */
  clearApiKey(): void {
    this.apiKeyService.clearApiKey();
    this.apiKeyInput.set('');
    this.showApiKeyInput.set(true);
    this.keyValidated.set(false);
    this.availableModels.set(this.defaultModels);
  }

  updateInputText(event: Event) {
    this.inputText.set((event.target as HTMLTextAreaElement).value);
  }

  updateTone(event: Event) {
    this.tone.set((event.target as HTMLSelectElement).value);
  }

  updateApiKeyInput(event: Event) {
    this.apiKeyInput.set((event.target as HTMLInputElement).value);
  }

  updateSelectedModel(event: Event) {
    this.selectedModel.set((event.target as HTMLSelectElement).value);
  }

  clearInput() {
    this.inputText.set('');
  }

  getButtonClass() {
    const base = "btn w-100 d-flex align-items-center justify-content-center gap-2";
    if (this.loading()) {
      return `${base} btn-secondary`;
    }
    return `${base} btn-primary`;
  }

  validateKeyAndFetchModels() {
    this.isValidatingKey.set(true);
    this.error.set('');

    this.textReviewerService.validateKeyAndFetchModels()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isValidatingKey.set(false))
      )
      .subscribe({
        next: (models) => {
          this.availableModels.set(models);
          this.selectedModel.set(models[0].name);
          this.keyValidated.set(true);
        },
        error: (err: Error) => {
          this.keyValidated.set(false);
          this.error.set(`Erro ao validar: ${err.message}`);
        }
      });
  }

  analyzeText() {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);

    this.textReviewerService.analyzeText(
      this.selectedModel(),
      this.inputText(),
      this.tone()
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (result) => {
          this.result.set(result);
        },
        error: (err: Error) => {
          let msg = err.message;
          if (msg === 'QUOTA_EXCEEDED') {
            msg = `⚠️ COTA EXCEDIDA no modelo escolhido. Mude para um modelo marcado com (Free) na lista acima.`;
          }
          this.error.set(msg);
        }
      });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
