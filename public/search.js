"use strict";

function search(input, template) {
  const value = String(input || "").trim();
  if (!value) throw new Error("Enter a URL or search query.");
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    throw new Error("Only HTTP and HTTPS addresses are supported.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Only HTTP")) throw error;
  }
  try {
    const url = new URL("https://" + value);
    if (url.hostname.includes(".") && !value.includes(" ")) return url.toString();
  } catch {}
  return template.replace("%s", encodeURIComponent(value));
}
