import bind from 'bind-decorator'
import { action, observable } from 'mobx'

type RendererType = 'svg' | 'canvas'
type QualityType = 'high' | 'medium' | 'low'

export interface LottiePlayerSettings {
  renderer: RendererType
  quality: QualityType
}

export class SettingsStore {
  @observable.ref
  settings: LottiePlayerSettings = {
    renderer: 'svg',
    quality: 'high',
  }

  constructor(lottiePlayerSettings?: LottiePlayerSettings) {
    this.update(lottiePlayerSettings)
  }

  @bind
  @action
  update(lottiePlayerSettings?: LottiePlayerSettings) {
    if (lottiePlayerSettings) {
      this.settings = lottiePlayerSettings
    }
  }
}
