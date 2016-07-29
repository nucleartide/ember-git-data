/**
 * Convert a base64 string back to its Unicode string
 * equivalent.
 */
export default function b64DecodeUnicode(str) {
    // base 64 decode
    str = atob(str);
    // percent encode
    str = Array.prototype.map.call(str, function (c) {
        return '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('');
    // percent decode into original Unicode string
    str = decodeURIComponent(str);
    return str;
}
