Feature: Test Mining Functionalities
  Scenario: Test Mining on Click
    Given I am on the Clicker Royale main page
    When I click on the mining screen
    Then The ore and depth labels should increase

  Scenario: Opening the Mining screen
    Given I am on the Clicker Royale main page
    When I click on the Mining Button
    Then The Mining Menu Popup should show

  Scenario: Upgrading the Shovel Depth
    Given I am on the Clicker Royale main page
    When I have at least 50 ore and click on the Schaufelgeschwindigkeit Button
    Then It's level should increase to 2 and the depth should increase by 2 on click