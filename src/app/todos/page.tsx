"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { callEnhance } from "@/lib/enhance";
import { Sparkles } from "lucide-react";
import { TABLE_TODOS, CHANNEL_TODOS, ROUTE_LOGIN, UI_APP_TITLE } from "@/lib/constants";
import type { Todo } from "@/types";

export default function TodosPage() {
  const router = useRouter();

  // Gate by our fake login
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth") !== "1") {
      router.replace(ROUTE_LOGIN);
    }
  }, [router]);

  // Theme (respect saved preference if any)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Enhance modal state
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState<string>("");
  const [aiDescription, setAiDescription] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [promptError, setPromptError] = useState<string>("");
  const [enhanceTargetId, setEnhanceTargetId] = useState<string | number | null>(null);

  // Fetch from Supabase
  const loadTodos = async () => {
    const { data, error } = await supabase
      .from(TABLE_TODOS)
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setTodos(data as Todo[]);
  };

  // Realtime subscription (simple: refetch on any change)
  useEffect(() => {
    loadTodos();

    const channel = supabase
      .channel(CHANNEL_TODOS)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE_TODOS },
        () => loadTodos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // CREATE
  const addTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t) return;
    await supabase.from(TABLE_TODOS).insert([{ title: t, description: d || null }]);
    setTitle("");
    setDescription("");
    // no setTodos here; realtime will update the list
  };

  // COMPLETE/TOGGLE
  const toggleCompleted = async (index: number) => {
    const todo = todos[index];
    await supabase
      .from(TABLE_TODOS)
      .update({ completed: !todo.completed })
      .eq("id", todo.id);
  };

  // DELETE
  const remove = async (index: number) => {
    const todo = todos[index];
    await supabase.from(TABLE_TODOS).delete().eq("id", todo.id);
  };

  const clearCompleted = async () => {
    await supabase.from(TABLE_TODOS).delete().eq("completed", true);
  };

  // EDIT
  const startEdit = (index: number) => {
    const td = todos[index];
    setEditingIndex(index);
    setEditTitle(td.title);
    setEditDescription(td.description || "");
  };

  const confirmEdit = async () => {
    if (editingIndex === null) return;
    const td = todos[editingIndex];
    const t = editTitle.trim();
    if (!t) return;
    await supabase
      .from(TABLE_TODOS)
      .update({ title: t, description: editDescription.trim() || null })
      .eq("id", td.id);

    setEditingIndex(null);
    setEditTitle("");
    setEditDescription("");
  };

  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    }
  };

  // Enhance modal handlers
  function openEnhanceModal(task: { id: string; title: string; description: string | null }) {
    setEnhanceTargetId(task.id);
    setAiTitle(task.title ?? "");
    setAiDescription(task.description ?? "");
    setAiPrompt("");
    setPromptError("");
    setAiLoading(false);
    setShowEnhanceModal(true);
  }

  async function onEnhanceNow() {
    if (!enhanceTargetId) return;
    const p = aiPrompt.trim();
    if (!p) {
      setPromptError("Please enter a prompt before enhancing.");
      return;
    }
    setPromptError("");
    setAiLoading(true);
    try {
      const { title, description } = await callEnhance({
        id: enhanceTargetId,
        title: aiTitle,
        description: aiDescription || undefined,
        prompt: p,
      });
      setAiTitle(title ?? aiTitle);
      setAiDescription((description ?? aiDescription) ?? "");
    } catch (e) {
      console.error("Enhance failed:", e);
      setPromptError("Sorry, something went wrong while enhancing. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function onApplyEnhanced() {
    if (!enhanceTargetId) return;
    const { error } = await supabase
      .from("todos")
      .update({
        title: aiTitle.trim(),
        description: (aiDescription ?? "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", enhanceTargetId);
    if (error) {
      console.error(error);
      return;
    }
    setShowEnhanceModal(false);
  }

  function onCancelEnhanced() {
    setShowEnhanceModal(false);
  }

  return (
    <div className="min-h-screen transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-6xl font-extrabold text-center">
            {UI_APP_TITLE}
            <span role="img" aria-label="pencil" className="ml-2 align-middle">✏️</span>
          </h1>
        </header>

        {/* Add Todo */}
        <form onSubmit={addTodo} className="mb-6">
          {/* Title row with aligned Add */}
          <div className="flex gap-3 items-end mb-3">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-300/80 dark:text-gray-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a Task"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                required
              />
            </div>
            <button
              type="submit"
              className="h-[44px] px-6 rounded-xl bg-white text-black font-semibold border border-slate-200 shadow-md hover:shadow-xl transition-transform duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Add task"
            >
              Add
            </button>
          </div>

          {/* Description row */}
          <div>
            <label className="block text-sm mb-1 text-gray-300/80 dark:text-gray-300">
              Description <span className="opacity-70">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your Task"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
            />
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No tasks yet. Add one above!
            </div>
          ) : (
            todos.map((todo, index) => {
              const isEditing = editingIndex === index;
              return (
                <div key={todo.id} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <input
                    type="checkbox"
                    id={`todo-${index}`}
                    checked={todo.completed}
                    onChange={() => toggleCompleted(index)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark"
                  />

                  <div className="flex-1">
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={onEditKey}
                          className="w-full mb-2 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                        />
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={onEditKey}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
                          placeholder="Description (optional)"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className={`font-semibold ${todo.completed ? "line-through opacity-70" : ""}`}>
                          {todo.title}
                        </h3>
                        {todo.description ? (
                          <p className={`text-sm text-gray-600 dark:text-gray-300 ${todo.completed ? "line-through opacity-70" : ""}`}>
                            {todo.description}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEnhanceModal(todo)}
                      className="p-2 rounded-md text-purple-600 hover:text-purple-500 transition"
                      aria-label="Enhance with AI"
                      title="Enhance"
                    >
                      <Sparkles className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => (isEditing ? confirmEdit() : startEdit(index))}
                      className={`p-2 rounded-md transition ${
                        isEditing ? "text-green-600 hover:text-green-500" : "text-blue-600 hover:text-blue-500"
                      }`}
                      aria-label={isEditing ? "Confirm edit" : "Edit task"}
                      title={isEditing ? "Confirm" : "Edit"}
                    >
                      {isEditing ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.793-6.793a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L6.5 10.672V14h3.328l8.086-8.086a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M4 16a1 1 0 011-1h11a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-md transition"
                      aria-label="Delete task"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-300 flex justify-between">
          <span>{todos.length} {todos.length === 1 ? "item" : "items"}</span>
          <button
            onClick={clearCompleted}
            className="px-3 py-1.5 rounded-md border-2 border-slate-200 bg-white text-black font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Clear completed
          </button>
        </div>

        {/* Enhance Modal */}
        {showEnhanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancelEnhanced}>
            <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">Enhance with AI</h3>
                <button aria-label="Close" onClick={onCancelEnhanced} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <label className="text-sm font-medium mb-1 block">Title</label>
              <input
                className="w-full mb-3 rounded-lg border px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                value={aiTitle}
                onChange={(e) => setAiTitle(e.target.value)}
              />

              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                className="w-full mb-3 rounded-lg border px-3 py-2 min-h-[90px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />

              <label className="text-sm font-medium mb-1 block">Prompt your changes</label>
              <textarea
                className="w-full mb-4 rounded-lg border px-3 py-2 min-h-[110px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                placeholder="e.g., Make the title clearer, break into steps, add acceptance criteria…"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              {promptError ? (
                <p className="text-sm text-red-600 dark:text-red-400 -mt-3 mb-3">{promptError}</p>
              ) : null}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onEnhanceNow}
                  disabled={aiLoading || aiPrompt.trim().length === 0}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white shadow transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {aiLoading ? "Enhancing…" : "Enhance"}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onApplyEnhanced}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border-2 border-white bg-white/15 text-white shadow hover:bg-white/25 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEnhanced}
                    className="px-4 py-2 rounded-lg border-2 border-red-600 bg-red-600/15 text-red-600 shadow hover:bg-red-600/25"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
