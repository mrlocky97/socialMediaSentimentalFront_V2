import { Routes } from "@angular/router";
import { LayoutComponent } from "./layout/layout.component";
import { HomeComponent } from "./home/home.component";

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  },
];