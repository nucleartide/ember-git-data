
import Ember from 'ember'
import GitHub from 'ember-git-data/services/github'
import ENV from 'dummy/config/environment'

export default GitHub.extend({
  token: ENV.githubAccessToken
})

