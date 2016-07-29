import Ember from 'ember';
const { assert, get, merge, } = Ember;
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
