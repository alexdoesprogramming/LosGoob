# LosGoob ✦

A midnight-themed browser proxy built with **Scramjet**. LosGoob includes a polished search/home screen, quick-launch cards, a URL bar, browser controls, local recent history, and a couple of personal settings.

> **Heads up:** Scramjet is an experimental proxy engine. Some sites will fail, and sites with strong bot protection, DRM, or complex authentication may not work as expected.

## Windows quick start

1. Install **Node.js 20 or newer** from [nodejs.org](https://nodejs.org/).
2. Download this repository: [Download ZIP](https://github.com/alexdoesprogramming/LosGoob/archive/refs/heads/main.zip).
3. Extract the ZIP to a normal folder.
4. Double-click **`start.bat`**. On first launch it installs the dependencies automatically.
5. Open [http://localhost:8080](http://localhost:8080) if it doesn't open by itself.

Keep the terminal window open while browsing. Press **Ctrl+C** in that window to stop the server.

If you prefer to install dependencies first, run `setup.bat`, then `start.bat`.

## Requirements

- Node.js 20+
- Internet connection for the initial dependency install and proxy traffic
- A modern browser with service-worker support (Chrome, Edge, and Firefox are good starting points)

## Configuration

The server is local-only by default: `127.0.0.1:8080`.

You can change the listening address and port with environment variables:

**PowerShell**
```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "8080"
npm start
```

**Linux/macOS**
```sh
HOST=127.0.0.1 PORT=8080 npm start
```

## Deploying publicly

GitHub stores the source code; it does **not** run this Node.js server, and GitHub Pages cannot host the proxy backend. For a public deployment, use a Node.js host or VPS that supports persistent Node processes and WebSocket upgrades. Configure HTTPS, then set `HOST=0.0.0.0` and the port supplied by your host.

**Do not expose a personal proxy server to the public internet without additional access controls.** Anyone who can use a public proxy can consume your bandwidth and server resources. Put authentication and rate limiting in front of it, keep dependencies updated, and follow your hosting provider's acceptable-use policy. Do not use it to access systems you are not authorized to use.

## Troubleshooting

- **Port in use:** set `PORT` to another available port, then open that port locally.
- **Service worker errors:** use `http://localhost:8080` rather than opening the HTML file directly. Clear site data for localhost if an old service worker is stuck.
- **Dependency install fails:** install the current Node.js LTS, restart the terminal, and run `npm install` again.
- **A website doesn't load:** the engine is experimental and not every site is compatible. Try a different site/browser before assuming the server is broken.

## Credits

- [Scramjet](https://github.com/MercuryWorkshop/scramjet) — proxy engine
- [MercuryWorkshop/Scramjet-App](https://github.com/MercuryWorkshop/Scramjet-App) — reference for the server and transport integration

LosGoob's interface and glue code are released under the MIT License. Scramjet and its dependencies retain their own licenses; see their respective projects for details.
