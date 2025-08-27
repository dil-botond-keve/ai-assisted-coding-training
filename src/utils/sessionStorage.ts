import type { Todo } from '../types/Todo';

const TODOS_STORAGE_KEY = 'todos';

export const saveTodosToStorage = (todos: Todo[]): void => {
  try {
    const todosWithSerializedDates = todos.map(todo => ({
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      dueDate: todo.dueDate || undefined, // Ensure consistent format
    }));
    sessionStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todosWithSerializedDates));
  } catch (error) {
    console.warn('Failed to save todos to storage:', error);
    // Could add toast notification here if available
  }
};

export const loadTodosFromStorage = (): Todo[] => {
  try {
    const stored = sessionStorage.getItem(TODOS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map(
      (todo: {
        id: string;
        title: string;
        description: string;
        completed: boolean;
        createdAt: string;
        dueDate?: string;
      }) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        dueDate: todo.dueDate && isValidISODate(todo.dueDate) ? todo.dueDate : undefined,
      })
    );
  } catch (error) {
    console.warn('Failed to load todos from storage:', error);
    return [];
  }
};

const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
};
