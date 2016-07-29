
import Ember from 'ember'
const { assert } = Ember

/**
 * remove removes the first occurrence of an element from an
 * array and returns that element.
 *
 * @param arr
 * @param cb to be passed to Array.prototype.find.
 * @return removed element if found, undefined otherwise.
 */
export default function remove(
  arr: Array<any>,
  cb: (element?: any, index?: number, array?: Array<any>) => boolean
): any {
  const element: any = arr.find(cb)
  if (!element) return
  const index: number = arr.indexOf(element)
  assert('index > -1', index > -1)
  arr.splice(index, 1)
  return element
}

