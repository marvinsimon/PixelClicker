Feature: Test Sign Up
  Scenario: Test Sign Up Pop Up
    Given I visit Clicker Royale website
    When I click the sign up button
    Then the sign up pop up should be visible

  Scenario:
    Given I visit Clicker Royale website
    When I create an account
    Then i want to be logged in after creation