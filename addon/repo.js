
import Ember from 'ember'
import { Blob, JSONBlob } from './blob'
import { NotFoundError } from 'ember-ajax/errors'
import arrayRemove from 'ember-git-data/utils/array-remove'
import basename from 'ember-git-data/utils/basename'

const { assert } = Ember

export default class Repo {
  /**
   * @public
   * @param {AjaxService} githubAjax
   * @param {String} owner
   * @param {String} repo
   * @param {String}
   */
  constructor(githubAjax, owner, repo, branch) {
    assert('must pass in github ajax service', githubAjax)
    assert('must pass in owner', owner)
    assert('must pass in repo', repo)
    assert('must pass in branch', branch)

    this._githubAjax = githubAjax
    this._owner = owner
    this._repo = repo
    this._branch = branch

    // @type {Array<Blob>}
    this._readQueue = []

    // https://developer.github.com/v3/git/trees/#get-a-tree
    this._cachedTreeSHA = ''
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
   * @param {Class<Blob>} fileType
   * @resolve {Blob}
   * @reject {AjaxError}
   */
  async readFile(path = '', FileType = Repo.detectFileType(path)) {
    const blob = this._readQueue.find(blob => blob.path === path)

    // if blob is not in the read queue
    if (!blob) {
      // check if the blob exists
      const treeSHA = await this.treeSHA()
      const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
      const info = tree.tree.find(obj => obj.path === path)
      if (!info) throw new NotFoundError()

      // if the blob exists, fetch and return the blob
      const res = await this.github.request(`/repos/${this.owner}/${this.repo}/git/blobs/${info.sha}`)
      const blob = new FileType(res)
      this._readQueue.push(blob)
      return blob
    }

    // otherwise, return the blob in the read queue
    return blob
  }

  /**
   * @public
   * @param {String} path
   * @param {Class<Blob>} fileType
   * @resolve {Blob}
   * @reject {AjaxError}
   */
  async createFile(path = '', FileType = Repo.detectFileType(path)) {
    const blob = this._readQueue.find(blob => blob._path === path)

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
      this._readQueue.push(newBlob)

      // and return the new blob
      return newBlob
    }

    // otherwise, return the blob in the read queue
    return blob
  }
}

