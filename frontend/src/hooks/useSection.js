import { useGetContentQuery } from "../redux/api/contentApi/contentApi";
import { getPageSchema } from "../content/pageContentSchema";
import { toImageUrl } from "../utils/apiConfig";

// Split a title into plain/accent parts so pages can render the highlighted
// word(s) the same way the original hardcoded markup did.
// Returns an array of { text, accent } chunks.
export const splitAccent = (title = "", accent = "") => {
  if (!accent || !title.toLowerCase().includes(accent.toLowerCase())) {
    return [{ text: title, accent: false }];
  }
  const parts = [];
  let rest = title;
  const lowerTitle = title.toLowerCase();
  const lowerAccent = accent.toLowerCase();
  let index = lowerTitle.indexOf(lowerAccent);
  while (index !== -1) {
    if (index > 0) parts.push({ text: rest.slice(0, index), accent: false });
    parts.push({ text: rest.slice(index, index + accent.length), accent: true });
    rest = rest.slice(index + accent.length);
    index = rest.toLowerCase().indexOf(lowerAccent);
  }
  if (rest) parts.push({ text: rest, accent: false });
  return parts;
};

// Resolve a stored field value for a page section.
// - image fields: "" -> built-in default asset; "content/<id>" -> API URL
// - everything else: saved override -> built-in default
export const useSection = (page, sectionId) => {
  const { data } = useGetContentQuery();
  const schema = getPageSchema(page);
  const section = schema?.sections.find((item) => item.id === sectionId);
  const saved = data?.[page]?.[sectionId] || {};

  const fields = {};
  for (const field of section?.fields || []) {
    const savedValue = saved[field.key];
    if (field.type === "image") {
      fields[field.key] = savedValue ? toImageUrl(savedValue) : field.default;
    } else {
      fields[field.key] =
        typeof savedValue === "string" && savedValue.trim() !== ""
          ? savedValue
          : field.default;
    }
  }
  return fields;
};