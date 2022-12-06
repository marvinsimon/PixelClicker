var assert = require('assert');
const {Given, When, Then, AfterAll} = require('@cucumber/cucumber');
const {Builder} = require("selenium-webdriver");

const driver = new Builder()
    .forBrowser('chrome')
    .build();

Given('I visit Test Cookbook website', function () {
    return driver.get('https://www.testcookbook.com').await;
});

Then('I see title Test Cookbook', function () {
    driver.getTitle().then(function (title) {
        assert.equal(title, "Test Cookbook");
        return title;
    });
});

AfterAll(async function () {
    await driver.quit();
})