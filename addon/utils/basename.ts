
/**
 * base returns the last element of a path.
 *
 * This is equivalent to require('path').basename in Node.
 */
export default function basename(path: string): string {
  return path.split('/').slice(-1)[0]
}

