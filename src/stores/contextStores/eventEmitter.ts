import bind from 'bind-decorator'
import { ActionTriggerType } from 'schemas/actions'
import { CursorPositionRectangle, NumbersTuple } from 'schemas/helpers'

interface Events {
  [key: string]: Function[]
}

export interface ILottieEvent {
  type: ActionTriggerType | '__complete'
  components: string | string[]
  interrupted?: boolean
  paused?: boolean
  segments?: NumbersTuple[]
  range?: [number, number]
  position?: CursorPositionRectangle
}

export class EventEmitter {
  public events: Events
  constructor(events?: Events) {
    this.events = events ?? {}
  }

  @bind
  subscribe<T extends ILottieEvent>(
    componentName: string,
    type: string,
    cb: (event: T) => void | Promise<void>
  ) {
    const eventName = `${componentName}.${type}`
    if (this.events[eventName] === undefined) {
      this.events[eventName] = []
    }
    if (!this._callbackAlreadyRigesteredForName(cb, eventName)) {
      this.events[eventName].push(cb)
    }
    return () =>
      // this.events[eventName] &&
      // Justification about using >>> here
      // https://stackoverflow.com/questions/1822350/what-is-the-javascript-operator-and-how-do-you-use-it
      this.events[eventName]?.splice(
        this.events[eventName].indexOf(cb) >>> 0,
        1
      )
  }

  @bind
  unsubscribeAll(componentName: string) {
    for (const eventName in this.events) {
      if (eventName.startsWith(componentName)) {
        this.events[eventName] = []
      }
    }
  }

  private _callbackAlreadyRigesteredForName<T extends ILottieEvent>(
    cb: (event: T) => void | Promise<void>,
    eventName: string
  ) {
    return !!(
      // this.events[eventName] &&
      this.events[eventName]?.find((existingCb) => existingCb === cb)
    )
  }

  public async emit<T extends ILottieEvent>(event: T): Promise<void> {
    let results: Array<Promise<void>> = []
    for (const component of event.components) {
      const eventName = `${component}.${event.type as string}`
      results = results.concat(
        (this.events[eventName] || []).map((fn) => fn(event))
      )
    }
    await Promise.all(results)
    return
  }
}

export const eventEmitter = new EventEmitter()
