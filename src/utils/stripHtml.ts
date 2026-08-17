export const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  // Replace block tags and breaks with newlines
  let cleanHtml = html.replace(/<br\s*[\/]?>/gi, '\n');
  cleanHtml = cleanHtml.replace(/<\/p>/gi, '\n');
  cleanHtml = cleanHtml.replace(/<\/div>/gi, '\n');
  cleanHtml = cleanHtml.replace(/<\/h[1-6]>/gi, '\n');
  tmp.innerHTML = cleanHtml;
  return (tmp.textContent || tmp.innerText || "").trim();
};
