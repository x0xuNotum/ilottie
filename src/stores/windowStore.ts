import { observable, action, computed } from 'mobx'
import { bind } from 'bind-decorator'

class Window {
  @observable width = window.innerWidth
  @observable height = window.innerHeight
  @observable scrollBlocked: boolean = false

  constructor() {
    window.addEventListener(
      'resize',
      () => {
        this.updateViewportHeight()
        this.updateViewportWidth()
      },
      true
    )

    setInterval(() => {
      this.updateViewportHeight()
      this.updateViewportWidth()
    }, 1000)
  }

  @action
  updateViewportHeight = () => {
    if (window.innerHeight !== this.height) {
      this.height = window.innerHeight
    }
  }

  @action
  updateViewportWidth = () => {
    if (window.innerWidth !== this.width) {
      this.width = window.innerWidth
    }
  }

  @computed
  get isLandscape() {
    return this.height < this.width
  }

  @bind
  @action
  setScrollBlocked(value: boolean) {
    this.scrollBlocked = value
  }
}

export const windowStore = new Window()
