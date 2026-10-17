"use strict";
const stockSW = "/sw.js";
async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers. Try a current version of Chrome, Edge, or Firefox.");
  }
  if (location.protocol !== "https:" && !["localhost", "127.0.0.1", "::1"].includes(location.hostname)) {
    throw new Error("Service workers require HTTPS when hosted outside localhost.");
  }
  await navigator.serviceWorker.register(stockSW, { scope: "/" });
  await navigator.serviceWorker.ready;
}
