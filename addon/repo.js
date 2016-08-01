export default class Repo {
    constructor(githubAjax, owner, repo, branch) {
        this.githubAjax = githubAjax;
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
    }
}
