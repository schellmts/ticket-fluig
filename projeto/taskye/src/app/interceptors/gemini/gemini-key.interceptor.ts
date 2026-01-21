import { HttpHandler, HttpInterceptor, HttpRequest, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environment/environment";

@Injectable()
export class GeminiKeyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (!req.url.includes(environment.APP_GEMINI_URL)) {
      return next.handle(req);
    }

    const apiKey = environment.APP_GEMINI_KEY;

    let params = req.params || new HttpParams();
    if (!params.has('key')) {
      params = params.set('key', apiKey);
    }

    const authReq = req.clone({
      params: params
    });

    return next.handle(authReq);
  }
}
