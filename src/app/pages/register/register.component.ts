import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/utils/errors';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  confirm = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    this.error.set('');
    const problem = this.validate();
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.loading.set(true);
    this.auth.register(this.username.trim(), this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  
  private validate(): string {
    const u = this.username.trim();
    if (!u || !this.email.trim() || !this.password) return 'Completá todos los campos.';
    if (u.length < 3 || u.length > 30) return 'El usuario debe tener entre 3 y 30 caracteres.';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'El usuario solo puede tener letras, números y guiones bajos.';
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) return 'El email no es válido.';
    if (this.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[a-zA-Z]/.test(this.password) || !/[0-9]/.test(this.password)) {
      return 'La contraseña debe tener al menos una letra y un número.';
    }
    if (this.password !== this.confirm) return 'Las contraseñas no coinciden.';
    return '';
  }
}
