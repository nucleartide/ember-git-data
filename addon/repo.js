
import Ember from 'ember'
import { Blob, JSONBlob } from './blob'

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
    if (this._cachedTreeSHA) {
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
    // if blob is in the read queue, return that blob
    const blob = this._readQueue.find(blob => blob.path === path)
    if (blob) return blob

    // otherwise, fetch the blob
    const treeSHA = await this.treeSHA()
    const tree = await this.github.request(`/repos/${this.owner}/${this.repo}/git/trees/${treeSHA}?recursive=true`)
    const finalBlob = {}
  }
}

