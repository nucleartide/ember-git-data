
# Ember Git Data

> Sane wrapper for GitHub's [Git Database API][1].

> Commit more than one file change at a time.

> Good for building GitHub-backed web applications, like [GitBook][2].

## Demo

Try the [demo]() first.

## Install

```
$ ember install ember-git-data
```

## Example

```js
const repo = github.repo('nucleartide', 'ember-git-data', 'master')
@@ this.store.setProperties({ owner, repo, branch })

// create
const readme = await repo.createFile('Readme.md')
const path = 'machines/angelcity/base/machine.json'
const readme = await this.store
  .createRecord('github-file', { path })
  .save() // WARNING: model content will get overwritten
@@ const readme = await this.store.createFile('Readme.md')

// read
const packageJson = await repo.readFile('package.json')
const path = 'machines/angelcity/base/machine.json'
await this.store.queryRecord('github-file', { repo, path })
@@ const readme = await this.store.readFile('Readme.md')

// update a plain file
readme.content = vaporize(readme.content) // ｖａｐｏｒｗａｖｅ
@@ readme.set('content', { some: 'json object that will get serialized' })

// update a JSON file
const json = packageJson.content
json.hello = 'world'
packageJson.content = json

// delete
await repo.deleteFile('.travis.yml')
@@ await readme.destroyRecord()

// finally, commit
await repo.commit('this is a commit message')
@@ await this.store.commit('this is a commit message')
```

## Rationale

#### Why not use Ember Data?

I tried using Ember Data initially, but it quickly became very hard to work with. Ember Data requires that every object have an ID, but Git SHAs aren't sufficiently unique identifiers and I didn't want to auto-generate IDs or invent some crazy ID scheme.

#### Why not extend [ember-data-github][3]?

This library focuses solely on [GitHub's Git Data API][1]. I think [ember-data-github][3] has a broader focus of wrapping everything else.

[1]: https://developer.github.com/v3/git/
[2]: https://www.gitbook.com/
[3]: https://github.com/elwayman02/ember-data-github

