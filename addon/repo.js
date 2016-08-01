
import Ember from 'ember'
import { Blob, JSONBlob } from './blob'
// jshint ignore:start
import { NotFoundError } from 'ember-ajax/errors'
import arrayRemove from 'ember-git-data/utils/array-remove'
import basename from 'ember-git-data/utils/basename'
// jshint ignore:end

const {
  assert,
  // jshint ignore:start
  get,
  merge,
  // jshint ignore:end
} = Ember

export default class Repo {
  /**
   * @public
   * @param {AjaxService} githubAjax
   * @param {String} owner
   * @param {String} repo
   * @param {String}
   */
  constructor(github, owner, repo, branch) {
    assert('must pass in github ajax service', github)
    assert('must pass in owner', owner)
    assert('must pass in repo', repo)
    assert('must pass in branch', branch)

    this.github = github
    this.owner = owner
    this.repo = repo
    this.branch = branch

    // @type {Array<Blob>}
    this.readQueue = []

    // https://developer.github.com/v3/git/trees/#get-a-tree
    this.cachedTreeSHA = ''
  }

  /**
   * @private
   * @param {String} path
   * @return {Class<Blob>}
   */
  static detectFileType(path) {
    if (path.slice(-5) === '.json') return JSONBlob
    return Blob
  }

  /**
   * @private
   * @return {String}
   */
  // jshint ignore:start
  async treeSHA() {
    if (!this.cachedTreeSHA) {
      const ref = await this.github.request(`/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`)
      const commitSHA = get(ref, 'object.sha')
      const commit = await this.github.request(`/repos/${this.owner}/${this.repo}/git/commits/${commitSHA}`)
      this.cachedTreeSHA = get(commit, 'tree.sha')
    }

    return this.cachedTreeSHA
  }
  // jshint ignore:end

  /**
   * @public
   * @param {String} path
   * @param {Class<Blob>} fileType
   * @resolve {Blob}
   * @reject {AjaxError}
   */
  // jshint ignore:start
  async readFile(path = '', FileType = Repo.detectFileType(path)) {
    const blob = this.readQueue.find(blob => blob.path === path)

    // if blob is not in the read queue
    if (!blob) {
      // check if the blob exists
      const treeSHA = await this.treeSHA()
      const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
      const info = tree.tree.find(obj => obj.path === path)
      if (!info) throw new NotFoundError()

      // since the blob exists, fetch and return the blob
      const finalBlob = {}
      merge(finalBlob, info)
      const res = await this.github.request(`/repos/${this.owner}/${this.repo}/git/blobs/${info.sha}`)
      merge(finalBlob, res)
      const blob = new FileType(finalBlob)
      this.readQueue.push(blob)
      return blob
    }

    // otherwise, return the blob in the read queue
    return blob
  }
  // jshint ignore:end

  /**
   * @public
   * @param {String} path
   * @param {Class<Blob>} fileType
   * @resolve {Blob}
   * @reject {AjaxError}
   */
  // jshint ignore:start
  async createFile(path = '', FileType = Repo.detectFileType(path)) {
    const blob = this.readQueue.find(blob => blob._path === path)

    // if the blob is not in the read queue
    if (!blob) {
      // check if the blob exists
      const treeSHA = await this.treeSHA()
      const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
      const blob = tree.tree.find(obj => obj.path === path)
      const exists = Boolean(blob)

      // if the blob exists, return that blob
      if (exists) return blob

      // otherwise, create the blob
      const newBlob = new FileType({ path })

      // add the blob to the read queue
      this.readQueue.push(newBlob)

      // and return the new blob
      return newBlob
    }

    // otherwise, return the blob in the read queue
    return blob
  }
  // jshint ignore:end

  /**
   * @public
   * @param {String} path
   * @reject {AjaxError}
   */
  // jshint ignore:start
  async deleteFile(path = '') {
    // short-circuit
    if (!path) return

    // if the blob is in the read queue, remove and destroy
    const blob = arrayRemove(this.readQueue, blob => blob.path === path)
    if (blob) blob.destroy()

    // declare lots of variables we will need later
    const treeSHA = await this.treeSHA()
    const rootTree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
    const segments = path.split('/')
    const [pathOfFileToDelete, pathOfTreeToDeleteFrom, ...treePaths] = segments
      .map((seg, i) => {
        if (i === 0) return seg
        return segments.slice(0, i).join('/') + '/' + seg
      })
      .reverse()
      .concat('')

    // when destroying a blob that *hasn't* been created via
    // the github api, we should just return here so as not
    // to throw NotFoundErrors below
    {
      const wasInReadQueue = Boolean(blob)
      const isCreated = Boolean(rootTree.tree.find(obj => obj.path === path))
      if (wasInReadQueue && !isCreated) return
    }

    // fetch tree to delete from
    let treeToDeleteFrom
    if (pathOfTreeToDeleteFrom === '') {
      treeToDeleteFrom = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${rootTree.sha}`)
    } else {
      const treeInfo = rootTree.tree.find(obj => obj.path === pathOfTreeToDeleteFrom)
      if (!treeInfo) throw new NotFoundError()
      treeToDeleteFrom = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeInfo.sha}`)
    }

    // delete "pathOfFileToDelete" from tree
    {
      const before = treeToDeleteFrom.tree.length
      arrayRemove(treeToDeleteFrom.tree, obj => basename(obj.path) === basename(pathOfFileToDelete))
      const after = treeToDeleteFrom.tree.length
      assert('removed one element from tree', before - 1 === after)
    }

    // create the updated tree on github
    const updatedTree = await this.github.post(`/repos/${this.owner}/${this.repo}/git/trees`, {
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({ tree: treeToDeleteFrom.tree })
    })

    // declare "newRootSHA", which will be repeatedly
    // assigned in the loop below. last assignment is the
    // new SHA.
    let newRootSHA = updatedTree.sha

    // save the current TreeInfo object
    let treeInfo = null
    if (pathOfTreeToDeleteFrom !== '') {
      const oldTreeInfo = rootTree.tree.find(obj => obj.path === pathOfTreeToDeleteFrom)
      const clone = {}
      merge(clone, oldTreeInfo)
      delete clone.url
      clone.sha = updatedTree.sha
      clone.path = basename(clone.path)
      treeInfo = clone
    }

    // for each remaining path in treePaths
    for (const path of treePaths) {
      // fetch the tree
      let tree
      if (path === '') {
        tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${rootTree.sha}`)
      } else {
        const treeInfo = rootTree.tree.find(obj => obj.path === path)
        if (!treeInfo) throw new NotFoundError()
        tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeInfo.sha}`)
      }

      // add new "treeInfo" to the tree, replacing its older version
      arrayRemove(tree.tree, obj => basename(obj.path) === basename(path))
      tree.tree.push(treeInfo)

      // create the updated tree on github
      const newTree = await this.github.post(`/repos/${this.owner}/${this.repo}/git/trees`, {
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ tree: tree.tree })
      })

      // save the current TreeInfo object
      treeInfo = null
      if (path !== '') {
        const oldTreeInfo = rootTree.tree.find(obj => obj.path === path)
        const clone = {}
        merge(clone, oldTreeInfo)
        delete clone.url
        clone.sha = newTree.sha
        clone.path = basename(clone.path)
        treeInfo = clone
      }

      // save SHA
      newRootSHA = newTree.sha
    }

    // update cached SHA
    assert('newRootSHA is non-empty', newRootSHA)
    this.cachedTreeSHA = newRootSHA
  }
  // jshint ignore:end
}

