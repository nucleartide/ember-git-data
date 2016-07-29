/**
 * TODO: generators "just work" in ember...if i recall
 * ember-concurrency did some things to optimize file size?
 * something about not including the polyfill.
 * TODO: github rate limit
 */
export default class Repo {
    constructor(githubAjax, owner, repo, branch) {
        this.githubAjax = githubAjax;
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
    }
}
