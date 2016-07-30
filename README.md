
# Ember Git Data

Sane wrapper for GitHub's [Git Database API][1]. Good for building GitHub-backed web applications, like [GitBook][2].

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

// update a plain file
readme.content = vaporize(readme.content) // ｖａｐｏｒｗａｖｅ

// update a JSON file
const json = packageJson.content
json.hello = 'world'
packageJson.content = json

// delete
await repo.deleteFile('.travis.yml')

// finally, commit
await repo.commit('this is a commit message')
```

## Rationale

#### Why not use Ember Data?

#### Why not extend ember-data-github?

[1]: https://developer.github.com/v3/git/
[2]: https://www.gitbook.com/

