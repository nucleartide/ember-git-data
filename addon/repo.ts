
import Ember from 'ember'

const {
  assert,
  get,
  merge,
} = Ember

namespace Ember {
  /**
   * Note: this is from ember-ajax.
   */
  export interface AjaxService {
  }
}

class Blob {
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
    return 'test'
  }

  set content(value) {
    super.content = JSON.stringify(value, null, '\t')
  }
}

export default class Repo {
  private readQueue: Array<Object>
  private cachedTreeSHA: string

  constructor(
    private github: Ember.AjaxService,
    private owner: string,
    private repo: string,
    private branch: string
  ) {
    this.readQueue = []
    this.cachedTreeSHA = ''
  }

  /*
  static detectFileType(path: string): Object {
  }
  */
}

