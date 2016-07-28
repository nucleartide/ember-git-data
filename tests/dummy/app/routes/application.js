import Ember from 'ember';
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

    // init github service
    const github = get(this, 'github')
    set(github, 'token', ENV.githubAccessToken)

    const repo = github.repo('RisingTideGames', 'slots-data', 'master')
    repo.readFile('package.json')
    .then(blob => {
      const json = blob.content
      json.hello = 'json i mean jason'
      blob.content = json
      // console.log(blob)
    })
    .catch(err => console.error(err.stack))

    repo.deleteFile('machines/angelcity/base/machine.json').catch(err => console.error(err.stack))
    repo.deleteFile('package.json').catch(err => console.error(err.stack))
  }
});
