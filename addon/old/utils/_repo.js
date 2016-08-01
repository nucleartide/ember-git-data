
import Ember from 'ember'
import { Blob, JSONBlob } from 'ember-git-data/utils/blob'
import { NotFoundError } from 'ember-ajax/errors'
import arrayRemove from 'ember-git-data/utils/array-remove'
import basename from 'ember-git-data/utils/basename'

const {
  assert,
  get,
  merge,
} = Ember

export default class Repo {
  /**
   * @public
   * @param {String} message
   * @return {RSVP.Promise}
   */
  commit(message) {
    // TODO: need to mkdir -p if the directories don't exist
  }

  // commit(message) => Promise<undefined>
  //   for each popped object in the read queue,
  //     update the object only if the object is "dirty"
  //   read queue should be clear
  //   tree cache should be clear
  //   commit and update HEAD reference
}

