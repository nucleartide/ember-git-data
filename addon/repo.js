import Ember from 'ember';
const { assert, get, merge, } = Ember;
class JSONBlob extends Blob {
    get content() {
        return null;
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
