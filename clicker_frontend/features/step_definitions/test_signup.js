var assert = require('assert');
const {Given, When, Then, AfterAll} = require('@cucumber/cucumber');
const {Builder, By} = require("selenium-webdriver");
const {expect} = require('chai');

const driver = new Builder()
    .forBrowser('firefox')
    .build();

Given('I visit Clicker Royale website', function () {
    return driver.get('http://127.0.0.1:3000/').await;
});

When('I click the sign up button', {timeout: 10000}, async function () {
    const element = await driver.findElement(By.id('button_sign_up'));
    element.click();
});

Then('the sign up pop up should be visible', async function () {
    const element = await driver.findElement(By.id('input_signup_email'));
    expect(await element.isDisplayed()).to.equal(true);
});

When('I create a account', {timeout: 10000}, async function() {
    await driver.findElement(By.id('button_sign_up')).click();
    await driver.sleep(500);
    const input_email = await driver.findElement(By.id('input_signup_email'));
    const input_password = await driver.findElement(By.id('input_signup_password'));
    const button = await driver.findElement(By.id('button_signup_submit'));
    input_email.sendKeys('signup_dummy');
    input_password.sendKeys('test');
    await driver.sleep(500);
    button.click();
    await driver.sleep(1000);
});

Then('I want to be logged in after creating it', async function() {
    await driver.sleep(500);
    const element = await driver.findElement(By.id('button_sign_out'));
    expect(await element.isDisplayed()).to.equal(true);
    await driver.findElement(By.id('button_sign_out')).click();
});

Given('I am not logged in but have a account', {timeout: 10000}, async function () {
    await driver.findElement(By.id('button_sign_up')).click();
    await driver.sleep(500);
    const input_email = await driver.findElement(By.id('input_signup_email'));
    const input_password = await driver.findElement(By.id('input_signup_password'));
    const button = await driver.findElement(By.id('button_signup_submit'));
    input_email.sendKeys('signin_dummy');
    input_password.sendKeys('test');
    await driver.sleep(500);
    button.click();
    await driver.sleep(500);
    const mining_screen = await driver.findElement(By.id('mining_screen'));
    for (let i = 0; i < 5; i++) {
        await mining_screen.click();
    }
    await driver.sleep(2000);
    await driver.findElement(By.id('button_sign_out')).click();
});

When('I log in to my account', {timeout: 10000}, async function() {
    await driver.sleep(500);
    const element = await driver.findElement(By.id('button_sign_up'));
    element.click();
    await driver.sleep(500);
    const button_switch = await driver.findElement(By.id('button_switch_signin'));
    button_switch.click();
    await driver.sleep(500);
    const input_email = await driver.findElement(By.id('input_signin_email'));
    const input_password = await driver.findElement(By.id('input_signin_password'));
    const button = await driver.findElement(By.id('button_signin_submit'));
    input_email.sendKeys('signin_dummy');
    input_password.sendKeys('test');
    await driver.sleep(500);
    button.click();
});

Then('I want my save game to be loaded automatically', async function() {
    await driver.sleep(1000);
    expect(await driver.findElement(By.id('label_ore')).getText() > 0).to.equal(true);
    expect(await driver.findElement(By.id('label_depth')).getText() > 0).to.equal(true);
});