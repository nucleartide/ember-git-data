
# Ember Git Data

Sane wrapper for GitHub's [Git Database API][1].

## Install

```
$ ember install ember-git-data
```

## Example

```js
const repo = github.repo('nucleartide', 'ember-git-data', 'master')

// create
const readme = await repo.createFile('Readme.md')

// read
const packageJson = await repo.readFile('package.json')

// update
const json = packageJson.content
json.hello = 'world'
packageJson.content = json

// delete
await repo.deleteFile('.travis.yml')

// finally, commit
await repo.commit('this is a commit message')
```

## Rationale

[1]: https://developer.github.com/v3/git/

