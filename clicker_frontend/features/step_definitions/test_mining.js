var assert = require('assert');
const {Given, When, Then} = require('@cucumber/cucumber');
const {Builder} = require("selenium-webdriver");

const driver = new Builder()
    .forBrowser('chrome')
    .build();