
import b64DecodeUnicode from './utils/b64-decode-unicode'
import b64EncodeUnicode from './utils/b64-encode-unicode'
import basename from './utils/basename'

export class Blob {
  constructor({
    content = '',
    url = '',
    sha = '',
    size = 0,
    path = '',
    mode = '100644',
    isDirty = false,
  } = {}) {
    // returned by https://developer.github.com/v3/git/blobs/#get-a-blob
    this._content = content
    this._originalContent = content
    this.encoding = 'base64'
    this.url = url
    this.sha = sha
    this.size = size

    // returned by https://developer.github.com/v3/git/trees/#get-a-tree
    this.path = path
    this.mode = mode

    this.isDestroyed = false
    this.isDirty = isDirty
  }

  get originalContent() {
    return b64DecodeUnicode(this._originalContent)
  }

  get content() {
    return b64DecodeUnicode(this._content)
  }

  set content(value) {
    if (this.isDestroyed) throw new Error('blob was destroyed')
    this._content = b64EncodeUnicode(value)
    this.isDirty = true
  }

  /**
   * @return {String} content in base64 form
   */
  get rawContent() {
    return this._content
  }

  destroy() {
    this.isDestroyed = true
  }

  /**
   * Split out the blob in "info" format.
   */
  info() {
    return {
      mode: this.mode,
      path: basename(this.path),
      sha: this.sha,
      size: this.size,
    }
  }
}

export class JSONBlob extends Blob {
  /**
   * @throws {SyntaxError}
   */
  get content() {
    return JSON.parse(super.content)
  }

  /**
   * @throws {SyntaxError}
   */
  get originalContent() {
    return JSON.parse(super.originalContent)
  }

  set content(value) {
    super.content = JSON.stringify(value, null, '\t') + '\n'
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

