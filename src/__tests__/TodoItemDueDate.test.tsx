import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '../components/TodoList/TodoItem';
import { useTodo } from '../hooks/useTodo';
import type { Todo } from '../types/Todo';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useTodo hook
vi.mock('../hooks/useTodo', () => ({
  useTodo: vi.fn(),
}));

describe('TodoItem Due Date Display', () => {
  const mockToggleTodoCompletion = vi.fn();
  const mockDeleteTodo = vi.fn();
  const mockOnEditClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTodo as jest.MockedFunction<typeof useTodo>).mockReturnValue({
      addTodo: vi.fn(),
      editTodo: vi.fn(),
      todos: [],
      toggleTodoCompletion: mockToggleTodoCompletion,
      deleteTodo: mockDeleteTodo,
    });
  });

  describe('Due Date Display', () => {
    it('shows due date when present', () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      expect(screen.getByTestId(`due-date-${mockTodo.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`due-date-${mockTodo.id}`)).toHaveTextContent('Due: Dec 31, 2023');
    });

    it('does not show due date when not present', () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        // No dueDate
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      expect(screen.queryByTestId(`due-date-${mockTodo.id}`)).not.toBeInTheDocument();
    });

    it('shows overdue indicator when due date has passed', () => {
      // Create a date that's definitely in the past
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockTodo: Todo = {
        id: '1',
        title: 'Overdue Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: pastDate.toISOString(),
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);
      expect(dueDateElement).toBeInTheDocument();
      expect(dueDateElement).toHaveTextContent('(Overdue)');
    });

    it('does not show overdue indicator when todo is completed', () => {
      // Create a date that's definitely in the past
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockTodo: Todo = {
        id: '1',
        title: 'Completed Overdue Todo',
        description: 'Test Description',
        completed: true, // Completed todo
        createdAt: new Date('2023-01-01'),
        dueDate: pastDate.toISOString(),
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);
      expect(dueDateElement).toBeInTheDocument();
      expect(dueDateElement).not.toHaveTextContent('(Overdue)');
    });

    it('applies correct styling for overdue items', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockTodo: Todo = {
        id: '1',
        title: 'Overdue Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: pastDate.toISOString(),
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);

      // Check for error color styling and font weight for overdue items
      expect(dueDateElement).toHaveStyle('font-weight: 600');
    });

    it('applies normal styling for non-overdue items', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockTodo: Todo = {
        id: '1',
        title: 'Future Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: futureDate.toISOString(),
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);

      // Check for normal font weight
      expect(dueDateElement).toHaveStyle('font-weight: 400');
    });

    it('shows strikethrough for completed todos with due dates', () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Completed Todo',
        description: 'Test Description',
        completed: true,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);
      expect(dueDateElement).toHaveStyle('text-decoration: line-through');
    });
  });

  describe('Date Formatting', () => {
    it('formats date correctly for different locales', () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-07-04T00:00:00.000Z', // July 4th
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);
      expect(dueDateElement).toHaveTextContent('Due: Jul 4, 2023');
    });

    it('handles different year correctly', () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2024-01-01T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      const dueDateElement = screen.getByTestId(`due-date-${mockTodo.id}`);
      expect(dueDateElement).toHaveTextContent('Due: Jan 1, 2024');
    });
  });

  describe('Interactive Behavior', () => {
    it('allows clicking on todo with due date', async () => {
      const user = userEvent.setup();
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      // Click on the todo item
      await user.click(screen.getByText('Test Todo'));

      expect(mockOnEditClick).toHaveBeenCalledWith(mockTodo);
    });

    it('allows toggling completion status for todo with due date', async () => {
      const user = userEvent.setup();
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      // Click on the checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockToggleTodoCompletion).toHaveBeenCalledWith(mockTodo.id);
    });

    it('allows deleting todo with due date', async () => {
      const user = userEvent.setup();
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(<TodoItem todo={mockTodo} onEditClick={mockOnEditClick} />);

      // Click on the delete button
      await user.click(screen.getByText('Delete'));

      expect(mockDeleteTodo).toHaveBeenCalledWith(mockTodo.id);
    });
  });
});
