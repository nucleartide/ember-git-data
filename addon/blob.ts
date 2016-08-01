
import b64DecodeUnicode from './utils/b64-decode-unicode'
import b64EncodeUnicode from './utils/b64-encode-unicode'
import Ember from 'ember'

const { set } = Ember

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

