
# Ember Git Data

Minimal wrapper for [git-data.js][2]. For API info, please see [git-data.js's
docs][4].

## Install

```
$ ember install ember-git-data
```

## Use

Extend the Ember.Service that comes with this addon, and provide your GitHub
access token:

```js
// app/services/github.js
import Ember from 'ember'
import GitHub from 'ember-git-data/services/github'

const {
  inject: { service },
  computed: { readOnly },
} = Ember

// don't forget to extend!
export default GitHub.extend({
  session: service(),
  token: readOnly('session.accessToken'),
})
```

You can now create as many [Repo][4] objects as you wish. Often, you will want
to return the Repo object as part of an Ember.Route's model hook:

```js
// app/routes/index.js
import Ember from 'ember'

const {
  inject: { service },
  get,
} = Ember

export default Ember.Route.extend({
  github: service(),

  async model() {
    const g = get(this, 'github')
    const repo = g.repo({
      owner: 'nucleartide',
      repo: 'ember-git-data',
      branch: 'master',
    })

    try {
      const packageJson = async repo.readFile('package.json')
      return { packageJson, repo }
    } catch (err) {
      // ...
    }
  }
})
```

Note: the async/await syntax should "just work". (Open an issue if I'm wrong!)

## Rationale

#### Why not use Ember Data?

Ember Data is great, and git-data.js could have easily been implemented as
Ember Data models/adapters/serializers. I wanted to decouple git-data.js from
Ember Data though, and make it usable in non-Ember environments.

#### Why not extend [ember-data-github][3]?

[git-data.js][1] focuses solely on GitHub's [Git Data API][1].
[ember-data-github][3] seems to have a broader focus.

[1]: https://developer.github.com/v3/git/
[2]: https://github.com/nucleartide/git-data.js
[3]: https://github.com/elwayman02/ember-data-github
[4]: https://github.com/nucleartide/git-data.js#api

