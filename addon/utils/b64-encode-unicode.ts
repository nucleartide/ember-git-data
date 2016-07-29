
/**
 * Escape a Unicode string before base64 encoding it.
 */
export default function b64EncodeUnicode(str: string): string {
  // percent encode each byte of the string
  str = encodeURIComponent(str)

  // percent decode (aka convert to ascii equivalents)
  str = str.replace(/%([0-9A-Fa-f]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt('0x' + p1, 16))
  })

  // base 64 encode
  str = btoa(str)

  return str
}

