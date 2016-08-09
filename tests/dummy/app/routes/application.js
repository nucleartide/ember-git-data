
import Ember from 'ember'
import ENV from 'dummy/config/environment'

const {
  inject: { service },
  get,
  set,
} = Ember

export default Ember.Route.extend({
  github: service(),

  init() {
    this._super(...arguments)
    const g = get(this, 'github')
    const r = g.repo({
      owner: 'RisingTideGames',
      repo: 'slots-data-dev',
      branch: 'master',
      commitPrefix: '[tools]'
    })

    r.readFile('package.json').then(blob => {
      console.log(blob)
      console.log(blob.content)
    }).catch(err => console.error(err.stack))

    r.deleteFile('something/that/does/not/exist.txt').catch(err => {
      console.error(err.stack)
    })
  }
})

