import { Injectable } from '@angular/core';
import {
  TaskDeleteResponse,
  TaskInterface,
  TaskPutInterface,
  TasksResponse,
} from '../interfaces/task';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class TaskHttpService extends BaseService {
  createTask(payload: TaskInterface): Observable<TasksResponse> {
    return this.post<TasksResponse>('task', payload);
  }

  getTasks(boardId: number): Observable<TasksResponse[]> {
    return this.get<TasksResponse[]>(`task?boardId=${boardId}`);
  }

  getTaskById(id: number): Observable<TasksResponse> {
    return this.get<TasksResponse>(`task/${id}`);
  }
  updateTaskById(id: number, payload): Observable<TasksResponse> {
    return this.put<TasksResponse>(`task/${id}`, payload);
  }
  deleteTaskById(id: string): Observable<TaskDeleteResponse> {
    return this.delete<TaskDeleteResponse>(`task/${id}`);
  }
}
