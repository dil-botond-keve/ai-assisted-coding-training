import React from 'react';
import {
  ListItem,
  ListItemText,
  IconButton,
  Checkbox,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import type { Todo } from '../../types/Todo';
import { useTodo } from '../../hooks/useTodo';

interface TodoItemProps {
  todo: Todo;
  onEditClick: (todo: Todo) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onEditClick }) => {
  const { toggleTodoCompletion, deleteTodo } = useTodo();

  // Helper function to format due date and determine if overdue
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;

    const due = new Date(dueDate);
    const now = new Date();
    const isOverdue = due < now && !todo.completed;

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return {
      formatted: due.toLocaleDateString(undefined, formatOptions),
      isOverdue,
    };
  };

  const dueDateInfo = formatDueDate(todo.dueDate);

  return (
    <>
      <ListItem
        sx={{
          bgcolor: 'background.paper',
          py: 1,
          borderLeft: todo.completed ? '4px solid green' : '4px solid transparent',
          '&:hover': {
            bgcolor: 'action.hover',
            cursor: 'pointer',
          },
        }}
        onClick={() => onEditClick(todo)}
        secondaryAction={
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={e => {
              e.stopPropagation();
              deleteTodo(todo.id);
            }}
          >
            Delete
          </IconButton>
        }
      >
        <Checkbox
          edge="start"
          checked={todo.completed}
          onClick={e => {
            e.stopPropagation();
            toggleTodoCompletion(todo.id);
          }}
          color="primary"
          sx={{ mr: 1 }}
        />
        <ListItemText
          disableTypography
          primary={
            <Typography
              variant="body1"
              sx={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'text.secondary' : 'text.primary',
                fontWeight: 500,
              }}
            >
              {todo.title}
            </Typography>
          }
          secondary={
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}
              >
                {todo.description}
              </Typography>
              {dueDateInfo && (
                <Typography
                  variant="body2"
                  data-testid={`due-date-${todo.id}`}
                  sx={{
                    color: dueDateInfo.isOverdue ? 'error.main' : 'text.secondary',
                    fontWeight: dueDateInfo.isOverdue ? 600 : 400,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    mt: 0.5,
                  }}
                >
                  Due: {dueDateInfo.formatted}
                  {dueDateInfo.isOverdue && ' (Overdue)'}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItem>
      <Divider />
    </>
  );
};
