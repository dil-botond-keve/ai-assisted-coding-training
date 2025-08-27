import React, { useState, useEffect } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';
import { saveTodosToStorage, loadTodosFromStorage } from '../utils/sessionStorage';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Load todos from storage on mount
  useEffect(() => {
    const storedTodos = loadTodosFromStorage();
    setTodos(storedTodos);
  }, []);

  // Save todos to storage whenever todos change
  useEffect(() => {
    if (todos.length > 0) {
      saveTodosToStorage(todos);
    }
  }, [todos]);

  const addTodo = (title: string, description: string, dueDate?: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      dueDate: dueDate || undefined,
    };
    setTodos(prevTodos => [...prevTodos, newTodo]);
  };

  const editTodo = (
    id: string,
    updates: Partial<Pick<Todo, 'title' | 'description' | 'completed' | 'dueDate'>>
  ) => {
    setTodos(todos => todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos =>
      todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos => todos.filter(todo => todo.id !== id));
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}>
      {children}
    </TodoContext.Provider>
  );
};
