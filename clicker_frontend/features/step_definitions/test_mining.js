const {Given, When, Then, AfterAll} = require('@cucumber/cucumber');
const {Builder, By, ActionChains} = require("selenium-webdriver");
const { expect } = require('chai');
const {driverLocation} = require("selenium-webdriver/common/seleniumManager");


const driver = new Builder()
    .forBrowser('chrome')
    .build();

let compare_ore = 0;
let compare_depth = 0;

Given('I am on the Clicker Royale main page', async function () {
    return driver.get('http://127.0.0.1:3000/').await;
});

When('I click on the mining screen', async function () {
    const mining_screen = await driver.findElement(By.id('mining_screen'));
    compare_ore = await driver.findElement(By.id('label_ore')).getText();
    compare_depth = await driver.findElement(By.id('label_depth')).getText();
    await driver.sleep(1000);
    await mining_screen.click();
});

Then('The ore and depth labels should increase', async function () {
    expect(await driver.findElement(By.id('label_ore')).getText() > compare_ore).to.equal(true);
    expect(await driver.findElement(By.id('label_depth')).getText() > compare_depth).to.equal(true);
});

When('I click on the Mining Button', async function () {
   const pvp_button = await driver.findElement(By.id("button_mining"));
   await pvp_button.click();
});

Then('The Mining Meu Popup should show', async function () {
    expect(await driver.findElement(By.id('popup_mining')).isDisplayed()).to.equal(true);
});

When('I have at least 50 ore and click on the Schaufelgeschwindigkeit Button', async function () {
    const mining_screen = await driver.findElement(By.id('mining_screen'));
    await driver.sleep(500);
    for (let i = 0; i < 50;i++) {
        await mining_screen.click();
    }
    await driver.findElement(By.id("button_mining")).click();
    await driver.findElement(By.id("button_upgrade_shovel_depth")).click();
});

Then("It's level should increase to 2 and the depth should increase by 2 on click", async function () {
    expect(await driver.findElement(By.id("button_upgrade_shovel_depth")).getText()).to.equal("Schaufelgeschwindigkeitslevel: 2");
    const actions = driver.actions({async: true});
    await actions.move({x:0, y:0}).click().perform();
    await driver.findElement(By.id('mining_screen')).click();
    expect(await driver.findElement(By.id("label_depth")).getText()).to.equal("52");
});

AfterAll(async function() {
    await driver.quit();
});