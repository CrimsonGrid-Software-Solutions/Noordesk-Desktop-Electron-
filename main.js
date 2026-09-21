const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, net, session } = require('electron');
const path = require('path');

let win;
let tray;
let isActuallyFullscreen = false;
let prayerCheckInterval;
let store; // Will be initialized asynchronously

let notificationWindow;
let quranWindow;


function createNotificationWindow() {
  notificationWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  notificationWindow.loadFile(path.join(__dirname, 'notification.html'));
}

function createQuranWindow() {
  quranWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "Quran - NoorDesk",
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    show: false
  });


  quranWindow.loadURL('https://quran.com');

  quranWindow.on('close', (e) => {
    e.preventDefault();
    quranWindow.hide();
  });
}


// --- PRAYER TIME LOGIC ---

function checkForUpcomingPrayers(timings) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Filter for only the 5 daily prayers
  const prayersToCheck = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  for (const [name, time] of Object.entries(timings)) {
    if (prayersToCheck.includes(name) && time === currentTime) {
      console.log(`It's time for ${name}!`);
      if (notificationWindow) {
        notificationWindow.show();
        notificationWindow.webContents.send('play-adhan', name);
      }
      break;
    }
  }
}

function fetchPrayerDataForBackground() {
  if (!store) {
    console.log('Store not ready, skipping background fetch.');
    return;
  }
  const settings = store.get('userSettings', {});
  const { manualCity, userCoords, prayerMethod, prayerSchool } = settings;
  let url;

  if (manualCity) {
    url = `https://api.aladhan.com/v1/timingsByCity?city=${manualCity}&country=&method=${prayerMethod || 2}&school=${prayerSchool || 0}`;
  } else if (userCoords) {
    url = `https://api.aladhan.com/v1/timings?latitude=${userCoords.latitude}&longitude=${userCoords.longitude}&method=${prayerMethod || 2}&school=${prayerSchool || 0}`;
  } else {
    console.log('No location set for background check, skipping.');
    return;
  }

  const request = net.request(url);
  request.on('response', (response) => {
    let body = '';
    response.on('data', (chunk) => { body += chunk; });
    response.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.code === 200) {
          console.log('Background check: Successfully fetched prayer times.');
          checkForUpcomingPrayers(data.data.timings);
        }
      } catch (e) {
        console.error('Background check: Failed to parse prayer times.', e);
      }
    });
  });
  request.on('error', (error) => {
    console.error('Background check: Network error.', error);
  });
  request.end();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.once('ready-to-show', () => {
    win.show();
    win.setFullScreen(true);
    isActuallyFullscreen = true;
  });
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show NoorDesk', click: () => win.show() },
      {
        label: 'Quit', click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('NoorDesk');
    tray.setContextMenu(contextMenu);
  } catch (error) {
    console.error("Failed to create tray icon. Make sure 'icon.png' exists.", error);
  }
}

// --- APP LIFECYCLE ---
app.whenReady().then(async () => {
  // --- DYNAMIC IMPORT FIX ---
  const { default: Store } = await import('electron-store');
  store = new Store();

  // Auto-startup logic
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  });

  createTray();
  createWindow();
  createNotificationWindow();
  createQuranWindow();


  // --- INTERCEPT QURAN.COM SESSION REMOVED (Dedicated window handles this better) ---


  // Start checking for prayer times every minute
  fetchPrayerDataForBackground(); // Initial check
  prayerCheckInterval = setInterval(fetchPrayerDataForBackground, 60000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else win.show();
  });
});

ipcMain.on('settings-updated', (event, settings) => {
  if (store) {
    console.log('Main process received updated settings.');
    store.set('userSettings', settings);
    fetchPrayerDataForBackground();
  }
});

// Navigation
ipcMain.on('minimize-app', () => {
  if (win) win.minimize();
});

ipcMain.on('toggle-fullscreen', () => {
  if (win) {
    win.setFullScreen(!win.isFullScreen());
    isActuallyFullscreen = win.isFullScreen();
  }
});

ipcMain.on('close-app', () => {
  app.quit();
});
ipcMain.on('navigate-to-prayer', () => win?.loadFile(path.join(__dirname, 'prayer.html')));
ipcMain.on('navigate-to-dashboard', () => win?.loadFile(path.join(__dirname, 'index.html')));

ipcMain.on('test-adhan', () => {
  console.log('Testing Adhan with Custom Popup...');
  if (notificationWindow) {
    notificationWindow.show();
    notificationWindow.webContents.send('play-adhan', 'Test Prayer');
  }
});

ipcMain.on('dismiss-notification', () => {
  if (notificationWindow) {
    notificationWindow.hide();
  }
});

ipcMain.on('open-quran', () => {
  if (!quranWindow) {
    createQuranWindow();
  }
  quranWindow.show();
});


ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});