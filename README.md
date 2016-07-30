
# Ember Git Data

- Sane wrapper for GitHub's [Git Database API][1].
- Commit more than one file change at a time.
- Good for building GitHub-backed web applications, like [GitBook][2].

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

I tried using Ember Data initially, but it quickly became very hard to work with. Ember Data requires that every object have an ID, but Git SHAs aren't sufficiently unique identifiers and I didn't want to auto-generate IDs or invent some crazy ID scheme.

#### Why not extend [ember-data-github][3]?

This library focuses *solely* on [GitHub's Git Data API][1]. ember-data-github has a broader focus of wrapping everything else.

[1]: https://developer.github.com/v3/git/
[2]: https://www.gitbook.com/
[3]: https://github.com/elwayman02/ember-data-github

