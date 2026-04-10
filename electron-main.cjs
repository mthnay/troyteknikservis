const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Troy Teknik Servis",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'public/favicon.ico')
    });

    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5001';

    // Retry mechanism for loading the URL
    const loadWithRetry = (url, retryCount = 0) => {
        mainWindow.loadURL(url).catch(err => {
            if (retryCount < 15) { // Increased retries for slower production starts
                console.log(`Connection failed, retrying in 1s... (${retryCount + 1})`);
                setTimeout(() => loadWithRetry(url, retryCount + 1), 1000);
            } else {
                console.error("Failed to load app after 15 tries:", err);
                dialog.showErrorBox('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen uygulamayı yeniden başlatın.\n\nHata: ' + err.message);
            }
        });
    };

    loadWithRetry(startUrl);

    // Opening DevTools for Debugging (Optional: Can be removed later)
    // if (!app.isPackaged) { mainWindow.webContents.openDevTools(); }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Start the backend server
function startBackend() {
    const fs = require('fs');
    const logFile = path.join(app.getPath('userData'), 'server-logs.txt');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const appPath = app.getAppPath();
    const serverPath = path.join(appPath, 'server/index.js');
    const userDataPath = app.getPath('userData');

    logStream.write(`\n--- Server Start Attempt: ${new Date().toISOString()} ---\n`);
    logStream.write(`App Path: ${appPath}\n`);
    logStream.write(`Server Path: ${serverPath}\n`);

    serverProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: 5001,
            NODE_ENV: 'production',
            USER_DATA_PATH: userDataPath
        },
        stdio: ['inherit', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => logStream.write(`STDOUT: ${data}\n`));
    serverProcess.stderr.on('data', (data) => logStream.write(`STDERR: ${data}\n`));

    serverProcess.on('error', (err) => {
        logStream.write(`FORK ERROR: ${err.message}\n`);
        dialog.showErrorBox('Sunucu Başlatılamadı', 'Hata detayı log dosyasına yazıldı: ' + logFile);
    });

    serverProcess.on('exit', (code, signal) => {
        logStream.write(`EXIT: Code ${code}, Signal ${signal}\n`);
        if (code !== 0 && !app.isQuitting) {
            dialog.showErrorBox('Sunucu Hatası', `Arka plan sunucusu kapandı. Log: ${logFile}`);
        }
    });
}

app.on('ready', () => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
