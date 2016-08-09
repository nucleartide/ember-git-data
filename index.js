
var path = require('path')
var mergeTrees = require('broccoli-merge-trees')
var Funnel = require('broccoli-funnel')

module.exports = {
  name: 'ember-git-data',

  treeForVendor: function(tree) {
    var packagePath = path.dirname(require.resolve('git-data'))
    var packageTree = new Funnel(this.treeGenerator(packagePath), {
      srcDir: '/',
      destDir: 'git-data',
    })

    var nodes = tree ? [tree, packageTree] : [packageTree]
    return mergeTrees(nodes)
  },

  included: function(app) {
    app.import('vendor/git-data/build/index.js')
    app.import('vendor/shim.js')
  },
}

