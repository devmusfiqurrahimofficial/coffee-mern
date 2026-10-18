import { useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import {
  useGetContentQuery,
  useUpdateContentPageMutation,
  useUploadContentImageMutation,
} from "../../../redux/api/contentApi/contentApi";
import {
  CONTENT_PAGE_LIST,
  getPageSchema,
} from "../../../content/pageContentSchema";
import { toImageUrl } from "../../../utils/apiConfig";
import PageHeader from "./PageHeader";

const inputClass =
  "w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// One image "import" field: file picker + preview + reset to default.
// Images are never entered as URLs — the file is uploaded and stored by the
// API, which returns a "content/<id>" reference.
const ImageField = ({ field, savedRef, isUploading, onChange, onReset }) => {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  const currentSrc = localPreview || (savedRef ? toImageUrl(savedRef) : field.default);
  const usingDefault = !savedRef && !localPreview;

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    setLocalError("");
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLocalError("Must be a JPEG, PNG, WebP, or GIF file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setLocalError("Must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setLocalPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleReset = () => {
    setLocalPreview("");
    setLocalError("");
    if (inputRef.current) inputRef.current.value = "";
    onReset();
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-600">
        {field.label}
      </label>
      <div className="flex items-center gap-4">
        <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-dashed border-black/15 bg-[#f3efe7]">
          {currentSrc && (
            <img
              src={currentSrc}
              alt={field.label}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFile}
            disabled={isUploading}
            className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-text)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white hover:file:bg-[var(--color-primary)]"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">
              {usingDefault
                ? "Using the built-in image"
                : localPreview
                  ? "New image selected (saved with the page)"
                  : "Custom image in use"}
            </span>
            {!usingDefault && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
              >
                <XCircleIcon className="h-4 w-4" />
                Use default
              </button>
            )}
          </div>
          {localError && (
            <p className="text-xs font-medium text-[var(--color-primary-hover)]">{localError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ManageContent = () => {
  const { data: content, isLoading } = useGetContentQuery();
  const [updateContentPage, { isLoading: isSaving }] = useUpdateContentPageMutation();
  const [uploadContentImage, { isLoading: isUploading }] = useUploadContentImageMutation();

  const [activePage, setActivePage] = useState("home");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Text field values keyed "sectionId.fieldKey"
  const [values, setValues] = useState({});
  // Pending image files keyed "sectionId.fieldKey"
  const [imageFiles, setImageFiles] = useState({});
  // Saved image refs keyed "sectionId.fieldKey" ("" = built-in default)
  const [imageRefs, setImageRefs] = useState({});
  const [loadedKey, setLoadedKey] = useState("");

  const schema = getPageSchema(activePage);

  // (Re)populate the form whenever the tab or server data changes.
  const loadKey = `${activePage}:${JSON.stringify(content?.[activePage] || null)}`;
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    const nextValues = {};
    const nextRefs = {};
    const saved = content?.[activePage] || {};
    for (const section of schema?.sections || []) {
      for (const field of section.fields) {
        const key = `${section.id}.${field.key}`;
        const savedValue = saved[section.id]?.[field.key];
        if (field.type === "image") {
          nextRefs[key] = typeof savedValue === "string" ? savedValue : "";
        } else {
          nextValues[key] =
            typeof savedValue === "string" && savedValue !== ""
              ? savedValue
              : field.default;
        }
      }
    }
    setValues(nextValues);
    setImageRefs(nextRefs);
    setImageFiles({});
    setMessage({ type: "", text: "" });
  }

  const updateValue = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const sectionsPayload = useMemo(() => {
    const sections = {};
    for (const section of schema?.sections || []) {
      sections[section.id] = {};
      for (const field of section.fields) {
        const key = `${section.id}.${field.key}`;
        if (field.type === "image") {
          sections[section.id][field.key] = imageRefs[key] || "";
        } else {
          sections[section.id][field.key] = values[key] ?? field.default;
        }
      }
    }
    return sections;
  }, [schema, values, imageRefs]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      // Import any newly chosen image files first; the API returns
      // "content/<id>" references that we then save with the page.
      const nextRefs = { ...imageRefs };
      for (const [key, file] of Object.entries(imageFiles)) {
        if (!file) continue;
        const { image } = await uploadContentImage({ file }).unwrap();
        nextRefs[key] = image;
      }

      const sections = {};
      for (const [sectionId, fields] of Object.entries(sectionsPayload)) {
        sections[sectionId] = { ...fields };
        for (const [fieldKey, ref] of Object.entries(nextRefs)) {
          const [refSection, refField] = fieldKey.split(".");
          if (refSection === sectionId) sections[sectionId][refField] = ref;
        }
      }

      await updateContentPage({ page: activePage, sections }).unwrap();
      setImageRefs(nextRefs);
      setImageFiles({});
      setMessage({ type: "success", text: "Page content saved." });
    } catch (error) {
      console.error("Failed to save page content:", error);
      setMessage({
        type: "error",
        text: error?.data?.error || "Failed to save page content.",
      });
    }
  };

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
        Loading page content…
      </p>
    );
  }

  const isBusy = isSaving || isUploading;

  return (
    <div>
      <PageHeader
        title="Page Content"
        description="Edit the text, information, and images shown on every public page. Images are imported from your computer — no URLs needed."
      />

      {/* Page tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CONTENT_PAGE_LIST.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setActivePage(page.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              activePage === page.id
                ? "bg-[var(--color-primary)] text-white"
                : "border border-black/10 bg-white text-[var(--color-text)] hover:border-[var(--color-primary)]"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {(schema?.sections || []).map((section) => (
          <section
            key={section.id}
            className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
          >
            <h2 className="font-serif text-lg font-bold text-[var(--color-text)]">
              {section.label}
            </h2>
            {section.fields.map((field) => {
              const key = `${section.id}.${field.key}`;
              if (field.type === "image") {
                return (
                  <ImageField
                    key={key}
                    field={field}
                    savedRef={imageRefs[key]}
                    isUploading={isUploading}
                    onChange={(file) =>
                      setImageFiles((current) => ({ ...current, [key]: file }))
                    }
                    onReset={() => {
                      setImageFiles((current) => {
                        const next = { ...current };
                        delete next[key];
                        return next;
                      });
                      setImageRefs((current) => ({ ...current, [key]: "" }));
                    }}
                  />
                );
              }
              if (field.type === "text") {
                return (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-600">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      maxLength={3000}
                      value={values[key] ?? ""}
                      onChange={updateValue(key)}
                      disabled={isBusy}
                      className={inputClass}
                    />
                  </div>
                );
              }
              // textarea + lines both edit as multi-line text.
              return (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-600">
                    {field.label}
                  </label>
                  <textarea
                    rows={field.type === "lines" ? 4 : 3}
                    maxLength={3000}
                    value={values[key] ?? ""}
                    onChange={updateValue(key)}
                    disabled={isBusy}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              );
            })}
          </section>
        ))}

        {message.text && (
          <p
            role="status"
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationCircleIcon className="h-4 w-4" />
            )}
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PhotoIcon className="h-5 w-5" />
            {isUploading
              ? "Uploading images…"
              : isSaving
                ? "Saving…"
                : `Save ${schema?.label || "Page"}`}
          </button>
        </div>
      </form>
    </div>
  );
};