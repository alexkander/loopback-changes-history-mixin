const ChangeHistory = require('./changes-history');

module.exports = function (app) {
  app.loopback.modelBuilder.mixins.define('ChangeHistory', ChangeHistory);
};
