import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { ProductsComponent } from './pages/products/products';
import { ErpComponent } from './pages/erp/erp';
import { PrivacyComponent } from './pages/privacy/privacy';
import { TermsComponent } from './pages/terms/terms';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products.html', component: ProductsComponent },
  { path: 'erp.html', component: ErpComponent },
  { path: 'privacy.html', component: PrivacyComponent },
  { path: 'terms.html', component: TermsComponent },
];
