Feature: Test Sign Up
  Scenario: Test Sign Up Pop Up
    Given I visit Clicker Royale website
    When I click the sign up button
    Then the sign up pop up should be visible

  Scenario:
    When I create a account
    Then I want to be logged in after creating it

  Scenario:
    Given I am not logged in
    When I log in to my account
    Then I want my save game to be loaded automatically
