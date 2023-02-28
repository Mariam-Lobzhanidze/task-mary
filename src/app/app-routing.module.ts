import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './feature/main-layout/main-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/home/home.module').then((m) => m.HomeModule),
      },
      {
        path: 'auth',
        loadChildren: () =>
          import('./pages/auth/auth.module').then((m) => m.AuthModule),
      },
      {
        path: 'stepper',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/stepper/stepper.module').then((m) => m.StepperModule),
      },
      {
        path: 'tables',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/tables/table-tabs/table-tabs.module').then(
            (m) => m.TableTabsModule
          ),
      },
      {
        path: 'task',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/task/task.module').then(
            (m) => m.TaskModule
          ),
      },
      {
        path: 'users',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/users/users.module').then(
            (m) => m.UsersModule
          ),
      },
      {
        path: 'roles',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/roles/roles.module').then(
            (m) => m.RolesModule
          ),
      },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
