// React is used implicitly
import { render, screen } from '@testing-library/react';
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

describe('TodoModal Component', () => {
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

  it('renders create modal correctly', () => {
    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
      </TestWrapper>
    );

    // Check that the modal title is displayed
    expect(screen.getByText('Create Todo')).toBeInTheDocument();

    // Check that form elements are displayed
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Completed checkbox should not be shown in create mode
    expect(screen.queryByText('Mark as completed')).not.toBeInTheDocument();
  });

  it('renders edit modal correctly with pre-filled values', () => {
    const mockTodo = {
      id: '123',
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
    };

    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
      </TestWrapper>
    );

    // Check that the modal title is displayed
    expect(screen.getByText('Edit Todo')).toBeInTheDocument();

    // Check that form elements are displayed with pre-filled values
    expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByTestId('completed-checkbox')).not.toBeChecked();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not submit when title is empty', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
      </TestWrapper>
    );

    // Try to submit without entering a title
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should not call addTodo
    expect(mockAddTodo).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls addTodo when form is submitted in create mode', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
      </TestWrapper>
    );

    // Fill in form fields
    await user.type(screen.getByTestId('title-input'), 'New Todo');
    await user.type(screen.getByTestId('description-input'), 'New Description');

    // Submit the form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Should call addTodo with correct values
    expect(mockAddTodo).toHaveBeenCalledWith('New Todo', 'New Description', undefined);

    // Should close the modal
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls editTodo when form is submitted in edit mode', async () => {
    const user = userEvent.setup();
    const mockTodo = {
      id: '123',
      title: 'Test Todo',
      description: 'Test Description',
      completed: false,
    };

    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="edit" initialValues={mockTodo} />
      </TestWrapper>
    );

    // Edit form fields
    await user.clear(screen.getByDisplayValue('Test Todo'));
    await user.type(screen.getByTestId('title-input'), 'Updated Todo');
    await user.clear(screen.getByDisplayValue('Test Description'));
    await user.type(screen.getByTestId('description-input'), 'Updated Description');

    // Mark as completed
    const completedCheckbox = screen.getByTestId('completed-checkbox');
    await user.click(completedCheckbox);

    // Submit the form
    await user.click(screen.getByTestId('submit-button'));

    // Should call editTodo with correct values
    expect(mockEditTodo).toHaveBeenCalledWith('123', {
      title: 'Updated Todo',
      description: 'Updated Description',
      completed: true,
      dueDate: undefined,
    });

    // Should close the modal
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes the modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <TodoModal isOpen={true} onClose={mockOnClose} mode="create" />
      </TestWrapper>
    );

    // Click cancel button
    await user.click(screen.getByText('Cancel'));

    // Should call onClose
    expect(mockOnClose).toHaveBeenCalled();

    // Should not call addTodo
    expect(mockAddTodo).not.toHaveBeenCalled();
  });
});
