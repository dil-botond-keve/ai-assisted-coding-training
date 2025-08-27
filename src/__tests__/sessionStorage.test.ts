import { describe, it, expect, beforeEach } from 'vitest';
import { saveTodosToStorage, loadTodosFromStorage } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear();
  });

  describe('saveTodosToStorage', () => {
    it('should save todos to session storage', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
          dueDate: '2023-12-31T00:00:00.000Z',
        },
      ];

      saveTodosToStorage(todos);

      const stored = sessionStorage.getItem('todos');
      expect(stored).toBeTruthy();

      const parsedTodos = JSON.parse(stored!);
      expect(parsedTodos).toHaveLength(1);
      expect(parsedTodos[0].title).toBe('Test Todo');
      expect(parsedTodos[0].dueDate).toBe('2023-12-31T00:00:00.000Z');
    });

    it('should handle empty todos array', () => {
      saveTodosToStorage([]);

      const stored = sessionStorage.getItem('todos');
      expect(stored).toBe('[]');
    });

    it('should handle todos without due dates', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      saveTodosToStorage(todos);

      const stored = sessionStorage.getItem('todos');
      const parsedTodos = JSON.parse(stored!);
      expect(parsedTodos[0].dueDate).toBeUndefined();
    });

    it('should handle storage errors gracefully', () => {
      // Mock sessionStorage to throw an error
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      // Should not throw an error
      expect(() => saveTodosToStorage(todos)).not.toThrow();

      // Restore original function
      sessionStorage.setItem = originalSetItem;
    });
  });

  describe('loadTodosFromStorage', () => {
    it('should return empty array when no data exists', () => {
      const todos = loadTodosFromStorage();
      expect(todos).toEqual([]);
    });

    it('should load todos from session storage', () => {
      const todoData = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          dueDate: '2023-12-31T00:00:00.000Z',
        },
      ];

      sessionStorage.setItem('todos', JSON.stringify(todoData));

      const todos = loadTodosFromStorage();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test Todo');
      expect(todos[0].dueDate).toBe('2023-12-31T00:00:00.000Z');
      expect(todos[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle todos without due dates', () => {
      const todoData = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      sessionStorage.setItem('todos', JSON.stringify(todoData));

      const todos = loadTodosFromStorage();
      expect(todos[0].dueDate).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', () => {
      sessionStorage.setItem('todos', 'invalid json');

      const todos = loadTodosFromStorage();
      expect(todos).toEqual([]);
    });

    it('should handle storage errors gracefully', () => {
      // Mock sessionStorage to throw an error
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = () => {
        throw new Error('Storage access denied');
      };

      const todos = loadTodosFromStorage();
      expect(todos).toEqual([]);

      // Restore original function
      sessionStorage.getItem = originalGetItem;
    });

    it('should handle invalid date strings', () => {
      const todoData = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: 'invalid-date',
          dueDate: 'also-invalid-date',
        },
      ];

      sessionStorage.setItem('todos', JSON.stringify(todoData));

      const todos = loadTodosFromStorage();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test Todo');
      expect(todos[0].createdAt).toBeInstanceOf(Date);
      expect(isNaN(todos[0].createdAt.getTime())).toBe(true); // Invalid date
      expect(todos[0].dueDate).toBeUndefined(); // Invalid dueDate should be undefined
    });

    it('should validate ISO 8601 format for due dates', () => {
      const todoData = [
        {
          id: '1',
          title: 'Valid Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          dueDate: '2023-12-31T23:59:59.999Z', // Valid ISO 8601
        },
        {
          id: '2',
          title: 'Invalid Due Date Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
          dueDate: '12/31/2023', // Invalid format
        },
      ];

      sessionStorage.setItem('todos', JSON.stringify(todoData));

      const todos = loadTodosFromStorage();
      // Should include both todos but with corrected dueDate
      expect(todos).toHaveLength(2);
      expect(todos[0].title).toBe('Valid Todo');
      expect(todos[0].dueDate).toBe('2023-12-31T23:59:59.999Z');
      expect(todos[1].title).toBe('Invalid Due Date Todo');
      expect(todos[1].dueDate).toBeUndefined(); // Invalid format becomes undefined
    });
  });
});
