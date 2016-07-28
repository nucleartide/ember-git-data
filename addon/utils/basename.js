
/**
 * base returns the last element of a path.
 *
 * This is equivalent to require('path').basename in Node.
 *
 * @param {String} path
 * @return {String}
 */
export default function basename(path) {
  return path.split('/').slice(-1)[0]
}

