require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const Chrome = require("selenium-webdriver/chrome");
const fs = require('fs');
const { EOL } = require("os");

const GYM = {
    app_url: process.env.APP_URL,
    access: {
        user: process.env.ACCESS_USER,
        pwd: process.env.ACCESS_PWD,
    },
    output: process.env.OUTPUT,
    inside_club: {
        title: 'Inside club',
        users_in: 'usersIn',
        users_limit: 'usersLimit',
    },
    login: {
        title: 'Ielogošanās',
        login: 'Login',
        password: 'Password',
        submit: 'SubmitCredentials',
    }
}
const { date, time } = getDate();

const record = {
    in: '0',
    limit: '0',
    date: date,
    time: time,
    status: 'ok',
}

async function runWorkflow() {
    const options = new Chrome.Options();
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options.addArguments('--headless=new'))
        .build();
    try {        
        await driver.get(GYM.app_url);
        if (hasToLog(driver)) {
            await login(driver);
        }
        await extractCapacity(driver);
    } catch (error) {
        console.error('Error:', error);
        record.status = 'error';
    } finally {
        await driver.quit();
    }
    
    recordData(record, GYM.output);
    console.log(record);
}

async function extractCapacity(driver) {
    await driver.wait(until.titleContains(GYM.inside_club.title), 10000);
    const usersIn = await driver.findElement(By.id(GYM.inside_club.users_in)).getText();
    const usersLimit = await driver.findElement(By.id(GYM.inside_club.users_limit)).getText();
    record.in = usersIn;
    record.limit = usersLimit;
}

async function login(driver) {
    await driver.wait(until.titleContains(GYM.login.title), 10000);
    const login = await driver.findElement(By.id(GYM.login.login));
    const password = await driver.findElement(By.id(GYM.login.password));
    const submit = await driver.findElement(By.id(GYM.login.submit));
    await login.sendKeys(GYM.access.user);
    await password.sendKeys(GYM.access.pwd);
    await submit.click();
}

async function hasToLog(driver) {
    const hasToLog = await driver.findElements(By.id(GYM.inside_club.users_in));
    return hasToLog.length === 0;
}

function recordData(data, filePath) {
    fs.appendFileSync(filePath, JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            console.error('Error recording data:', err);
        }
    });
    fs.appendFileSync(filePath, EOL, "utf8");
}

function getDate() {
    const date = new Date();
    return {
        date: date.toLocaleDateString('en-GB'),
        time: date.toLocaleTimeString('en-GB', { hour: "numeric", minute: "numeric"}),
    }
}

runWorkflow();
