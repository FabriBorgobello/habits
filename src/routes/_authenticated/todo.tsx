import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpDown, Check } from "lucide-react";
import { useState } from "react";
import { TodoList } from "@/components/todos/TodoList";
import { useCreateTodo, useTodos } from "@/hooks/use-todos";

export const Route = createFileRoute("/_authenticated/todo")({
  component: TodoPage,
  head: () => ({
    meta: [
      { title: "Tasks | Habits" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function TodoPage() {
  const [input, setInput] = useState("");
  const [reorderMode, setReorderMode] = useState(false);

  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;

    createTodo.mutate({ title });
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Fixed header section */}
        <div className="shrink-0 px-3 sm:px-6 pt-4 sm:pt-8 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Tasks</h1>
            <button
              type="button"
              onClick={() => setReorderMode(!reorderMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                reorderMode ? "bg-white text-black" : "bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {reorderMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Done
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Reorder
                </>
              )}
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a task..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm sm:text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </form>
        </div>

        {/* Scrollable todo list */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pb-4 sm:pb-8">
          {isLoading && !todos ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <TodoList todos={todos || []} reorderMode={reorderMode} />
          )}
        </div>
      </div>
    </div>
  );
}
