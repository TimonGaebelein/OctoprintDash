/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

const args = process.argv.slice(1);
const big = args.some(val => val === '--big');
const dev = args.some(val => val === '--serve');

const activateListeners = require('./helper/listener');

app.commandLine.appendSwitch('touch-events', 'enabled');
app.allowRendererProcessReuse = true;

let window;

function createWindow() {
  const { screen, session } = require('electron');

  if (!dev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          // TODO: re-enable
          // "Content-Security-Policy": ["script-src 'self'"],
        },
      });
    });
  }

  const mainScreen = screen.getPrimaryDisplay();

  window = new BrowserWindow({
    width: dev ? (big ? 1400 : 1080) : mainScreen.size.width,
    height: dev ? (big ? 502 : 342) : mainScreen.size.height,
    frame: dev,
    backgroundColor: '#353b48',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, 'src', 'assets', 'icon', 'icon.png'),
  });

  if (dev) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    window.loadURL('http://localhost:4200');
    window.webContents.openDevTools();
  } else {
    window.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
    window.setFullScreen(true);
  }

  activateListeners(ipcMain, window, app);

  window.on('closed', () => {
    window = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (window === null) {
    createWindow();
  }
});
