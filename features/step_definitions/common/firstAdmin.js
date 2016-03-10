var
  c = require('../../support/config.js'),
  assert = require('assert'),
  world = require('../../support/world');

module.exports = function () {
  this.Given(/^I go to the first admin creation page$/, function (callback) {
    browser
      .url('/#/firstAdmin')
      .waitForVisible('.create-first-admin-page', world.waitForPageVisible)
      .call(callback);
  });

  this.Then(/^I am on the first admin creation page$/, function (callback) {
    var requiredUrl = world.baseUrl + '/#/firstAdmin';
    var urlRegexp = new RegExp(requiredUrl, 'g');

    browser
      .waitForVisible('.create-first-admin-page', world.waitForPageVisible)
      .getUrl()
      .then(url => {
        assert(
          url.match(urlRegexp),
          'Must be at ' + requiredUrl + ' location, got ' + url
        );
      })
      .call(callback);
  });

  this.Given(/^I create the admin account as "([^"]*)"$/, function (user, callback) {

    if (!world.users.hasOwnProperty(user)) {
      throw new Error(`User ${user} not exists in world`);
    }

    browser
      .setValue('[name=username]', world.users[user].username)
      .setValue('[name=passworda]', world.users[user].clearPassword)
      .setValue('[name=passwordb]', world.users[user].clearPassword)
      .click('[type=submit]')
      .call(callback);
  });

  this.Then(/^I see an error message about the bad password$/, function (callback) {

    browser
      .waitForVisible('.alert-warning', 2000)
      .getText('.alert-warning')
      .then(text => {
        assert.equal(text, 'The password looks to not be valid.<br>Please avoid to use spaces or tabs and to type at least 8 chars.');
      })
      .call(callback);
  });

  this.Then(/^I see an error message about something wrong$/, function (callback) {

    browser
      .waitForVisible('.alert-warning', 2000)
      .getText('.alert-warning')
      .then(text => {
        assert.equal(text, 'Something really wrong just happend... look at the console...');
      })
      .call(callback);
  });

  this.Given(/^I click the logout button$/, function (callback) {
    browser
      .click('user-menu .logout-btn')
      .call(callback);
  });

  this.Then(/^I am logged out$/, function (callback) {
    browser
      .pause(1000)
      .getCookie(c.authCookieName)
      .then(cookie => {
        assert(!cookie, 'Session cookie was not destroyed');
      })
      .waitForExist('user-menu .username', 500, true)
      .then((doesNotExist) => {
        assert(doesNotExist, 'User menu is still present on the page. Expected not to be on the login page')
      })
      .call(callback);
  });

};