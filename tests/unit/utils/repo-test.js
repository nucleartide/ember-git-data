
import Repo from 'dummy/utils/repo'
import { test } from 'qunit'
import moduleForAcceptance from 'dummy/tests/helpers/module-for-acceptance'
import ENV from 'dummy/config/environment'
import Ember from 'ember'

const {
  set,
  get,
} = Ember

moduleForAcceptance('Unit | Utility | repo', {
  beforeEach() {
    this.github = this.application.__container__.lookup('service:github')
    set(this.github, 'token', ENV.githubAccessToken)
    this.repo = new Repo(this.github, 'RisingTideGames', 'slots-data-dev', 'master')
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
  this.repo._cachedTreeSHA = sha
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
 * TODO: move into another file
 */

test('acceptance', async function(assert) {
  assert.expect(4)

  const packageJson = await this.repo.readFile('package.json')
  await this.repo.deleteFile('package.json')

  assert.throws(() => packageJson.content = {}, /blob was destroyed/)
  console.log('first')
  try {
    const packageJson = await this.repo.readFile('package.json')
    console.log('packageJson:', packageJson)
  } catch (err) {
    console.error(err.stack)
    assert.ok(err)
    console.log('second')
  }

  const veniceBaseMachine = await this.repo.readFile('machines/venice/base/machine.json')
  await this.repo.deleteFile('machines/venice/base/machine.json')

  assert.throws(() => veniceBaseMachine.content = {}, /blob was destroyed/)
  console.log('third')
  try {
    await this.repo.readFile('machines/venice/base/machine.json')
  } catch (err) {
    console.error(err.stack)
    assert.ok(err)
    console.log('fourth')
  }
})

