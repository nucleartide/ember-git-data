
import Ember from 'ember'
const { assert } = Ember

/**
 * arrayRemove removes the first occurrence of an element
 * from an array and returns that element.
 *
 * @param {Array<*>} arr
 * @param {Function} cb
 *   to be passed to Array.prototype.find.
 * @return {*|undefined}
 *   removed element if found, undefined otherwise.
 */
export default function arrayRemove(arr, cb) {
  const element = arr.find(cb)
  if (!element) return
  const index = arr.indexOf(element)
  arr.splice(index, 1)
  return element
}

