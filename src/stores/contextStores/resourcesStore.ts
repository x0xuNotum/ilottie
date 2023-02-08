import bind from 'bind-decorator'
import { action, observable } from 'mobx'

export class ResourcesStore {
  onResourcesLoaded?: () => void

  constructor(onResourcesLoaded?: () => void) {
    this.onResourcesLoaded = onResourcesLoaded
  }

  @observable
  name?: string

  @bind
  @action
  setName(name?: string) {
    this.name = name
  }

  dataPromises: Map<string, Promise<unknown>> = observable.map(new Map(), {
    deep: false,
  })

  @bind
  @action
  addPromise(id: string, newPromise: Promise<unknown>) {
    this.dataPromises.set(id, newPromise)
    newPromise.finally(() => {
      this.removePromiseByIndex(id)
    })
  }

  @bind
  @action
  removePromiseByIndex(id: string) {
    this.dataPromises.delete(id)
  }

  @bind
  async resolveAll() {
    return Promise.all(this.dataPromises)
  }
}
