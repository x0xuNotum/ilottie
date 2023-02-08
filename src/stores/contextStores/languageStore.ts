import { observable, action } from 'mobx'
import bind from 'bind-decorator'

interface Navigator {
  userLanguage?: string
}

export class LanguageStore {
  constructor(lang?: string) {
    this.initLanguage(lang)
  }

  @observable
  language: string = ''

  @bind
  @action
  initLanguage(lang?: string) {
    if (!lang) {
      lang = window.navigator.language
    }
    this.language = lang
  }
}
