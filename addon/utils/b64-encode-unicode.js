
/**
 * Escape a Unicode string before base64 encoding it.
 *
 * @param {String} str
 * @return {String}
 */
export default function b64EncodeUnicode(str) {
  // percent encode each byte of the string
  str = encodeURIComponent(str)

  // percent decode (aka convert to ascii equivalents)
  str = str.replace(/%([0-9A-Fa-f]{2})/g, (match, p1) => {
    return String.fromCharCode('0x' + p1)
  })

  // base 64 encode
  str = btoa(str)

  return str
}

