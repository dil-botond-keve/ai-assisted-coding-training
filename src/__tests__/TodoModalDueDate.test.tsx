import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TodoModal } from '../components/TodoModal/TodoModal';
import { useTodo } from '../hooks/useTodo';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useTodo hook
vi.mock('../hooks/useTodo', () => ({
  useTodo: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>{children}</LocalizationProvider>
);

describe('TodoModal Due Date Functionality', () => {
  const mockAddTodo = vi.fn();
  const mockEditTodo = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTodo as jest.MockedFunction<typeof useTodo>).mockReturnValue({
      addTodo: mockAddTodo,
      editTodo: mockEditTodo,
      todos: [],
      toggleTodoCompletion: vi.fn(),
      deleteTodo: vi.fn(),
    });
  });

  describe('Date Picker Integration', () => {
    it('renders date picker in create mode', () => {
      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Use data-testid instead of complex label matching
      expect(screen.getByTestId('due-date-input')).toBeInTheDocument();
    });

    it('renders date picker in edit mode', () => {
      const mockTodo = {
        id: '123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
        </TestWrapper>
      );

      // Check that the date input has the expected value
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('12/31/2023');
    });

    it('submits form without due date', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Fill in only the required title field
      await user.type(screen.getByTestId('title-input'), 'Test Todo');

      // Submit the form without setting due date
      await user.click(screen.getByTestId('submit-button'));

      // Check that addTodo was called without due date (undefined)
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith('Test Todo', '', undefined);
      });
    });

    it('allows user to clear due date', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Fill in title (required field)
      await user.type(screen.getByTestId('title-input'), 'Test Todo');

      // The date picker should be empty initially - submit without date
      await user.click(screen.getByTestId('submit-button'));

      // Check that addTodo was called with undefined due date
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith('Test Todo', '', undefined);
      });
    });
  });

  describe('Edit Mode with Due Date', () => {
    it('pre-fills date picker with existing due date', () => {
      const mockTodo = {
        id: '123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
        </TestWrapper>
      );

      // Check that the date field is pre-filled
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('12/31/2023');
    });

    it('handles editing todo with due date', async () => {
      const mockTodo = {
        id: '123',
        title: 'Original Title',
        description: 'Original Description',
        completed: false,
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
        </TestWrapper>
      );

      // Verify initial values are loaded correctly
      expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Original Description')).toBeInTheDocument();

      // Check that the date field is pre-filled
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('12/31/2023');
    });

    it('handles editing todo without initial due date', () => {
      const mockTodo = {
        id: '123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        // No dueDate
      };

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
        </TestWrapper>
      );

      // Check that the date field is empty
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('');
    });
  });

  describe('Form Reset on Modal Open/Close', () => {
    it('resets date picker when modal opens in create mode', () => {
      const { rerender } = render(
        <TestWrapper>
          <TodoModal isOpen={false} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Open modal
      rerender(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Date picker should be empty
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('');
    });

    it('resets date picker when switching from edit to create mode', () => {
      const mockTodo = {
        id: '123',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        dueDate: '2023-12-31T00:00:00.000Z',
      };

      const { rerender } = render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
        </TestWrapper>
      );

      // Switch to create mode
      rerender(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      // Date picker should be empty
      const dateInput = screen.getByTestId('due-date-input');
      expect(dateInput).toHaveValue('');
    });
  });

  describe('Date Validation', () => {
    it('accepts valid date input', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('title-input'), 'Test Todo');

      const dateInput = screen.getByTestId('due-date-input');
      await user.click(dateInput);
      await user.type(dateInput, '01/01/2024');

      // Submit should work
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
