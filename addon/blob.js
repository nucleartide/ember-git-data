
import b64DecodeUnicode from './utils/b64-decode-unicode'
import b64EncodeUnicode from './utils/b64-encode-unicode'
import Ember from 'ember'

const { set } = Ember

export class Blob {
  constructor() {
    this._content = ''
    this._encoding = 'base64'
    this._url = ''
    this._sha = ''
    this._size = 0

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

export class Info {
  constructor() {
    this._path = ''
    this._mode = ''
    this._type = ''
    this._sha = ''
    this._url = ''
  }
}

export class BlobInfo extends Info {
  constructor() {
    super()
    this._size = 0
  }
}

export class TreeInfo extends Info {
}

