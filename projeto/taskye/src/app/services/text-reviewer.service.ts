import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ModelOption, AnalysisResult } from '../interfaces/text-reviewer.interface';
import { environment } from '../environment/environment';

interface GeminiModelsResponse {
  models: Array<{
    name: string;
    displayName?: string;
    supportedGenerationMethods?: string[];
  }>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TextReviewerService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = environment.APP_GEMINI_URL;


  validateKeyAndFetchModels(): Observable<ModelOption[]> {
    return this.http.get<GeminiModelsResponse>(`${this.API_BASE_URL}/models`).pipe(
      map((data) => {
        const supportedModels = data.models
          .filter((m) =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m) => {
            let displayName = m.displayName || m.name.replace('models/', '');
            let isSafe = false;

            if (m.name.includes('flash')) {
              displayName = `(Free) ${displayName} (Ideal para Plano Grátis)`;
              isSafe = true;
            } else if (m.name.includes('pro') || m.name.includes('ultra')) {
              displayName = `(Pro) ${displayName} (Limite de Cota Rígido)`;
            } else {
              displayName = `(Unknown) ${displayName}`;
            }

            return {
              name: m.name,
              displayName,
              isSafe
            };
          });

        supportedModels.sort((a: ModelOption, b: ModelOption) => {
          if (a.name.includes('1.5-flash') && !a.name.includes('8b')) return -1;
          if (b.name.includes('1.5-flash') && !b.name.includes('8b')) return 1;

          if (a.isSafe && !b.isSafe) return -1;
          if (!a.isSafe && b.isSafe) return 1;

          return 0;
        });

        if (supportedModels.length === 0) {
          throw new Error('Nenhum modelo compatível encontrado.');
        }

        return supportedModels;
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.error?.message || 'Falha ao validar chave.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }


  analyzeText(
    modelName: string,
    text: string,
    tone: string
  ): Observable<AnalysisResult> {
    if (!text.trim()) {
      return throwError(() => new Error('Por favor, digite algum texto para revisar.'));
    }

    const rawModel = modelName;
    const modelId = rawModel.startsWith('models/') ? rawModel.replace('models/', '') : rawModel;

    const prompt = `
      Atue como um revisor de texto profissional.
      Tom desejado: ${tone}.
      Texto: "${text}"
      Retorne JSON: { "correctedText": "...", "improvements": ["..."], "toneAnalysis": "..." }
    `;

    return this.http.post<GeminiGenerateResponse>(
      `${this.API_BASE_URL}/models/${modelId}:generateContent`,
      { contents: [{ parts: [{ text: prompt }] }] }
    ).pipe(
      map((data) => {
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
          throw new Error('Sem resposta da IA.');
        }

        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          return JSON.parse(cleanJson) as AnalysisResult;
        } catch (e) {
          return {
            correctedText: textResponse,
            improvements: ["Formatação automática falhou, mas o texto foi processado."],
            toneAnalysis: "Ver texto principal."
          } as AnalysisResult;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.error?.error?.code === 429 ||
            error.error?.error?.message?.toLowerCase().includes('quota')) {
          return throwError(() => new Error('QUOTA_EXCEEDED'));
        }
        const errorMessage = error.error?.error?.message || 'Erro na API';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
