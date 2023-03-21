import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthResponse, Login, Project } from 'src/app/core/interfaces';
import { Users, UsersResponse } from 'src/app/core/interfaces/users.interface';
import { AuthService } from 'src/app/core/services/auth.service';
import { CookieStorageService } from 'src/app/core/services/cookie.service';

import { ProjectFacadeService } from 'src/app/facades/project.facade.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacadeService extends AuthService {
  cookieStorageService: CookieStorageService = inject(CookieStorageService);

  projectFacadeService: ProjectFacadeService = inject(ProjectFacadeService);

  private userSubject = new BehaviorSubject<UsersResponse>(null);
  private roleSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  //--
  permissionsSubject = new BehaviorSubject<string[]>([]);
  permissions$ = this.permissionsSubject.asObservable();
  //--

  override login(payload: Login) {
    return super.login(payload).pipe(
      tap((response: AuthResponse) => {
        const expiresInMilliseconds = 24 * 60 * 60 * 1000;

        const cookieExpire = new Date(Date.now() + expiresInMilliseconds);

        console.log('cookie expire date:');
        console.log(cookieExpire);

        this.cookieStorageService.setCookie(
          'token',
          response.token.accessToken,
          cookieExpire
        );

        this.cookieStorageService.setCookie(
          'refreshToken',
          response.token.refreshToken
        );

        console.log('this is a refresh token');
        console.log(this.RefreshTok);

        this.setUser(response.user);

        setTimeout(() => {
          if (response.user.projects.length) {
            const project = response.user.projects[0] as Project;
            this.projectFacadeService.setProject(project.id);
          }
        });
        console.log(this.token);
        console.log(this.user);
      })
    );
  }
  get roles(): string[] {
    const roles = this.cookieStorageService.getCookie('roles');
    return (roles ? JSON.parse(roles) : []) as string[];
  }
  get permissions(): string[] {
    const permissions = localStorage.getItem('permissions');
    return (permissions ? JSON.parse(permissions) : []) as string[];
  }

  get token(): string {
    return this.cookieStorageService.getCookie('token');
  }

  get RefreshTok(): string {
    return this.cookieStorageService.getCookie('refreshToken');
  }

  setUser(user: UsersResponse) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  get user(): UsersResponse {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  updateUser(user: UsersResponse) {
    this.userSubject.next(user);
  }

  signOut() {
    console.log('Deleting tokens from cookies...');
    localStorage.clear();
    this.cookieStorageService.deleteCookie('token');
    this.cookieStorageService.deleteCookie('refreshToken');
    this.cookieStorageService.deleteCookie('roles');
    console.log('Tokens deleted from cookies.');
  }
}
