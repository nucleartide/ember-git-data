
import b64DecodeUnicode from 'ember-git-data/utils/b64-decode-unicode'
import b64EncodeUnicode from 'ember-git-data/utils/b64-encode-unicode'
import Ember from 'ember'

const { set } = Ember

export class Blob {
  constructor(
    protected content: string = '',
    protected url: string = '',
    protected sha: string = '',
    protected size: number = 0,
    protected path: string = '',
    protected mode: string = ''
  ) {}
}

class JSONBlob extends Blob {
  get content() {
  }

  set content(value) {
    super.content = JSON.stringify(value, null, '\t')
  }
}

