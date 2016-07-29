
/**
 * basename returns the last element of a path.
 *
 * @param {String} path
 * @return {String}
 */
export default function basename(path) {
  return path.split('/').slice(-1)[0]
}

