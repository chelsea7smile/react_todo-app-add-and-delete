import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserWarning } from './UserWarning';
import * as postService from './api/todos';
import { Todo, Filters } from './types/Todo';
import { filterTodos } from './utils/service';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorNotificationMessage from './components/ErrorNotificationMessage';
import TodoItem from './components/TodoItem';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import React from 'react';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filters>(Filters.All);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [deletingTodos, setDeletingTodos] = useState<number[]>([]);

  const filtered = useMemo(
    () => filterTodos(todos, activeFilter),
    [todos, activeFilter],
  );

  const addTodo = (title: string) => {
    const newTempTodo = {
      id: Date.now(),
      userId: postService.USER_ID,
      title,
      completed: false,
    };

    setTempTodo(newTempTodo);
    setIsLoading(true);

    return postService
      .createTodo(title)
      .then(newTodo => {
        setDeletingTodos(current => [...current, newTempTodo.id]);
        setTodos(current => [...current, newTodo]);
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setTempTodo(null);
        setIsLoading(false);
      });
  };

  const loadTodos = useCallback(() => {
    postService
      .getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'))
  }, []);

  const deleteTodo = useCallback((id: number) => {
    setIsLoading(true);
    setDeletingTodos(current => [...current, id]);
    postService
      .deleteTodo(id)
      .then(() => {
        setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setDeletingTodos([]);
      })
      .finally(() => setIsLoading(false));
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
      setTimeout(() => setErrorMessage(''), 3000);
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
                  key={todo.id}
                  todo={todo}
                  onDelete={deleteTodo}
                  deletingTodos={deletingTodos}
                />
              </CSSTransition>
            ))}
            {tempTodo && (
              <CSSTransition key={tempTodo.id} timeout={300} classNames="item">
                <TodoItem
                  key={tempTodo.id}
                  todo={tempTodo}
                  onDelete={deleteTodo}
                  deletingTodos={deletingTodos}
                />
              </CSSTransition>
            )}
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
