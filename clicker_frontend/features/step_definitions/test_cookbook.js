var assert = require('assert');
const {Given, When, Then} = require('@cucumber/cucumber');


module.exports = function () {
    Given(/^'I visit Test Cookbook website'$/, function () {
        return this.driver.get('https://www.testcookbook.com').await;
    });

    Then(/^I see title Test Cookbook$/, function () {
        this.driver.getTitle().then(function (title) {
            assert.equal(title, "Test Cookbook");
            return title;
        });
    });
};