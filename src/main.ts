import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let tray: Tray | null = null;
// 解决打包后路径问题
const __filename = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename);

// 获取正确的图标路径
function getIconPath() {
  // 对于开发环境和生产环境使用不同的路径解析方式
  const isDev = !app.isPackaged;
  const basePath = isDev
    ? path.join(process.cwd(), "public", "icons")
    : path.join(__dirname2, "public", "icons");

  const iconExt =
    process.platform === "win32"
      ? "icon.ico"
      : process.platform === "darwin"
        ? "icon.icns"
        : "icon.png";

  return path.join(basePath, iconExt);
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // 只在开发环境打开开发者工具，生产环境自动关闭
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath());
  tray = new Tray(icon.resize({ width: 16, height: 16 })); // Windows 托盘推荐 16x16

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          if (win.isMinimized()) win.restore();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "退出应用",
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip("指指点点 - 让统计更简单");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isVisible()) win.focus();
      else win.show();
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  createTray();
});

// 打开文件对话框
ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    // 支持单选和多选文件
    properties: ["openFile", "multiSelections"],
    // 限制只能选择Excel文件
    filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
  });
  // 如果用户取消选择文件，返回空数组
  if (canceled) return [];
  // 返回用户选择的文件路径数组
  return filePaths;
});

// 读取Excel文件内容
ipcMain.handle("dialog:readExcel", async (event, filePath) => {});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
