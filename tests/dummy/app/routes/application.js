import Ember from 'ember';
import ENV from 'dummy/config/environment'
import GitHub from 'git-data'
const {
  inject: { service },
  get,
  set,
} = Ember

export default Ember.Route.extend({
  github: service(),

  init() {
    this._super(...arguments)
    console.log(GitHub)

//    // init github service
//    const github = get(this, 'github')
//    set(github, 'token', ENV.githubAccessToken)
//
//    const repo = github.repo('RisingTideGames', 'slots-data-dev', 'master')
//    repo.readFile('package.json')
//    .then(blob => {
//      const json = blob.content
//      json.hello = 'json i mean jason'
//      blob.content = json
//      // console.log(blob)
//    })
//    .catch(err => console.error(err.stack))
//
//    repo.deleteFile('machines/wordswithfriends/base/machine.json').then(() => {
//      return repo.deleteFile('package.json')
//    }).catch(err => {
//      console.error(err.stack)
//    })
  }
});
