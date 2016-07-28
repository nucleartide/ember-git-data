
import Ember from 'ember'
import { Blob, JSONBlob } from 'ember-git-data/utils/blob'
import NotFoundError from 'ember-ajax/errors'
import arrayRemove from 'ember-git-data/utils/array-remove'

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
   * @public
   * @param {String} path
   * @reject {AjaxError}
   */
  async deleteFile(path = '') {
    // if the blob is in the read queue, remove and destroy
    const blob = arrayRemove(this._readQueue, blob => blob.path === path)
    if (blob) blob.destroy()

    const treeSHA = await this.treeSHA()
    const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)

//    // machines/angelcity/base/machine.json
//    // package.json
//    //
//    // ===
//    //
//    // fetch machines/angelcity/base tree
//    //   remove machines/angelcity/base/machine.json from tree
//    //   create new tree
//    //   pass to next step
//    //
//    // ===
//    //
//    // accept machines/angelcity/base tree
//    // fetch machines/angelcity tree
//    //   set machines/angelcity/base tree to passed-in tree's sha
//    //   create new tree
//    //   pass to next step
//    //
//    // accept machines/angelcity tree
//    // fetch machines tree
//    //   set machines/angelcity tree to passed-in tree's sha
//    //   create new tree
//    //   pass to next step
//    //
//    // ===
//    //
//    // accept machines tree
//    // fetch root tree
//    //   set machines tree to passed-in tree's sha
//    //   create new tree
//    // update cached SHA
//    const segments = path.split('/')
//    const [fileToDelete, treeToDeleteFrom = '', ...treePaths] = segments
//    .map((s, i) => {
//      if (i === 0) return s
//      return segments.slice(0, i).join('/') + '/' + s
//    })
//    .reverse()
//
//    console.log(fileToDelete)
//    console.log(treeToDeleteFrom)
//    console.log(treePaths)
//
//    // fetch tree of first tree path
//    // delete "fileToDelete" from tree
//    // save tree, store new tree in toDelete
//    // remove first element from treePaths
//    // for each remaining path in treePaths
//    //   fetch the tree
//    //   add "toSave" to the tree
//    //   save the tree (create tree)
//    //   assign the new tree to "toSave"
//    // finally,
//    //   fetch the root tree
//    //   add "toSave" to the tree
//    //   save the tree (create tree)
//    //   update cached sha
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
  // deleteFile => Promise<undefined>
  //   if the object is in the read queue, pop the object from the queue
  //   "destroy" the object, meaning you can't set stuff anymore
  //   run delete operations on the cached tree
  // createFile => Promise<Blob>
  //   if blob is in read queue, return that blob
  //   else, create (adding to cached tree) and add to read queue
  //
  // const packageJson = await slotsData.readFile('package.json')
  // const json = packageJson.content
  // json.whoop = 'dee doo'
  // packageJson.content = whoop
  // await slotsData.commit('whoop de doo!!!1')
  //
  // updates (done by the user)
  //
  // commit(message) => Promise<undefined>
  //   for each popped object in the read queue,
  //     update the object only if the object is "dirty"
  //   read queue should be clear
  //   tree cache should be clear
  //   commit and update HEAD reference
  //
  // tree cache - will probably be in array representation
  //   read: use recursive fetch
  //   delete (write): leaf-most tree to parent-most tree
  //   create (write): add to tree, then leaf-most tree to parent-most tree
}

