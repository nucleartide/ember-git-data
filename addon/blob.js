
import b64DecodeUnicode from './utils/b64-decode-unicode'
import b64EncodeUnicode from './utils/b64-encode-unicode'
import Ember from 'ember'

const { set } = Ember

export class Blob {
  constructor({
    content = '',
    url = '',
    sha = '',
    size = 0
  } = {}) {
    this._content = content
    this.encoding = 'base64'
    this.url = url
    this.sha = sha
    this.size = size

    this._isDestroyed = false
  }

  get content() {
    return b64DecodeUnicode(this._content)
  }

  set content(value) {
    if (this._isDestroyed) throw new Error('blob was destroyed')
    this._content = b64EncodeUnicode(value)
  }

  destroy() {
    this._isDestroyed = true
  }
}

export class JSONBlob extends Blob {
  /**
   * @throws {SyntaxError}
   */
  get content() {
    return JSON.parse(super.content)
  }

  set content(value) {
    super.content = JSON.stringify(value, null, '\t')
  }
}

/**
 * NOTE: This class is never constructed. It serves mostly
 * as type documentation.
 */
export class Info {
  constructor() {
    this.path = ''
    this.mode = ''
    this.type = ''
    this.sha = ''
    this.url = ''
  }
}

/**
 * NOTE: This class is never constructed. It serves mostly
 * as type documentation.
 */
export class BlobInfo extends Info {
  constructor() {
    super()
    this.size = 0
  }
}

/**
 * NOTE: This class is never constructed. It serves mostly
 * as type documentation.
 */
export class TreeInfo extends Info {
}

