
// jshint ignore:start
import Repo from 'ember-git-data/repo'
import { test } from 'qunit'
import moduleForAcceptance from 'dummy/tests/helpers/module-for-acceptance'
import ENV from 'dummy/config/environment'
import Ember from 'ember'

const {
  set,
  get,
} = Ember

moduleForAcceptance('Unit | Utility | repo', {
  async beforeEach() {
    // initialize github client
    this.github = this.application.__container__.lookup('service:github')
    set(this.github, 'token', ENV.githubAccessToken)

    // create repo context
    this.repo = new Repo(this.github, 'RisingTideGames', 'slots-data-dev', 'master')

    // reset repo state
    await this.github.patch(`/repos/RisingTideGames/slots-data-dev/git/refs/heads/master`, {
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        sha: 'e8ede1bf0c6d9ea42adf0b6fd5a16016c4e6401f',
        force: true
      })
    })
  },

  afterEach() {
    set(this.github, 'token', '')
  },
})

/**
 * GitHub API quirks. Wtf.
 */

test('https://developer.github.com/v3/git/trees/#get-a-tree-recursively', async function(assert) {
  // note: using a repo (nucleartide/ember-outside-click)
  // that i don't plan on removing any time soon
  const owner = 'nucleartide'
  const repo = 'ember-outside-click'
  const branch = 'master'

  const ref = await this.github.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`)
  const commitSHA = get(ref, 'object.sha')
  const commit = await this.github.request(`/repos/${owner}/${repo}/git/commits/${commitSHA}`)
  const treeSHA = get(commit, 'tree.sha')

  const [rootTree, ...otherShit] = [
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}`),
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}?recursive=1`),
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}?recursive=2`),
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}?recursive=3`),
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}?recursive=true`),
    await this.github.request(`/repos/${owner}/${repo}/git/trees/${treeSHA}?recursive=bologna`),
  ]

  const counts = otherShit.map(tree => tree.tree.length)
  counts.reduce((prev, curr) => {
    assert.equal(prev, curr)
    return curr
  })

  assert.notEqual(rootTree.tree.length, otherShit[0].tree.length)
})

/**
 * .treeSHA() tests.
 */

test('when cached tree sha is empty, it should return non-empty', async function(assert) {
  assert.ok(await this.repo.treeSHA())
})

test('when cached tree sha is non-empty, it should return the same sha', async function(assert) {
  const sha = 'non-empty bro'
  this.repo.cachedTreeSHA = sha
  assert.equal(await this.repo.treeSHA(), sha)
})

/**
 * .deleteFile() tests.
 */

test('when path is falsy, it should not throw errors', async function(assert) {
  {
    const result = await this.repo.deleteFile('')
    assert.equal(result, undefined)
  }

  {
    const result = await this.repo.deleteFile(undefined)
    assert.equal(result, undefined)
  }
})

/**
 * Acceptance tests.
 */

test('acceptance', async function(assert) {
  assert.expect(4)

  const packageJson = await this.repo.readFile('package.json')
  await this.repo.deleteFile('package.json')

  assert.throws(() => packageJson.content = {}, /blob was destroyed/)
  try {
    const packageJson = await this.repo.readFile('package.json')
  } catch (err) {
    assert.equal(err.message, 'Resource was not found.')
  }

  const veniceBaseMachine = await this.repo.readFile('machines/venice/base/machine.json')
  await this.repo.deleteFile('machines/venice/base/machine.json')

  assert.throws(() => veniceBaseMachine.content = {}, /blob was destroyed/)
  try {
    await this.repo.readFile('machines/venice/base/machine.json')
  } catch (err) {
    assert.equal(err.message, 'Resource was not found.')
  }
})

test('more acceptance', async function(assert) {
  const somefileJson = await this.repo.createFile('somefile.json')
  somefileJson.content = { hello: 'jason' }

  const somefileJson2 = await this.repo.readFile('somefile.json')
  assert.equal(somefileJson, somefileJson2)
  assert.deepEqual(somefileJson2.content, { hello: 'jason' })

  await this.repo.deleteFile('somefile.json')
  assert.throws(() => somefileJson.content = {}, /blob was destroyed/)
  assert.throws(() => somefileJson2.content = {}, /blob was destroyed/)

  const packageJson = await this.repo.readFile('package.json')
  assert.ok('dependencies' in packageJson.content ||
            'devDependencies' in packageJson.content)

  const highRoller = await this.repo.readFile('global/trigger-modules/high_roller_module.json')
  highRoller.content = { jason: Date.now() }
  try {
    await this.repo.commit('test commit')
  } catch (err) {
    console.error(err.stack)
  }
})

test('even more acceptance', async function(assert) {
  const garbageTxt = await this.repo.createFile('garbage.txt')
  assert.equal(garbageTxt.content, '')
  garbageTxt.content = 'something'

  const packageJson = await this.repo.readFile('package.json')
  assert.equal(packageJson.content.name, 'slots-data')
  packageJson.content = { lost: 'the game' }

  await this.repo.deleteFile('package.py')

  await this.repo.commit('awwwwww yeah')
})

test('empty files', async function(assert) {
  const oldTreeSHA = await this.repo.treeSHA()

  const emptyFile = await this.repo.createFile('empty.txt')
  assert.ok(emptyFile.isDirty, 'empty file is dirty')
  await this.repo.commit('should have created empty file')

  const newTreeSHA = await this.repo.treeSHA()
  assert.notEqual(newTreeSHA, oldTreeSHA, 'tree should have been updated')
})

test('commits update tree sha', async function(assert) {
  const oldTreeSHA = await this.repo.treeSHA()

  const newFile = await this.repo.createFile('newfile.txt')
  newFile.content = 'this is a file'

  await this.repo.commit('create test file')

  const newTreeSHA = await this.repo.treeSHA()
  assert.notEqual(newTreeSHA, oldTreeSHA)
})
// jshint ignore:end

