
var path = require('path')
var mergeTrees = require('broccoli-merge-trees')
var Funnel = require('broccoli-funnel')

module.exports = {
  name: 'ember-git-data',

  included: function(app) {
    app.import('vendor/git-data.js')
    app.import('vendor/shim.js')
  },
}

