const {
    app,
    BrowserWindow
} = require("electron");
const url = require('url')
const path = require('path')
const sensor = require('node-dht-sensor')
const Store = require('electron-store');
const store = new Store();


const args = process.argv.slice(1);
const dev = args.some(val => val === '--serve');
const big = args.some(val => val === '--big')

let window;
let config;

function createWindow() {
    config = store.get("config");
    store.onDidChange("config", (newValue, _) => {
        config = newValue
    })
    const {
        screen
    } = require('electron')
    const mainScreen = screen.getPrimaryDisplay();
    window = new BrowserWindow({
        width: dev ? big ? 1400 : 1080 : mainScreen.size.width,
        height: dev ? big ? 502 : 342 : mainScreen.size.height,
        frame: dev ? true : false,
        backgroundColor: '#353b48',
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, 'src/assets/icon.png')
    })

    config = store.get("config")

    if (dev) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`)
        });
        window.loadURL('http://localhost:4200');
    } else {
        window.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }

    if (!dev) {
        window.setFullScreen(true)
    } else {
        window.webContents.openDevTools();
    }

    if (config && config.octodash && config.octodash.temperatureSensor !== null) {
        queryTemperatureSensor();
    }
    setTimeout(sendVersionInfo, 42 * 1000);
    window.on('closed', () => {
        window = null;
    });
}

function sendVersionInfo() {
    window.webContents.send("versionInformation", {
        version: process.env.npm_package_version
    })
}

function queryTemperatureSensor() {
    if (process.platform !== "linux") {
        sensor.initialize({
            test: {
                fake: {
                    temperature: 23.4,
                    humidity: 54.0
                }
            }
        })
    }
    sensor.read(config.octodash.temperatureSensor.type, config.octodash.temperatureSensor.gpio, (err, temperature, humidity) => {
        if (!err) {
            window.webContents.send("temperatureReading", {
                temperature: temperature.toFixed(1),
                humidity: humidity.toFixed(1)
            });
        } else {
            window.webContents.send("temperatureReading", {
                temperature: 0.0,
                humidity: 0.0
            });
            console.log(err);
        }
        setTimeout(queryTemperatureSensor, 10000)
    })
}

app.on('ready', createWindow)

app.on("window-all-closed", () => {
    app.quit()
});

app.on("activate", () => {
    if (window === null) {
        createWindow();
    }
});
