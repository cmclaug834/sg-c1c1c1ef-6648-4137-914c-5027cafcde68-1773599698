const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { spawn } = require("child_process");

let mainWindow;
let nextServer;
const port = 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, "../public/favicon.ico"),
    show: false,
    backgroundColor: "#ffffff",
  });

  // Create application menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.reload(),
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
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
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => shell.openExternal("https://github.com/yourusername/tracking-sheet"),
        },
        { type: "separator" },
        {
          label: "About",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Tracking Sheet",
              message: "Rail Yard Tracking Sheet",
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}\nChrome: ${process.versions.chrome}`,
              buttons: ["OK"],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Start Next.js server in production
  if (!isDev) {
    startNextServer();
  }

  // Load the app
  const startUrl = isDev
    ? "http://localhost:3000"
    : `http://localhost:${port}`;

  // Wait for server to be ready
  const loadApp = () => {
    mainWindow.loadURL(startUrl).catch((err) => {
      console.error("Failed to load URL:", err);
      setTimeout(loadApp, 1000);
    });
  };

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Wait for server then load
  if (isDev) {
    loadApp();
  } else {
    setTimeout(loadApp, 2000); // Give Next.js time to start
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startNextServer() {
  const nextPath = path.join(__dirname, "../node_modules/.bin/next");
  const appPath = path.join(__dirname, "..");

  nextServer = spawn(nextPath, ["start", "-p", port.toString()], {
    cwd: appPath,
    stdio: "inherit",
    shell: true,
  });

  nextServer.on("error", (err) => {
    console.error("Failed to start Next.js server:", err);
    dialog.showErrorBox(
      "Server Error",
      "Failed to start the application server. Please contact support."
    );
    app.quit();
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
  }
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  dialog.showErrorBox("Application Error", error.message);
});