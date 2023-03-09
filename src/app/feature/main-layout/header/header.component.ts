import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BoardResponse, Project } from 'src/app/core/interfaces';
import { BoardFacadeService } from 'src/app/facades/board-facade.service';
import { ProjectFacadeService } from 'src/app/facades/project.facade.service';
import { AuthFacadeService } from 'src/app/pages/auth/auth-facade.service';
import { StepperService } from 'src/app/pages/stepper/stepper.service';
import { PermissionsDirective } from '../../../core/directives/permissions.directive';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  authFacadeService: AuthFacadeService = inject(AuthFacadeService);

  currentProject?: Project = this.projectFacadeService.getProject();
  currentBoards: any;

  projects$ = this.projectFacadeService.projects$;
  currentUser;

  get loggedIn() {
    return this.authFacadeService.token;
  }

  constructor(
    private router: Router,
    private projectFacadeService: ProjectFacadeService,
    private boardFacadeService: BoardFacadeService,
    private stepperService: StepperService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getMyProjects();
    //--
    this.currentUser = this.authFacadeService.user;

    //--
  }

  public signOut(): void {
    this.authFacadeService.signOut();

    this.router.navigate(['/']);
  }

  selectProject(projectId: number) {
    this.projectFacadeService.setProject(projectId);
  }

  getMyProjects() {
    this.projectFacadeService.getOnlyMyProjects$().subscribe();
  }

  goToStepper() {
    this.router.navigate(['/stepper']);
    this.stepperService.goToStep(0);
  }

  //--

  //--
}
