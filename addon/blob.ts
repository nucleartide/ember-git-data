
import b64DecodeUnicode from 'ember-git-data/utils/b64-decode-unicode'
import b64EncodeUnicode from 'ember-git-data/utils/b64-encode-unicode'
import Ember from 'ember'

const { set } = Ember

/**
 * TODO: might be worthwhile to have a concept of "original content".
 * that way i can do diffs and save on ajax operations.
 * TODO: perhaps throw more errors after .destroy() has been called?
 */
export class Blob {
  private isDestroyed: boolean
  private encoding: string

  constructor(
    protected _content: string = '',
    protected url: string = '',
    protected sha: string = '',
    protected size: number = 0,
    protected path: string = '',
    protected mode: string = ''
  ) {
    this.isDestroyed = false
    this.encoding = 'base64'
  }

  get content() {
    return b64DecodeUnicode(this._content)
  }

  set content(value) {
    if (this.isDestroyed) throw new Error('blob was destroyed')
    this._content = b64EncodeUnicode(value)
  }

  destroy() {
    this.isDestroyed = true
  }
}

/**
 * TODO: customize indentation
 * TODO: JSON.stringify does not guarantee key order, even
 * though it's ordered in chrome
 * TODO: more unit tests for util functions
 */
export class JSONBlob extends Blob {
  /**
   * @throws {SyntaxError}
   */
  get content() {
    return JSON.parse(b64DecodeUnicode(this._content))
  }

  set content(value) {
    super.content = JSON.stringify(value, null, '\t')
  }
}

