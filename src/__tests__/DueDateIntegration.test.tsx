import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TodoProvider } from '../contexts/TodoContext';
import { TodoList } from '../components/TodoList/TodoList';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { TodoModal } from '../components/TodoModal/TodoModal';
import { useState } from 'react';
import type { Todo } from '../types/Todo';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const TestApp = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);

  const handleEditTodo = (todo: Todo) => {
    setTodoToEdit(todo);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setTodoToEdit(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TodoProvider>
        <CreateTodoButton />
        <TodoList onEditTodo={handleEditTodo} />
        {todoToEdit && (
          <TodoModal
            isOpen={editModalOpen}
            onClose={handleCloseEditModal}
            mode="edit"
            initialValues={{
              id: todoToEdit.id,
              title: todoToEdit.title,
              description: todoToEdit.description,
              completed: todoToEdit.completed,
              dueDate: todoToEdit.dueDate,
            }}
          />
        )}
      </TodoProvider>
    </LocalizationProvider>
  );
};

describe('Due Date Integration Tests', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear();
  });

  describe('End-to-End Due Date Workflow', () => {
    it('verifies todo creation with due date functionality exists', async () => {
      const user = userEvent.setup();

      render(<TestApp />);

      // Open create modal
      await user.click(screen.getByText('Add Todo'));

      // Verify modal opens and due date input exists
      await waitFor(() => {
        expect(screen.getByText('Create Todo')).toBeInTheDocument();
        expect(screen.getByTestId('due-date-input')).toBeInTheDocument();
      });

      // Fill in basic form data without complex date interaction
      await user.type(screen.getByTestId('title-input'), 'Simple Todo');

      // Submit the form
      await user.click(screen.getByTestId('submit-button'));

      // Wait for the modal to close and todo to appear
      await waitFor(() => {
        expect(screen.queryByText('Create Todo')).not.toBeInTheDocument();
      });

      // Check that the todo appears in the list
      await waitFor(() => {
        expect(screen.getByText('Simple Todo')).toBeInTheDocument();
      });

      // Verify data was persisted to session storage
      const storedData = sessionStorage.getItem('todos');
      expect(storedData).toBeTruthy();
      const todos = JSON.parse(storedData!);
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Simple Todo');
    });

    it('loads todos with due dates from session storage on app start', async () => {
      // Pre-populate session storage with a todo that has a due date
      const todoWithDueDate = {
        id: 'test-id',
        title: 'Stored Todo',
        description: 'Stored Description',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: '2024-06-15T00:00:00.000Z',
      };

      sessionStorage.setItem('todos', JSON.stringify([todoWithDueDate]));

      render(<TestApp />);

      // Wait for the todo to be loaded and displayed
      await waitFor(() => {
        expect(screen.getByText('Stored Todo')).toBeInTheDocument();
        expect(screen.getByText('Stored Description')).toBeInTheDocument();
        expect(screen.getByText(/Due: Jun 15, 2024/)).toBeInTheDocument();
      });
    });

    it('verifies todo edit functionality exists', async () => {
      const user = userEvent.setup();

      // Pre-populate with a todo
      const originalTodo = {
        id: '1',
        title: 'Original Title',
        description: 'Original Description',
        completed: false,
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      sessionStorage.setItem('todos', JSON.stringify([originalTodo]));

      render(<TestApp />);

      // Wait for todo to load and verify it's displayed
      await waitFor(() => {
        expect(screen.getByText('Original Title')).toBeInTheDocument();
        expect(screen.getByText(/Due: Dec 31, 2023/)).toBeInTheDocument();
      });

      // Click on the todo to verify edit modal opens
      await user.click(screen.getByText('Original Title'));

      // Verify edit modal opens with correct title
      await waitFor(() => {
        expect(screen.getByText('Edit Todo')).toBeInTheDocument();
      });

      // Verify due date input exists and has correct initial value
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('12/31/2023');
    });
    it('handles overdue todos correctly', async () => {
      // Create a todo with a past due date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

      const overdueTodo = {
        id: 'overdue-id',
        title: 'Overdue Todo',
        description: 'This is overdue',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: pastDate.toISOString(),
      };

      sessionStorage.setItem('todos', JSON.stringify([overdueTodo]));

      render(<TestApp />);

      // Wait for todo to load
      await waitFor(() => {
        expect(screen.getByText('Overdue Todo')).toBeInTheDocument();
        expect(screen.getByText(/\(Overdue\)/)).toBeInTheDocument();
      });

      // Check that overdue styling is applied
      const dueDateElement = screen.getByTestId('due-date-overdue-id');
      expect(dueDateElement).toHaveStyle('font-weight: 600');
    });

    it('removes overdue status when todo is completed', async () => {
      const user = userEvent.setup();

      // Create an overdue todo
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3); // 3 days ago

      const overdueTodo = {
        id: 'completion-test-id',
        title: 'Complete Overdue Todo',
        description: 'Test completion',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: pastDate.toISOString(),
      };

      sessionStorage.setItem('todos', JSON.stringify([overdueTodo]));

      render(<TestApp />);

      // Wait for todo to load and verify it's overdue
      await waitFor(() => {
        expect(screen.getByText('Complete Overdue Todo')).toBeInTheDocument();
        expect(screen.getByText(/\(Overdue\)/)).toBeInTheDocument();
      });

      // Mark as completed
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Wait for the update to be processed
      await waitFor(() => {
        // The overdue indicator should be gone
        expect(screen.queryByText(/\(Overdue\)/)).not.toBeInTheDocument();

        // But the due date should still be shown with strikethrough
        const dueDateElement = screen.getByTestId('due-date-completion-test-id');
        expect(dueDateElement).toHaveStyle('text-decoration: line-through');
      });

      // Verify completion was persisted
      const storedData = sessionStorage.getItem('todos');
      const todos = JSON.parse(storedData!);
      expect(todos[0].completed).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles todos with invalid due date strings gracefully', async () => {
      // Create a todo with invalid due date in storage
      const invalidTodo = {
        id: 'invalid-date-id',
        title: 'Invalid Date Todo',
        description: 'Has invalid due date',
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: 'not-a-date',
      };

      sessionStorage.setItem('todos', JSON.stringify([invalidTodo]));

      render(<TestApp />);

      // Todo should still load but without due date display
      await waitFor(() => {
        expect(screen.getByText('Invalid Date Todo')).toBeInTheDocument();
        expect(screen.queryByTestId('due-date-invalid-date-id')).not.toBeInTheDocument();
      });
    });

    it('handles session storage errors gracefully', () => {
      // Mock sessionStorage to throw an error
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = vi.fn(() => {
        throw new Error('Storage access denied');
      });

      // App should still render without crashing
      expect(() => render(<TestApp />)).not.toThrow();

      // Restore original function
      sessionStorage.getItem = originalGetItem;
    });
  });
});
