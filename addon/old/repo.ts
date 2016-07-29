
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

