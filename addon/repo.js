
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
    this.cachedCommitSHA = ''
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
   * TODO: make private
   *
   * @public
   * @return {String}
   */
  // jshint ignore:start
  async treeSHA() {
    if (!this.cachedTreeSHA) {
      const ref = await this.github.request(`/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`)
      const commitSHA = get(ref, 'object.sha')
      this.cachedCommitSHA = commitSHA
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
      if (exists) {
        const obj = {}
        const blobRes = await this.github.request(`/repos/${this.owner}/${this.repo}/git/blobs/${blob.sha}`)
        merge(obj, blob)
        merge(obj, blobRes)
        const newBlob = new FileType(obj)
        this.readQueue.push(newBlob)
        return newBlob
      }

      // otherwise, create the blob
      const newBlob = new FileType({ path, isDirty: true })

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
    const blob = arrayRemove(this.readQueue, blob => {
      // if path is substring of blob.path, we're deleting the parent directory
      const blobPathSubstring = blob.path.slice(0, path.length)
      return path === blobPathSubstring
    })
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

  /**
   * @param {Blob} blob
   */
  async updateBlob(blob) {
    // create new blob
    const newBlobRes = await this.github.post(`/repos/${this.owner}/${this.repo}/git/blobs`, {
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        content: blob.rawContent,
        encoding: 'base64'
      })
    })

    // gotta update parents now.
    // current tree: A -> B -> C -> oldBlob
    // update order: C, B, then A

    // fetch root tree so we can do comparisons
    const treeSHA = await this.treeSHA()
    const rootTree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
    const segments = blob.path.split('/')
    const [, ...treePaths] = segments
      .map((seg, i) => {
        if (i === 0) return seg
        return segments.slice(0, i).join('/') + '/' + seg
      })
      .reverse()
      .concat('')

    // create blob object
    const newBlob = new Blob(newBlobRes)
    newBlob.path = blob.path

    // this is the child that replaces the old blob/tree
    // it is updated on every iteration of the loop below
    let newChild = newBlob.info()
    let newRootSHA = newChild.sha

    for (const path of treePaths) {
      const treeInfo = rootTree.tree.find(obj => obj.path === path)
      const treeExists = Boolean(treeInfo)
      let tree =
        path === '' ? await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}`) :
        treeExists ? await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeInfo.sha}`) :
        null // the tree doesn't exist yet

      if (tree) {
        // replace old tree with new tree
        arrayRemove(tree.tree, obj => basename(obj.path) === basename(path))
        tree.tree.push(newChild)
      }

      let newTree
      if (tree) {
        // create the updated tree on github
        newTree = await this.github.post(`/repos/${this.owner}/${this.repo}/git/trees`, {
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify({ tree: tree.tree })
        })
      } else {
        // create a new empty tree
        newTree = await this.github.post(`/repos/${this.owner}/${this.repo}/git/trees`, {
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify({ tree: [newChild] })
        })
      }

      // save the info object
      newChild = {
        sha: newTree.sha,
        path: basename(path),
        mode: '040000', // for directories
        type: 'tree'
      }

      // save SHA
      newRootSHA = newTree.sha
    }

    assert('newRootSHA is non-empty', newRootSHA)
    this.cachedTreeSHA = newRootSHA
  }

  /**
   * @public
   * @param {String} message
   * @reject {AjaxError}
   */
  async commit(message) {
    for (const blob of this.readQueue) {
      if (blob.isDirty) {
        await this.updateBlob(blob)
      }
    }

    // TODO: can't set this to zero, will break multiple commits
    // this.readQueue.length = 0

    const commit = await this.github.post(`/repos/${this.owner}/${this.repo}/git/commits`, {
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        message: message,
        tree: this.cachedTreeSHA,
        parents: [this.cachedCommitSHA]
      })
    })
    this.cachedCommitSHA = commit.sha

    await this.github.patch(`/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`, {
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({ sha: commit.sha })
    })
  }

  async requestTree() {
    const treeSHA = await this.treeSHA()
    return await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
  }
}

