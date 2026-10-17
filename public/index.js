"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const homeView = document.getElementById("home-view");
const browserView = document.getElementById("browser-view");
const frameContainer = document.getElementById("frame-container");
const toolbarForm = document.getElementById("toolbar-form");
const toolbarAddress = document.getElementById("toolbar-address");
const loadingLine = document.getElementById("loading-line");
const statusLabel = document.getElementById("status-label");
const recentSection = document.getElementById("recent-section");
const recentList = document.getElementById("recent-list");
const settingsDialog = document.getElementById("settings-dialog");
const searchEngineSelect = document.getElementById("search-engine");
const reduceMotion = document.getElementById("reduce-motion");
const HISTORY_KEY = "losgoob-history-v1";
const SETTINGS_KEY = "losgoob-settings-v1";

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});
scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

let activeFrame = null;
let loadingTimer = null;
let navigationSerial = 0;

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function getSettings() {
  return { searchEngine: "https://www.google.com/search?q=%s", reduceMotion: false, ...readStorage(SETTINGS_KEY, {}) };
}
let settings = getSettings();
searchEngineSelect.value = settings.searchEngine;
reduceMotion.checked = Boolean(settings.reduceMotion);
document.documentElement.classList.toggle("reduce-motion", Boolean(settings.reduceMotion));

function setError(message = "", details = "") {
  error.textContent = message;
  errorCode.textContent = details;
}
function setLoading(loading) {
  loadingLine.classList.toggle("active", loading);
  statusLabel.textContent = loading ? "CONNECTING..." : "READY TO BROWSE";
}
function currentHistory() {
  return readStorage(HISTORY_KEY, []);
}
function saveVisit(url) {
  let list = currentHistory().filter(item => item.url !== url);
  list.unshift({ url, title: new URL(url).hostname, time: Date.now() });
  writeStorage(HISTORY_KEY, list.slice(0, 8));
  renderHistory();
}
function renderHistory() {
  const list = currentHistory();
  recentSection.hidden = list.length === 0;
  recentList.replaceChildren();
  for (const item of list) {
    const button = document.createElement("button");
    button.className = "recent-item";
    const icon = document.createElement("span");
    icon.className = "recent-favicon";
    icon.textContent = "↗";
    const meta = document.createElement("span");
    meta.className = "recent-meta";
    const title = document.createElement("span");
    title.className = "recent-title";
    title.textContent = item.title || item.url;
    const url = document.createElement("span");
    url.className = "recent-url";
    url.textContent = item.url;
    meta.append(title, url);
    button.append(icon, meta);
    button.addEventListener("click", () => navigate(item.url));
    recentList.append(button);
  }
}
function resolveInput(input) {
  return search(input, settings.searchEngine);
}
async function ensureProxyReady() {
  await registerSW();
  const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  }
}
async function navigate(rawInput) {
  const input = String(rawInput || "").trim();
  if (!input) { address.focus(); return; }
  setError();
  let url;
  try { url = resolveInput(input); }
  catch (err) { setError("That address doesn't look right.", String(err)); return; }

  const serial = ++navigationSerial;
  setLoading(true);
  try {
    await ensureProxyReady();
    if (serial !== navigationSerial) return;
    homeView.hidden = true;
    browserView.hidden = false;
    if (!activeFrame) {
      activeFrame = scramjet.createFrame();
      activeFrame.frame.id = "sj-frame";
      activeFrame.frame.title = "LosGoob proxied page";
      activeFrame.frame.setAttribute("allow", "fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; picture-in-picture");
      activeFrame.frame.addEventListener("load", () => setLoading(false));
      frameContainer.append(activeFrame.frame);
    }
    toolbarAddress.value = url;
    activeFrame.go(url);
    saveVisit(url);
    history.replaceState({ losgoob: true, url }, "", "/");
    window.setTimeout(() => {
      if (serial === navigationSerial) setLoading(false);
    }, 8000);
  } catch (err) {
    setLoading(false);
    setError("LosGoob couldn't start the proxy engine. Check that the app is running and try again.", err?.stack || String(err));
    console.error(err);
  }
}
function goHome() {
  navigationSerial++;
  setLoading(false);
  browserView.hidden = true;
  homeView.hidden = false;
  statusLabel.textContent = "READY TO BROWSE";
  setError();
  address.value = "";
  address.focus();
}
form.addEventListener("submit", event => {
  event.preventDefault();
  void navigate(address.value);
});
toolbarForm.addEventListener("submit", event => {
  event.preventDefault();
  void navigate(toolbarAddress.value);
});
document.querySelectorAll("[data-url]").forEach(button => {
  button.addEventListener("click", () => void navigate(button.dataset.url));
});
document.getElementById("back-button").addEventListener("click", () => {
  try { activeFrame?.frame.contentWindow.history.back(); } catch {}
});
document.getElementById("forward-button").addEventListener("click", () => {
  try { activeFrame?.frame.contentWindow.history.forward(); } catch {}
});
document.getElementById("reload-button").addEventListener("click", () => {
  try { activeFrame?.frame.contentWindow.location.reload(); } catch { if (toolbarAddress.value) void navigate(toolbarAddress.value); }
  setLoading(true);
  window.setTimeout(() => setLoading(false), 4000);
});
document.getElementById("home-button").addEventListener("click", goHome);
document.getElementById("brand-home").addEventListener("click", event => {
  event.preventDefault();
  goHome();
});
document.getElementById("new-tab-button").addEventListener("click", goHome);
document.getElementById("settings-button").addEventListener("click", () => settingsDialog.showModal());
document.getElementById("open-blank-tab").addEventListener("click", () => {
  const blankTab = window.open("about:blank", "_blank");
  if (!blankTab) {
    setError("The new tab was blocked. Allow pop-ups for LosGoob and try again.");
    settingsDialog.close();
    return;
  }
  const appUrl = new URL("/", window.location.origin).href;
  blankTab.document.open();
  blankTab.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Tab</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;background:#0a0b12}iframe{display:block}</style></head><body><iframe title="LosGoob session" src="${appUrl}"></iframe></body></html>`);
  blankTab.document.close();
  settingsDialog.close();
});
document.getElementById("close-settings").addEventListener("click", () => settingsDialog.close());
settingsDialog.addEventListener("click", event => {
  if (event.target === settingsDialog) settingsDialog.close();
});
function saveSettings() {
  settings = { searchEngine: searchEngineSelect.value, reduceMotion: reduceMotion.checked };
  writeStorage(SETTINGS_KEY, settings);
  document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
}
searchEngineSelect.addEventListener("change", saveSettings);
reduceMotion.addEventListener("change", saveSettings);
document.getElementById("clear-history").addEventListener("click", () => {
  writeStorage(HISTORY_KEY, []);
  renderHistory();
});
window.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault();
    if (!browserView.hidden) toolbarAddress.focus();
    else address.focus();
    (browserView.hidden ? address : toolbarAddress).select();
  }
  if (event.key === "Escape" && !settingsDialog.open) goHome();
});
renderHistory();
