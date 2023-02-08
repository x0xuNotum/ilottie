import { observable, action, computed } from 'mobx'
import bind from 'bind-decorator'

export class ExternalValueStore {
  @observable
  private _value: number = 0
  @observable
  private _maxValue: number = 0

  @bind
  @action
  initialize(newMaxValue: number, alreadyNormalized?: boolean) {
    if (alreadyNormalized) {
      this._maxValue = 1
    } else {
      this._maxValue = newMaxValue
    }
  }

  @bind
  @action
  setValue(newValue: number) {
    if (newValue !== this._value) {
      this._value = newValue
    }
  }

  @computed
  get value() {
    return this.normalize(this._value)
  }

  @bind
  normalize(value: number) {
    return value / this._maxValue
  }
}

export const externalValueStore = new ExternalValueStore()
