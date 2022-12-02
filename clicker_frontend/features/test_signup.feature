Feature: Test Sign Up
  Scenario: Test if sign up popup
    Given I visit Clicker Royale website
    When I click the sign up button
    Then the sign up pop up should be visible

  Scenario: Create a account
    Given I visit Clicker Royale website
    When I create a account
    Then I want to be logged in after creating it

  Scenario: Log in to already existing account
    Given I visit Clicker Royale website
    Given I am not logged in but have a account
    When I log in to my account
    Then I want my save game to be loaded automatically
