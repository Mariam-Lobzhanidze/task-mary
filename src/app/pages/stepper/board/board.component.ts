import { group } from '@angular/animations';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, switchMap, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { TaskStatus } from 'src/app/core/enums/taskStatus.enum';
import { BoardResponse } from 'src/app/core/interfaces';
import { BoardFacadeService } from 'src/app/facades/board-facade.service';
import { IssueTypeFacadeService } from 'src/app/facades/issue-type.facade.service';
import { DialogComponent } from '../dialog/dialog';
import { StepperService } from '../stepper.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, OnDestroy {
  stepperService: StepperService = inject(StepperService);
  update: boolean = false;

  tasks = TaskStatus;
  taskEnum = [];
  active: boolean = false;

  goNextStep: boolean;
  createBoard: boolean = false;
  myBoards: BoardResponse[] = [];

  boardFormGroup: FormGroup;
  columnGroup: FormGroup;

  additionalBoard: boolean;
  boardId: number;
  sub$ = new Subject<any>();
  boardPosition = 0;
  constructor(
    private boardFacadeService: BoardFacadeService,
    private IssueTypeFacadeService: IssueTypeFacadeService,
    private router: Router,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar,
    public matDialog: MatDialog
  ) {
    this.taskEnum = Object.keys(this.tasks);
  }

  ngOnInit(): void {
    this.boardFacadeService.additional$.subscribe((res) => {
      this.additionalBoard = res;
      console.log(res);
      this.boardFacadeService.myBoards.subscribe((res) => {
        this.myBoards = res.sort((a, b) => a.id - b.id);
      });
    });

    this.boardFormGroup = new FormGroup({
      id: new FormControl(null),
      name: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),

      position: new FormControl(0),

      columns: new FormArray([
        // new FormGroup({
        //   id: new FormControl(null),
        //   name: new FormControl(null, Validators.required),
        //   description: new FormControl(null, Validators.required),
        //   position: new FormControl(null, Validators.required),
        //   taskStatus: new FormControl(null, Validators.required),
        // }),
      ]),
    });

    this.route.params
      .pipe(
        switchMap((params: any) => {
          if (params['id']) {
            this.update = true;
            this.boardId = params['id'];
            return this.boardFacadeService.getBoardById(params['id']);
          }
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          const boardColumns = response.columns;
          const columnsArray = this.boardFormGroup.get('columns') as FormArray;
          this.boardFormGroup.patchValue(response);
          // columnsArray.removeAt(0);
          boardColumns.forEach((column, index) => {
            columnsArray.push(
              new FormGroup({
                id: new FormControl(column.id),
                name: new FormControl(column.name, Validators.required),
                description: new FormControl(
                  column.description,
                  Validators.required
                ),
                position: new FormControl(column.position, Validators.required),
                taskStatus: new FormControl(
                  column.taskStatus,
                  Validators.required
                ),
              })
            );
          });
        }
      });
  }

  get boardColumnArray() {
    return <FormArray>this.boardFormGroup.get('columns');
  }

  addColumn() {
    this.columnGroup = new FormGroup({
      id: new FormControl(null),
      name: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
      position: new FormControl(
        this.boardColumnArray.length + 1,
        Validators.required
      ),
      taskStatus: new FormControl(null, Validators.required),
    });

    this.boardColumnArray.push(this.columnGroup);
  }

  deleteInputsRow(index: number) {
    this.boardColumnArray.removeAt(index);
  }
  toggleForm() {
    this.goNextStep = false;
    this.createBoard = !this.createBoard;
  }
  saveBoard() {
    this.boardFormGroup.markAllAsTouched();
    if (this.boardFormGroup.invalid) return;
    //--
    this.boardPosition++;
    this.boardFormGroup.get('position').setValue(this.boardPosition);
    console.log('position');
    console.log(this.boardPosition);
    //--
    this.active = true;
    if (!this.boardFormGroup.value.id) {
      this.boardFacadeService
        .createBoard(this.boardFormGroup.value)
        .pipe(
          takeUntil(this.sub$),
          switchMap(() => this.boardFacadeService.getMyBoards$())
        )
        .subscribe((res) => {
          //--
          this.boardColumnArray.clear();
          //--

          console.log(res);

          this.myBoards = res.sort((a, b) => a.id - b.id);

          this._snackBar.open('Board Created', 'Close', { duration: 1000 });
          setTimeout(() => {
            this.active = false;
            if (this.additionalBoard) {
              this.openDialog();
            }
            this.goNextStep = true;
          }, 3000);

          this.createBoard = false;
          this.boardFormGroup.reset();
        });
    } else {
      this.boardFacadeService
        .updateBoardById(
          this.boardFormGroup.value.id,
          this.boardFormGroup.value
        )
        .pipe(takeUntil(this.sub$))
        .subscribe((response: BoardResponse) => {
          console.log(response);
          this.router.navigate([`/task/project-board/${this.boardId}`]);
          this.goNextStep = true;
          this.createBoard = false;
          this.boardFacadeService.update$.next(true);
        });
    }
  }

  toggleBoardForm() {
    this.createBoard = !this.createBoard;
    this.goNextStep = false;
  }

  submit() {
    this.stepperService.goToStep(2);
    this.IssueTypeFacadeService.additionalIssue.next(false);
  }

  openDialog() {
    let dialogRef = this.matDialog.open(DialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/task']);
      }
    });
  }

  drop(event: CdkDragDrop<any>) {
    console.log('Drop Event', event);

    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.boardColumnArray.controls,
        event.previousIndex,
        event.currentIndex
      );

      this.boardColumnArray.controls.forEach((control, index) => {
        control.get('position')?.setValue(index + 1);
      });
      console.log(
        'updated Array',
        this.boardColumnArray.controls.map((control) => control.value)
      );
    }
  }

  goTo() {
    this.stepperService.goToStep(2);
  }
  ngOnDestroy(): void {
    this.sub$.next(null);
    this.sub$.complete();
  }
}
