import bind from 'bind-decorator'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { Action, ActionTriggerType, AudioAction } from 'schemas/actions'
import { AnimationComponent } from 'schemas/component'
import { NumbersTuple } from 'schemas/helpers'
import { StoresContext } from 'stores/contextStores'
import { EventEmitter, ILottieEvent } from 'stores/contextStores/eventEmitter'
import { ExternalValueStore } from 'stores/contextStores/externalValueStore'
import { RunningActionsStore } from 'stores/contextStores/runningActions'
import { VolumeStore } from 'stores/contextStores/volumeStore'
import {
  Deferred,
  doNotWaitFct,
  doNotWaitResult,
  nextTick,
} from 'utils/promise'
import VideoPlayer from '../VideoPlayer/VideoPlayer'
import BaseAnimationComponent from './BaseAnimationComponent'

interface IVideoPlayer {
  data: AnimationComponent
  src: string
  resourcesLoadDeferredObj: Deferred<unknown>
}

@observer
export class AnimationVideo extends React.Component<IVideoPlayer> {
  subscriptions: Array<() => void> = []
  @observable
  playbackSpeed: number = 1

  @observable
  loopCount: number = 0

  @observable
  paused: boolean = true

  @observable
  seek: boolean = false

  @observable
  normalizedScrollPosition: number = 0

  static contextType = StoresContext

  get eventEmitter(): EventEmitter {
    return this.context.eventEmitter
  }

  get runningActionsStore(): RunningActionsStore {
    return this.context.runningActionsStore
  }

  get volumeStore(): VolumeStore {
    return this.context.volumeStore
  }

  get externalValueStore(): ExternalValueStore {
    return this.context.externalValueStore
  }

  render() {
    return (
      <BaseAnimationComponent data={this.props.data}>
        <VideoPlayer
          src={this.props.src}
          play={!this.paused}
          videoEnded={this.videoEnded}
          videoStarted={this.videoStarted}
          playStateChanged={this.playStateChanged}
          muted={this.volumeStore.muted}
          playbackSpeed={this.playbackSpeed}
          resourcesLoadDeferredObj={this.props.resourcesLoadDeferredObj}
          seek={this.seek}
          // position={this.seek ? this.externalValueStore.value : undefined}
          position={this.seek ? this.normalizedScrollPosition : undefined}
        />
      </BaseAnimationComponent>
    )
  }

  componentDidMount() {
    this.subscribeForEvent('play', this.handlePlayAction)
    this.subscribeForEvent('pause', this.handlePauseAction)
    this.subscribeForEvent('seek', this.handleSeekAction)
  }

  componentWillUnmount() {
    this.unsubscribeFromAllEvents()
  }

  @bind
  unsubscribeFromAllEvents() {
    for (const subscription of this.subscriptions) {
      subscription()
    }
  }

  @bind
  subscribeForEvent<T extends Action>(
    type: string,
    cb: (args: T) => void | Promise<void>
  ) {
    this.subscriptions.push(
      this.eventEmitter.subscribe(this.props.data.name, type, cb)
    )
  }

  @bind
  emitComplete() {
    doNotWaitResult(
      this.eventEmitter.emit({
        type: '__complete',
        components: [this.props.data.name],
        interrupted: false,
      })
    )
  }

  @bind
  async handlePlayAction(action: AudioAction) {
    if (this.seek) {
      this.setSeek(false)
    }
    this.resetAnimationsCount()
    this.setPlaybackSpeed(action)
    let unsubscribe: Function | null = null
    const returnPromise: Promise<void> = new Promise(
      doNotWaitFct(async (accept: Function, _reject: Function) => {
        await this.completeRunningActions()
        unsubscribe = this.eventEmitter.subscribe(
          this.props.data.name,
          '__complete',
          (lottieEvent) =>
            this.completeCallback(action.count, accept, lottieEvent)
        )
        if (this.paused && this.loopCount < action.count) {
          doNotWaitResult(this.play())
          this.incrementAnimationCount()
        }
      })
    )

    returnPromise.finally(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return returnPromise
  }

  @bind
  @action
  setPlaybackSpeed(action: AudioAction) {
    if (action.playbackSpeed) {
      this.playbackSpeed = action.playbackSpeed
    }
  }

  async completeRunningActions() {
    let completeEvent = {
      type: '__complete' as '__complete',
      components: [this.props.data.name],
      interrupted: true,
      paused: false,
    }
    await this.eventEmitter.emit(completeEvent)
  }

  @bind
  completeCallback(actionCount: number, accept: Function, event: ILottieEvent) {
    if (event.interrupted) {
      this.completeInterruptedAction(accept, event)
      return
    }
    this.playAnimationOrComplete(actionCount, accept)
  }

  @bind
  completeInterruptedAction(accept: Function, event: ILottieEvent) {
    if (event.interrupted) {
      // Animation was interrupted by some other action
      // Running action must be stopped
      if (event.paused) {
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            this.props.data.onEnd
          )
        )
      }
      this.setPaused(true)
      accept()
    }
  }

  @bind
  playAnimationOrComplete(actionCount: number, accept: Function) {
    if (this.loopCount < actionCount) {
      this.incrementAnimationCount()
      doNotWaitResult(this.play())
    } else {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onEnd
        )
      )
      accept()
    }
  }

  @bind
  async play() {
    // Need to wait a moment before setting paused back to false, as
    // otherwise the change is too fast(in case of count > 0) and no rerender happens
    await nextTick()
    if (this.paused) {
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'play'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPlay,
          isRunForControl,
          triggerName
        )
      )
      this.setPaused(false)
    }
  }

  @bind
  async handlePauseAction() {
    if (this.seek) {
      this.setSeek(false)
    }
    if (!this.paused) {
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'pause'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPause,
          isRunForControl,
          triggerName
        )
      )
      let event = {
        type: '__complete' as '__complete',
        components: [this.props.data.name],
        interrupted: true,
        paused: true,
      }
      doNotWaitResult(this.eventEmitter.emit(event))
      this.setPaused(true)
    }
  }

  @bind
  resetAnimationsCount() {
    this.setLoopCount(0)
  }

  @bind
  @action
  setLoopCount(value: number) {
    this.loopCount = value
  }

  @bind
  incrementAnimationCount() {
    this.setLoopCount(this.loopCount + 1)
  }

  @bind
  @action
  videoEnded() {
    this.setPaused(true)
    this.emitComplete()
    return
  }

  @bind
  @action
  videoStarted() {
    return
  }

  @bind
  @action
  playStateChanged() {
    return
  }

  @bind
  @action
  setPaused(value: boolean) {
    this.paused = value
  }

  @bind
  handleSeekAction(event: ILottieEvent) {
    this.setNormalizedScrollPosition(event.range)
    this.setSeek(true)
  }

  @bind
  @action
  setSeek(value: boolean) {
    this.seek = value
  }

  @bind
  @action
  setNormalizedScrollPosition(range?: NumbersTuple) {
    // Normalize external value with respect to the current range,
    // so video player does not care about rescaling and always plays from 0 to 1
    if (!range) {
      return this.externalValueStore.value
    }
    const rangeLength = range[1] - range[0]
    this.normalizedScrollPosition = Math.min(
      this.externalValueStore.value / rangeLength,
      1
    )
  }
}
