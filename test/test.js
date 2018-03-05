var assert = require('assert');
describe('node_js', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});
describe('discord', function() {
  describe('#client.on()', function() {
    it('should log into client', function() {
      let config = require("../config.json");
      const Discord = require('discord.js');
      const client = new Discord.Client();
      client.login(config.token);
      let test_config = require("../test_config.json");
      const test_client = new Discord.Client();
      test_client.login(test_config.token);
      test_client.channels.get(test_config.testboxId).send('!role league');
    });
  });
});
