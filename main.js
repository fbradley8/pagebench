const {app, globalShortcut, BrowserWindow, session, ipcMain} = require('electron');

var blockList = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, frame: false, minWidth: 600, minHeight: 400})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  const ses = mainWindow.webContents.session;

  ses.webRequest.onBeforeRequest([], function(details, callback) {
    if (blockList.length) {
      for (var i = 0; i < blockList.length; i++) {
        if (blockList[i].test(details.url)) {
          callback({cancel: true});
          return;
        }
      }
      callback({cancel: false});
    } else {
      callback({cancel: false});
    }
  });

  ipcMain.on('blockList', function(event, data){
    blockList = [];
    for (var i = 0; i < data.length; i++) {
      var bug = data[i];
      var matches = bug.match(/^\/(.+)\/(\w*)$/);
      if (matches) {
        var pattern = matches[1];
        var attributes = matches[2];
        if (attributes.length > 0)
          blockList.push(new RegExp(pattern, attributes));
        else
          blockList.push(new RegExp(pattern));
      }
    }
  });
}

app.commandLine.appendSwitch('disable-http-cache');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})