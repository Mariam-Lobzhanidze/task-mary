import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StepperService } from '../stepper.service';
import { UsersFacadeService } from '../../../facades/users-facade.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ProjectFacadeService } from 'src/app/facades/project.facade.service';
import { Project, UsersResponse } from 'src/app/core/interfaces';
import { AuthFacadeService } from '../../auth/auth-facade.service';
import { Router } from '@angular/router';
import { UsersHttpService } from '../../../core/services/users-http.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog';

@Component({
  selector: 'app-add-users',
  templateUrl: './add-users.component.html',
  styleUrls: ['./add-users.component.scss'],
})
export class AddUsersComponent implements OnInit, OnDestroy {
  usersFormGroup: FormGroup;
  goNextStep: boolean;
  createUser: boolean = false;
  active: boolean = false;
  sub$ = new Subject<any>();
  currentProject?: Project = this.projectFacadeService.getProject();
  projectUsers = [];
  addedUsers = [];
  users: any;
  additionalUser: boolean = false;
  showNext: boolean = false;
  constructor(
    private stepperService: StepperService,
    private usersFacadeService: UsersFacadeService,
    private projectFacadeService: ProjectFacadeService,
    private authFacadeService: AuthFacadeService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private userService: UsersHttpService,
    public matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.usersFormGroup = new FormGroup({
      firstName: new FormControl(null, Validators.required),
      lastName: new FormControl(null, Validators.required),
      email: new FormControl(null, Validators.required),
      mobileNumber: new FormControl(null, Validators.required),
    });
    this.goNextStep = false;
    this.showNext = true;
    this.currentProject = this.projectFacadeService.getProject();
    this.projectUsers.push(this.authFacadeService.user);
    this.getProjectUsers();

    this.usersFacadeService.additionalUser$.subscribe((res) => {
      this.additionalUser = res;
      if (res) {
        this.showNext = false;
        this.projectFacadeService
          .getProjectUsers$()
          .pipe(takeUntil(this.sub$))
          .subscribe((users) => {
            const userIds = users.map((user) => user.id);
            this.addedUsers.unshift(...userIds);
          });
      }
    });

    this.getAllUsers();
  }
  getAllUsers() {
    this.usersFacadeService.getAllUsers().subscribe((user) => {
      console.log(user);
      this.users = user;
    });
  }

  openDialog() {
    let dialogRef = this.matDialog.open(DialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/task']);
      }
    });
  }
  goToTasks() {
    this.router.navigate(['/task']);
  }
  saveUser() {
    if (this.usersFormGroup.valid) {
      this.goNextStep = true;
      this.usersFacadeService
        .createUsers(this.usersFormGroup.value)
        .pipe(takeUntil(this.sub$))
        .subscribe((res) => {
          console.log('user create response');
          console.log(res);
          this.setProjectUsers(res);
          this.getProjectUsers();

          this._snackBar.open('User Created', 'Close', { duration: 1000 });

          this.createUser = false;
          //-----------------------
          if (this.additionalUser) {
            this.openDialog();
            // this.router.navigate(['/task']);
          }
          // if (this.additionalUser) {
          //   this.active = true;
          //   setTimeout(() => {
          //     this.router.navigate(['/task']);
          //   }, 6000);
          // }
          //-------------------------
        });
    }
    this.usersFormGroup.reset();
  }

  toggleUserForm() {
    this.createUser = !this.createUser;
    this.goNextStep = false;
  }
  submit() {
    if (this.goNextStep) {
      this.stepperService.goToStep(4);
    }
  }

  addOldUsersToProject(user: any) {
    this.currentProject = this.projectFacadeService.getProject();
    this.addedUsers.unshift(`${user.id}`);
    this.projectFacadeService
      .addUsersToProject({
        projectId: this.currentProject.id,
        userIds: [...this.addedUsers, `${this.authFacadeService.user.id}`],
      })
      .subscribe((res) => {
        console.log('from old users');
        console.log(res);
        this.getProjectUsers();
        // console.log(res), this.router.navigate(['/task']);
      });
  }

  setProjectUsers(res: UsersResponse) {
    //--
    this.currentProject = this.projectFacadeService.getProject();
    //--
    this.addedUsers.unshift(`${res.id}`);
    this.projectFacadeService
      .addUsersToProject({
        projectId: this.currentProject.id,
        userIds: [...this.addedUsers, `${this.authFacadeService.user.id}`],
      })
      .pipe(takeUntil(this.sub$))
      .subscribe((res) => {
        console.log('newly created user');
        console.log(res);
        console.log(this.addedUsers);
      });
  }

  getProjectUsers() {
    this.projectFacadeService
      .getProjectUsers$()
      .pipe(takeUntil(this.sub$))
      .subscribe((users) => {
        this.projectUsers = users;
      });
  }
  ngOnDestroy(): void {
    this.sub$.next(null);
    this.sub$.complete();
  }
}
