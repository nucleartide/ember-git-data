import b64DecodeUnicode from './utils/b64-decode-unicode';
import b64EncodeUnicode from './utils/b64-encode-unicode';
import Ember from 'ember';
const { set } = Ember;
export class Blob {
    constructor(_content = '', url = '', sha = '', size = 0, path = '', mode = '') {
        this._content = _content;
        this.url = url;
        this.sha = sha;
        this.size = size;
        this.path = path;
        this.mode = mode;
        this.isDestroyed = false;
        this.encoding = 'base64';
    }
    get content() {
        return b64DecodeUnicode(this._content);
    }
    set content(value) {
        if (this.isDestroyed)
            throw new Error('blob was destroyed');
        this._content = b64EncodeUnicode(value);
    }
    destroy() {
        this.isDestroyed = true;
    }
}
export class JSONBlob extends Blob {
    /**
     * @throws {SyntaxError}
     */
    get content() {
        return JSON.parse(b64DecodeUnicode(this._content));
    }
    set content(value) {
        super.content = JSON.stringify(value, null, '\t');
    }
}
