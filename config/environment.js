
/* jshint node:true */
'use strict'

module.exports = function(environment, appConfig) {
  if (environment === 'development' || environment === 'test') {
    if (!process.env.TOKEN) throw new Error('must pass in github access token')
    return { githubAccessToken: process.env.TOKEN }
  }

  return {}
}

