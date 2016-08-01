
import Ember from 'ember'
import { Blob, JSONBlob } from './blob'

export default class Repo {
  constructor(
    private githubAjax,
    private owner: string,
    private repo: string,
    private branch: string
  ) {
  }
}

