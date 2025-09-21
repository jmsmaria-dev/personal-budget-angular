import { Routes } from '@angular/router';
import { Homepage } from './homepage/homepage';
import { About } from './about/about';
import { LoginPage } from './login-page/login-page';
import { PageNotFound } from './page-not-found/page-not-found';

export const routes: Routes = [
  {
    path: '',
    component: Homepage,
    pathMatch: 'full'
  },
  {
    path: 'about',
    component: About
  },
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '**',
    component: PageNotFound
  }

];
