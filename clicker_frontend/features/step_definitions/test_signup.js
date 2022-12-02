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

When('I create an account', {timeout: 10000}, async function() {
    const element = await driver.findElement(By.id('button_sign_up'));
    element.click();
    await driver.sleep(500);
    const input_email = await driver.findElement(By.id('input_signup_email'));
    const input_password = await driver.findElement(By.id('input_signup_password'));
    const button = await driver.findElement(By.id('button_signup_submit'));
    input_email.sendKeys('dummy2');
    input_password.sendKeys('test');
    await driver.sleep(500);
    button.click();
});

Then('i want to be logged in after creation', async function() {
    await driver.sleep(500);
    const element = await driver.findElement(By.id('button_sign_out'));
    expect(await element.isDisplayed()).to.equal(true);
});