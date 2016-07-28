
import Ember from 'ember'
import { Blob, JSONBlob } from 'ember-git-data/utils/blob'
import { NotFoundError } from 'ember-ajax/errors'
import arrayRemove from 'ember-git-data/utils/array-remove'
import basename from 'ember-git-data/utils/basename'

const {
  assert,
  get,
  merge,
} = Ember

/**
 * TODO: generators "just work" in ember...if i recall
 * ember-concurrency did some things to optimize file size?
 * something about not including the polyfill.
 * TODO: github rate limit
 */
export default class Repo {
  constructor(githubAjax, owner, repo, branch) {
    assert('must pass in githubAjax', githubAjax)
    assert('must pass in owner', owner)
    assert('must pass in repo', repo)
    assert('must pass in branch', branch)

    this.github = githubAjax
    this.owner = owner
    this.repo = repo
    this.branch = branch

    // @type {Array<Blob>}
    this._readQueue = []

    // https://developer.github.com/v3/git/trees/#get-a-tree
    this._cachedTreeSHA = null
  }

  /**
   * @private
   * @param {String} path
   * @return {Blob}
   */
  static detectFileType(path) {
    if (path.slice(-5) === '.json') return JSONBlob
    return Blob
  }

  /**
   * @public
   */
  async treeSHA() {
    if (!this._cachedTreeSHA) {
      const ref = await this.github.request(`/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`)
      const commitSHA = get(ref, 'object.sha')
      const commit = await this.github.request(`/repos/${this.owner}/${this.repo}/git/commits/${commitSHA}`)
      this._cachedTreeSHA = get(commit, 'tree.sha')
    }

    return this._cachedTreeSHA
  }

  /**
   * @public
   * @param {String} path
   * @param {Class} fileType
   * @resolve {Blob}
   * @reject {AjaxError}
   */
  // jshint ignore:start
  async readFile(path = '', FileType = Repo.detectFileType(path)) {
    // if blob is in the read queue, return that blob
    const blob = this._readQueue.find(blob => blob.path === path)
    if (blob) return blob

    // otherwise, fetch the blob
    const treeSHA = await this.treeSHA()
    const level = path.split('/').length
    const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=${level}`)
    const finalBlob = {}
    {
      const blob = tree.tree.find(obj => obj.path === path)
      if (!blob) throw new NotFoundError()
      const moreOfBlob = await this.github.request(`/repos/${this.owner}/${this.repo}/git/blobs/${blob.sha}`)
      merge(finalBlob, blob)
      merge(finalBlob, moreOfBlob)
    }

    // and add the blob to the read queue
    {
      const blob = new FileType(finalBlob)
      this._readQueue.push(blob)
      return blob
    }
  }
  // jshint ignore:end

  /**
   * TODO: what if the file already exists?
   *
   * @public
   * @param {String} path
   * @param {Class} fileType
   * @return {Blob}
   */
  // jshint ignore:start
  createFile(path = '', FileType = Repo.detectFileType(path)) {
    const blob = new FileType({ path })
    this._createQueue.push(blob)
    return blob
  }
  // jshint ignore:end

  /**
   * TODO: would help to use typescript here. need to distinguish between Trees
   * and TreeInfo objects
   *
   * @public
   * @param {String} path
   * @reject {AjaxError}
   */
  async deleteFile(path = '') {
    // short-circuit
    if (!path) return

    // if the blob is in the read queue, remove and destroy
    const blob = arrayRemove(this._readQueue, blob => blob._path === path)
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
    this._cachedTreeSHA = newRootSHA
  }

  /**
   * @public
   * @param {String} message
   * @return {RSVP.Promise}
   */
  commit(message) {
  }

  // internally:
  //
  // first operation dictates the HEAD commit + tree
  // the tree should be cached
  //
  // x readFile => Promise<Blob>
  //   if blob is in read queue, return that blob
  //   else, fetch and add to read queue
  // x deleteFile => Promise<undefined>
  //   if the object is in the read queue, pop the object from the queue
  //   "destroy" the object, meaning you can't set stuff anymore
  //   run delete operations on the cached tree
  // createFile => Promise<Blob>
  //   if blob is in read queue, return that blob
  //   else, create (adding to cached tree) and add to read queue
  //
  // commit(message) => Promise<undefined>
  //   for each popped object in the read queue,
  //     update the object only if the object is "dirty"
  //   read queue should be clear
  //   tree cache should be clear
  //   commit and update HEAD reference
  //
  // x tree cache - will probably be in array representation
  //   read: use recursive fetch
  //   delete (write): leaf-most tree to parent-most tree
  //   create (write): add to tree, then leaf-most tree to parent-most tree
}

