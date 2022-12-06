Feature: Test PvP functions
  Scenario: Test if pvp popup shows
    Given I visit the Clicker Royale website
    When I click on the PVP button
    Then the PvP pop up should be visible

  Scenario: Increase level of attack
    Given I visit the Clicker Royale website
    When I have at least 50 ore and click on the Angriff button
    Then the attack level should increase to 2

  Scenario: Attack another player
    Given I visit the Clicker Royale website
    Given I have a account and there is another player that can be attacked
    When I click the attack button to attack somebody
    Then I want to see and receive my loot at the end of the attack