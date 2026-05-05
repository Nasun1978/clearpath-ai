const { app, BrowserWindow, shell, Menu, nativeTheme } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

// ── Config ────────────────────────────────────────────────────────────────────

const isDev = !app.isPackaged;
const PORT = 3000;
const APP_URL = `http://localhost:${PORT}`;

let mainWindow = null;
let nextServer = null;

// ── Next.js server management ─────────────────────────────────────────────────

function waitForServer(url, retries = 40, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", retry);
    };
    const retry = () => {
      if (++attempts >= retries) return reject(new Error("Next.js server did not start"));
      setTimeout(check, interval);
    };
    check();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In dev mode, expect `npm run dev` to already be running (launched by
      // the `electron:dev` script via concurrently). Just wait for it.
      waitForServer(APP_URL).then(resolve).catch(reject);
      return;
    }

    // Production: run the Next.js standalone server bundled inside the app.
    const serverPath = path.join(
      process.resourcesPath,
      ".next",
      "standalone",
      "server.js"
    );

    nextServer = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
      stdio: "pipe",
    });

    nextServer.stdout.on("data", (d) => {
      if (process.env.DEBUG_ELECTRON) process.stdout.write(d);
    });
    nextServer.stderr.on("data", (d) => {
      if (process.env.DEBUG_ELECTRON) process.stderr.write(d);
    });
    nextServer.on("error", reject);

    waitForServer(APP_URL).then(resolve).catch(reject);
  });
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  nativeTheme.themeSource = "dark";

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#080E1A",
    // macOS: show native traffic lights, extend content under titlebar
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: "under-window",
    visualEffectState: "active",
    // Windows / Linux: frameless with a small title bar
    ...(process.platform !== "darwin" ? { frame: true, titleBarStyle: "default" } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      // Allow localhost content regardless of CSP in dev
      allowRunningInsecureContent: isDev,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false, // show after ready-to-show to avoid white flash
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── Application menu ──────────────────────────────────────────────────────────

function buildMenu() {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(isDev
          ? [
              { type: "separator" },
              { role: "toggleDevTools" },
            ]
          : []),
      ],
    },
    {
      label: "Navigate",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+1",
          click: () => mainWindow?.loadURL(`${APP_URL}/dashboard`),
        },
        {
          label: "Projects",
          accelerator: "CmdOrCtrl+2",
          click: () => mainWindow?.loadURL(`${APP_URL}/dashboard/projects`),
        },
        {
          label: "Deals",
          accelerator: "CmdOrCtrl+3",
          click: () => mainWindow?.loadURL(`${APP_URL}/dashboard/deals`),
        },
        {
          label: "Documents",
          accelerator: "CmdOrCtrl+4",
          click: () => mainWindow?.loadURL(`${APP_URL}/dashboard/documents`),
        },
        {
          label: "LIHTC Closing",
          accelerator: "CmdOrCtrl+5",
          click: () => mainWindow?.loadURL(`${APP_URL}/dashboard/lihtc-closing`),
        },
        { type: "separator" },
        {
          label: "Search",
          accelerator: "CmdOrCtrl+K",
          click: () =>
            mainWindow?.webContents.executeJavaScript(
              "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))"
            ),
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [{ type: "separator" }, { role: "front" }]
          : [{ role: "close" }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  buildMenu();

  try {
    await startNextServer();
    createWindow();
  } catch (err) {
    console.error("Failed to start Next.js server:", err);
    app.quit();
  }

  app.on("activate", () => {
    // macOS: re-open window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  nextServer?.kill();
});

app.on("will-quit", () => {
  nextServer?.kill();
});
