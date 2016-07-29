import Ember from 'ember';
const { set } = Ember;
export class Blob {
    constructor(content = '', url = '', sha = '', size = 0, path = '', mode = '') {
        this.content = content;
        this.url = url;
        this.sha = sha;
        this.size = size;
        this.path = path;
        this.mode = mode;
    }
}
class JSONBlob extends Blob {
    get content() {
    }
    set content(value) {
        super.content = JSON.stringify(value, null, '\t');
    }
}
