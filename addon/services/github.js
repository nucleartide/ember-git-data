
import Ember from 'ember'
import GitHub from 'git-data'

const {
  computed,
  get,
  RSVP,
} = Ember

// required by git-data.js, which uses co, which requires a
// global Promise implementation
window.Promise = RSVP.Promise

export default Ember.Service.extend({
  token: '',

  github: computed('token', function() {
    const t = get(this, 'token')
    if (!t) throw new Error('Token is not set to a GitHub access token.')
    return new GitHub({ token: t })
  }),

  repo({ owner, repo, branch, commitPrefix }) {
    const g = get(this, 'github')
    return g.repo({ owner, repo, branch, commitPrefix })
  },
})

