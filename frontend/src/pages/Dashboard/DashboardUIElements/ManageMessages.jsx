import { useMemo, useState } from "react";
import {
  ChatBubbleLeftIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  useGetMessagesQuery,
  useDeleteMessageMutation,
} from "../../../redux/api/messagesApi/messagesApi";
import PageHeader from "./PageHeader";
import ReplyMessageModal from "./ReplyMessageModal";
import { formatDate } from "./stats";

const STATUS_STYLES = {
  unread: ["Unread", "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"],
  read: ["Replied", "bg-green-100 text-green-700"],
};

export const ManageMessages = () => {
  const { data: messages = [], isLoading, isError } = useGetMessagesQuery();
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation();

  const [replying, setReplying] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return messages.filter((item) => {
      const matchesFilter =
        filter === "all" || (filter === "unread" ? item.status === "unread" : item.status === "read");
      const matchesQuery =
        !term ||
        [item.name, item.email, item.message].some((field) =>
          field?.toLowerCase().includes(term)
        );
      return matchesFilter && matchesQuery;
    });
  }, [messages, query, filter]);

  const unreadCount = messages.filter((item) => item.status === "unread").length;

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete the message from "${item.name}"?`);
    if (!confirmed) return;

    setNotice("");
    try {
      await deleteMessage(item._id).unwrap();
      setNotice("Message deleted.");
    } catch (error) {
      console.error("Failed to delete message:", error);
      window.alert(error?.data?.error || "Failed to delete message.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        description="Messages from the contact page. Reply and customers see your answer as Admin on the contact page feedback section."
        actions={
          <span
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              unreadCount > 0
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "bg-black/5 text-neutral-500"
            }`}
          >
            {unreadCount} unread
          </span>
        }
      />

      {notice && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700"
        >
          {notice}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, message…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
        >
          <option value="all">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Replied</option>
        </select>
        <span className="text-xs text-neutral-500">
          {visible.length} of {messages.length} messages
        </span>
      </div>

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading messages…
        </p>
      )}

      {isError && (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-5 py-10 text-center text-sm text-[var(--color-primary-hover)]">
          <ExclamationCircleIcon className="h-4 w-4" />
          Failed to load messages. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[var(--color-text)]">No messages here</p>
          <p className="mt-2 text-sm text-neutral-500">
            Messages sent from the contact page will appear here.
          </p>
        </div>
      )}

      {!isLoading && !isError && visible.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((item) => {
            const [statusLabel, statusClass] = STATUS_STYLES[item.status] || STATUS_STYLES.unread;
            const replies = Array.isArray(item.replies) ? item.replies : [];

            return (
              <article
                key={item._id}
                className="flex flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-text)] text-sm font-bold text-white">
                      {(item.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{item.name}</p>
                      <p className="text-xs text-neutral-500">{item.email}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{item.message}</p>
                <p className="mt-2 text-xs text-neutral-400">{formatDate(item.createdAt)}</p>

                {replies.length > 0 && (
                  <ul className="mt-4 space-y-2.5 border-l-2 border-[var(--color-primary)]/30 pl-4">
                    {replies.map((reply, index) => (
                      <li key={`${reply.createdAt || index}`}>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[var(--color-text)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            Admin
                          </span>
                          <span className="text-xs text-neutral-400">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600">{reply.text}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                  <button
                    type="button"
                    onClick={() => setReplying(item)}
                    className="flex items-center gap-1.5 rounded-full bg-[var(--color-text)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)]"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    {replies.length > 0 ? "Reply again" : "Reply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {replying && (
        <ReplyMessageModal
          message={replying}
          onClose={() => setReplying(null)}
          onSaved={() => {
            setReplying(null);
            setNotice("Reply sent — it is now visible on the contact page feedback section.");
          }}
        />
      )}
    </div>
  );
};
