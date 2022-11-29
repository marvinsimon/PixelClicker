const { setWorldConstructor } = require('@cucumber/cucumber')

const { seleniumWebdriver } = require('selenium-webdriver');

var firefox = require('selenium-webdriver/firefox');

var chrome = require('selenium-webdriver/chrome');

function CustomWorld() {
    this.driver = new seleniumWebdriver.Builder()
        .forBrowser('firefox')
        .build();
}

module.exports = function() {
    this.World = CustomWorld;

    // sets a default timeout to 30 seconds.  Time is in ms.
    this.World.setDefaultTimeout(30 * 1000);
};