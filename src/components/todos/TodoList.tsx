import { LayoutGroup, Reorder } from "motion/react";
import { useMemo } from "react";
import { TodoItem } from "@/components/todos/TodoItem";
import type { Todo } from "@/db/schema";
import { useDeleteTodo, useReorderTodos, useToggleTodo } from "@/hooks/use-todos";

interface TodoListProps {
  todos: Todo[];
  reorderMode: boolean;
}

export function TodoList({ todos, reorderMode }: TodoListProps) {
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodos = useReorderTodos();

  const activeTodos = useMemo(() => todos.filter((t) => !t.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter((t) => t.completed), [todos]);

  const handleReorder = (newOrder: Todo[]) => {
    if (reorderMode) {
      reorderTodos.mutate(newOrder.map((t) => t.id));
    }
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No tasks yet. Add one above!</p>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="space-y-4">
        {/* Active todos */}
        {activeTodos.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider px-2">Pending ({activeTodos.length})</p>
            <Reorder.Group axis="y" values={activeTodos} onReorder={handleReorder} as="div" className="space-y-2">
              {activeTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  reorderMode={reorderMode}
                  onToggle={() => toggleTodo.mutate({ id: todo.id })}
                  onDelete={() => deleteTodo.mutate({ id: todo.id })}
                />
              ))}
            </Reorder.Group>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">All done — you crushed it!</p>
        )}

        {/* Completed todos */}
        {completedTodos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider px-2">Completed ({completedTodos.length})</p>
            <Reorder.Group axis="y" values={completedTodos} onReorder={() => {}} as="div" className="space-y-2">
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  reorderMode={false}
                  onToggle={() => toggleTodo.mutate({ id: todo.id })}
                  onDelete={() => deleteTodo.mutate({ id: todo.id })}
                />
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
