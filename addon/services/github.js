
import Ember from 'ember'
import Repo from 'ember-git-data/utils/repo'
import AjaxService from 'ember-ajax/services/ajax'

const {
  computed,
  get,
} = Ember

export default AjaxService.extend({
  token: '',

  host: 'https://api.github.com',
  headers: computed('token', function() {
    const token = get(this, 'token')
    if (!token) throw new Error("must set 'token' to github access token")
    return { Authorization: `token ${token}` }
  }),

  /**
   * @param {String} owner
   * @param {String} repo
   * @param {String} branch
   */
  repo(owner, repo, branch) {
    console.log('repo')
    return new Repo(this, owner, repo, branch)
  },
})

