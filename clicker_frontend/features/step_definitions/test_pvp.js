var assert = require('assert');
const {Given, When, Then, AfterAll} = require('@cucumber/cucumber');
const {Builder, By} = require("selenium-webdriver");
const {expect} = require("chai");

const driver = new Builder()
    .forBrowser('firefox')
    .build();

let ore_pre = 0;

Given('I visit the Clicker Royale website', function () {
    return driver.get('http://127.0.0.1:3000/').await;
});

When('I click on the PVP button', {timeout: 10000}, async function() {
    const pvp_button = await driver.findElement(By.id('button_pvp'));
    pvp_button.click();
});

Then('the PvP pop up should be visible', async function() {
    expect(await driver.findElement(By.id('popup_pvp')).isDisplayed()).to.equal(true);
});

When('I have at least 50 ore and click on the Angriff button', {timeout: 25000}, async function() {
    const mining_screen = await driver.findElement(By.id('mining_screen'));
    await driver.sleep(500);
    for (let i = 0; i < 50;i++) {
        await mining_screen.click();
    }
    await driver.findElement(By.id("button_pvp")).click();
    await driver.sleep(1000);
    await driver.findElement(By.id("button_upgrade_attack")).click();
    await driver.sleep(1000);
});

Then('the attack level should increase to 2', async function() {
    expect(await driver.findElement(By.id("label_attack_level")).getText()).to.equal("2");
});

Given('I have a account and there is another player that can be attacked', {timeout: 20000}, async function() {
    await driver.findElement(By.id('button_sign_up')).click();
    await driver.findElement(By.id('button_switch_signup')).click();
    await driver.sleep(500);
    const input_email = await driver.findElement(By.id('input_signup_email'));
    const input_password = await driver.findElement(By.id('input_signup_password'));
    const button = await driver.findElement(By.id('button_signup_submit'));
    input_email.sendKeys('pvp_dummy');
    input_password.sendKeys('test');
    await driver.sleep(500);
    button.click();
    const mining_screen = await driver.findElement(By.id('mining_screen'));
    await driver.sleep(1000);
    for (let i = 0; i < 10;i++) {
        await mining_screen.click();
    }
    await driver.findElement(By.id('button_sign_out')).click();

    await driver.findElement(By.id('button_sign_up')).click();
    await driver.sleep(500);
    await driver.findElement(By.id('button_switch_signup')).click();
    await driver.sleep(500);
    const email = await driver.findElement(By.id('input_signup_email'));
    const password = await driver.findElement(By.id('input_signup_password'));
    const submit = await driver.findElement(By.id('button_signup_submit'));
    email.sendKeys('self');
    password.sendKeys('test');
    await driver.sleep(500);
    submit.click();
    await driver.sleep(500);
    mining_screen.click();
})

When('I click the attack button to attack somebody', {timeout: 20000}, async function() {
    ore_pre = await driver.findElement(By.id('label_ore')).getText();
    await driver.findElement(By.id('button_pvp')).click();
    await driver.sleep(2000);
    await driver.findElement(By.id('button_attack')).click();
    await driver.sleep(15000);
})

Then('I want to see and receive my loot at the end of the attack', async function() {
    expect(await driver.findElement(By.id('popup_loot')).isDisplayed()).to.equal(true);
    expect(await driver.findElement(By.id('label_ore')).getText() >= ore_pre).to.equal(true);
});

/*AfterAll(async function() {
    await driver.quit();
});*/