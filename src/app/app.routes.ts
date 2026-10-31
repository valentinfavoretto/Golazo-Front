import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'GOLAZO · Partidos de hoy',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'liga/:id',
    title: 'GOLAZO · Competición',
    loadComponent: () => import('./pages/league/league.component').then((m) => m.LeagueComponent),
  },
  {
    path: 'partido/:id',
    title: 'GOLAZO · Partido',
    loadComponent: () =>
      import('./pages/match-detail/match-detail.component').then((m) => m.MatchDetailComponent),
  },
  {
    path: 'equipos',
    title: 'GOLAZO · Buscar equipos',
    loadComponent: () => import('./pages/teams/teams.component').then((m) => m.TeamsComponent),
  },
  {
    path: 'login',
    title: 'GOLAZO · Ingresar',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    title: 'GOLAZO · Crear cuenta',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'perfil',
    title: 'GOLAZO · Mi cuenta',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'admin',
    title: 'GOLAZO · Administración',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
