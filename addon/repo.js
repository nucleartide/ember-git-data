import Ember from 'ember';
const { assert, get, merge, } = Ember;
class Blob {
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
        return 'test';
    }
    set content(value) {
        super.content = JSON.stringify(value, null, '\t');
    }
}
export default class Repo {
    constructor(github, owner, repo, branch) {
        this.github = github;
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.readQueue = [];
        this.cachedTreeSHA = '';
    }
}
