import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserWarning } from './UserWarning';
import * as postService from './api/todos';
import { Todo, Filters } from './types/Todo';
import { filterTodos } from './utils/service';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorNotificationMessage from './components/ErrorNotificationMessage';
import TodoItem from './components/TodoItem';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filters>(Filters.All);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [deletingTodos, setDeletingTodos] = useState<number[]>([]);
  const [formTitle, setFormTitle] = useState<string>('');

  const filtered = useMemo(() => filterTodos(todos, activeFilter), [todos, activeFilter]);

  const addTodo = async () => {
    if (formTitle.trim() === '') {
      setErrorMessage('Title should not be empty');
      return;
    }

    setIsLoading(true);
    try {
      const newTodo = await postService.createTodo(formTitle.trim());
      setTodos(current => [...current, newTodo]);
      setFormTitle('');
    } catch {
      setErrorMessage('Unable to add a todo');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const todosData = await postService.getTodos();
      setTodos(todosData);
    } catch {
      setErrorMessage('Unable to load todos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTodo = useCallback(async (id: number) => {
    setIsLoading(true);
    setDeletingTodos(current => [...current, id]);
    try {
      await postService.deleteTodo(id);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
    } catch {
      setErrorMessage('Unable to delete a todo');
      setDeletingTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearCompleted = () => {
    const completedTodos = todos.filter(todo => todo.completed);

    completedTodos.forEach(todo => {
      setDeletingTodos(current => [...current, todo.id]);
      deleteTodo(todo.id);
    });
  };

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timeoutId = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [errorMessage]);

  if (!postService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          todos={todos}
          onCreateTodo={addTodo}
          isLoading={isLoading}
          setErrorMessage={setErrorMessage}
        />

        <section className="todoapp__main" data-cy="TodoList">
          <TransitionGroup>
            {filtered.map(todo => (
              <CSSTransition key={todo.id} timeout={300} classNames="item">
                <TodoItem
                  todo={todo}
                  onDelete={deleteTodo}
                  deletingTodos={deletingTodos}
                />
              </CSSTransition>
            ))}
          </TransitionGroup>
        </section>

        {todos.length > 0 && (
          <Footer
            todos={todos}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            handleClearCompleted={handleClearCompleted}
          />
        )}
      </div>
      <ErrorNotificationMessage
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};