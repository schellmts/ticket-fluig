import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  
  email: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;
  lembrarMe: boolean = false;

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  onSubmit() {
    // TODO: Implementar lógica de autenticação
    console.log('Login:', { email: this.email, senha: this.senha, lembrarMe: this.lembrarMe });
    
    // Redireciona para a página inicial
    this.router.navigate(['/']);
  }
}
