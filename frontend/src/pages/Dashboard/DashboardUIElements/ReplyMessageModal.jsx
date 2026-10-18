import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useReplyToMessageMutation } from "../../../redux/api/messagesApi/messagesApi";
import { formatDate } from "./stats";

const ReplyMessageModal = ({ message, onClose, onSaved }) => {
  const [replyToMessage, { isLoading }] = useReplyToMessageMutation();
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!reply.trim()) {
      setError("Write a reply before sending.");
      return;
    }

    try {
      await replyToMessage({ id: message._id, reply: reply.trim() }).unwrap();
      onSaved?.(reply.trim());
    } catch (err) {
      console.error("Failed to reply:", err);
      setError(err?.data?.error || "Failed to send your reply.");
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-lg rounded-3xl border border-black/5 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Reply as admin
            </p>
            <h2 className="mt-1 truncate font-serif text-lg font-bold text-[var(--color-text)]">
              {message.name}
            </h2>
            <p className="truncate text-xs text-neutral-500">{message.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-neutral-500 transition hover:bg-black/5"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl bg-[#f3efe7] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Customer message · {formatDate(message.createdAt)}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
              {message.message}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="admin-reply" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Your reply (shown as <span className="font-bold">Admin</span>)
              </label>
              <textarea
                id="admin-reply"
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Thank you for reaching out…"
                className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm leading-7 text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-primary-hover)]">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Sending…" : "Send Reply"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyMessageModal;
