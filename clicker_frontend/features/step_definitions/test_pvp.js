var assert = require('assert');
const {Given, When, Then, AfterAll} = require('@cucumber/cucumber');
const {Builder} = require("selenium-webdriver");

const driver = new Builder()
    .forBrowser('chrome')
    .build();

AfterAll(async function() {
    await driver.quit();
});