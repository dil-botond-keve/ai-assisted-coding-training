import { createContext } from 'react';
import type { Todo } from '../types/Todo';

export interface TodoContextType {
  todos: Todo[];
  addTodo: (title: string, description: string, dueDate?: string) => void;
  editTodo: (
    id: string,
    updates: Partial<Pick<Todo, 'title' | 'description' | 'completed' | 'dueDate'>>
  ) => void;
  toggleTodoCompletion: (id: string) => void;
  deleteTodo: (id: string) => void;
}

export const TodoContext = createContext<TodoContextType | undefined>(undefined);
