import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../auth-facade.service';
import { ProjectFacadeService } from 'src/app/facades/project.facade.service';
import { tap, map, pipe } from 'rxjs';
import { AuthResponse, UsersResponse } from '../../../core/interfaces';
import { CookieStorageService } from '../../../core/services/cookie.service';
import { RoleHttpService } from '../../../core/services/role-http.service';
import { first } from 'rxjs/operators';
import { StepperService } from '../../stepper/stepper.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  sub$ = new Subject();
  loginForm: FormGroup;
  user: UsersResponse;
  email: string;
  constructor(
    private router: Router,
    private authFacadeService: AuthFacadeService,
    private projectFacadeService: ProjectFacadeService,
    private readonly fb: NonNullableFormBuilder,
    private cookieService: CookieStorageService,
    private roleService: RoleHttpService,
    private stepperService: StepperService
  ) {
    this.loginForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.onSignIn();
  }

  public onSignIn(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    this.saveRoles();
  }

  saveRoles() {
    this.authFacadeService
      .login(this.loginForm.value)
      .pipe(
        tap((res: AuthResponse) => {
          this.authFacadeService.updateUser(res.user);
          this.user = res.user;
          this.email = res.user.email;

          const roles = res.user.roles.map((r: any) => r.name);
          const expiration = new Date();
          expiration.setDate(expiration.getDate() + 1);
          this.cookieService.setCookie(
            'roles',
            JSON.stringify(roles),
            expiration
          );
          localStorage.setItem('user', JSON.stringify(res.user));
        }),
        switchMap(() =>
          this.roleService.getMyRole().pipe(
            map((res: any) => {
              const permissions: string[] = [];
              const roles = res.forEach((r: any) => {
                r.permissions &&
                  permissions.push(...r.permissions.map((p: any) => p.name));
              });

              localStorage.setItem('permissions', JSON.stringify(permissions));
              this.authFacadeService.permissionsSubject.next(permissions);
            })
          )
        ),
        takeUntil(this.sub$)
      )
      .subscribe(() => this.navigateToPages());
  }
  navigateToPages() {
    this.projectFacadeService.getMyProjects().subscribe((projects) => {
      if (projects.length > 0) {
        this.router.navigate(['/task']);
      } else {
        this.router.navigate(['/stepper']);
        this.stepperService.goToStep(0);
      }
    });
  }
  ngOnDestroy() {
    this.sub$.next(null);
    this.sub$.complete();
  }
}
