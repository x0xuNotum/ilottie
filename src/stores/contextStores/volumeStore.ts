import bind from 'bind-decorator'
import { action, computed, observable } from 'mobx'

export class VolumeStore {
  @observable
  private _muted: boolean = true

  @observable
  private _volume: number = 0

  @computed
  get muted() {
    return this._muted
  }

  @computed
  get volume() {
    return this._volume
  }

  constructor(muted: boolean) {
    this.setMuted(muted)
  }

  @bind
  @action
  setVolume(value: number) {
    if (value >= 0 && value <= 1.0) {
      this._volume = value
      return true
    }
    return false
  }

  @bind
  @action
  setMuted(value: boolean) {
    this._muted = value
  }
}
