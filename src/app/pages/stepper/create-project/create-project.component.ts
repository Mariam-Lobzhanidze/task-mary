import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { BoardFacadeService } from 'src/app/facades/board-facade.service';
import { ProjectFacadeService } from 'src/app/facades/project.facade.service';
import { StepperService } from '../stepper.service';
import { CreateProjectService } from './create-project.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.scss'],
})
export class CreateProjectComponent implements OnInit, OnDestroy {
  stepperService: StepperService = inject(StepperService);
  createProjectService: CreateProjectService = inject(CreateProjectService);

  projectFormGroup: FormGroup;
  sub$ = new Subject<any>();
  updateState: boolean = false;
  active: boolean = false;

  myProjects$ = this.projectFacadeService.projects$;

  constructor(
    private route: ActivatedRoute,
    private projectFacadeService: ProjectFacadeService,
    private boardFacadeService: BoardFacadeService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.projectFormGroup = new FormGroup({
      id: new FormControl(null),
      name: new FormControl(null, Validators.required),
      abbreviation: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
      color: new FormControl(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params: any) => {
          if (params['id']) {
            this.updateState = true;
            return this.projectFacadeService.getProjectById(params['id']);
          }
          return of(null);
        })
      )
      .subscribe((response) => {
        console.log('project by id');
        console.log(response);

        if (response) {
          this.projectFormGroup.patchValue({
            id: response.id,
            ...response,
          });
        }
      });
  }

  submit() {
    this.projectFormGroup.markAllAsTouched();
    if (this.projectFormGroup.invalid) return;

    if (!this.projectFormGroup.value.id) {
      this.active = true;
      this.createProjectService
        .createProject(this.projectFormGroup.value)
        .pipe(
          takeUntil(this.sub$),
          tap((res) => this.projectFacadeService.setProject(res.id)),
          switchMap(() => this.projectFacadeService.getOnlyMyProjects$())
        )
        .subscribe((response) => {
          this.boardFacadeService.additional.next(false);
          // this.active = true;

          this._snackBar.open('Project Created', 'Close', { duration: 2000 });
          setTimeout(() => {
            this.stepperService.goToStep(1);
          }, 3000);

          console.log(response);
        });
    } else {
      this.projectFacadeService
        .updateProject(
          this.projectFormGroup.value.id,
          this.projectFormGroup.value
        )
        .pipe(
          takeUntil(this.sub$),
          tap((res) => this.projectFacadeService.setProject(res.id)),
          switchMap(() => this.projectFacadeService.getOnlyMyProjects$())
        )
        .subscribe((response) => {
          this.router.navigate(['/tables']);
        });

      // this.router.navigate(['/tables']);
    }
  }
  goTo() {
    this.stepperService.goToStep(1);
  }
  ngOnDestroy(): void {
    this.sub$.next(null);
    this.sub$.complete();
  }
}
