import bind from 'bind-decorator'
import { action, IReactionDisposer, observable, reaction } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import {
  Action,
  ActionTriggerType,
  AudioAction,
  VolumeAnimationFunction,
} from 'schemas/actions'
import { AnimationComponent } from 'schemas/component'
import { StoresContext } from 'stores/contextStores'
import { EventEmitter, ILottieEvent } from 'stores/contextStores/eventEmitter'
import { RunningActionsStore } from 'stores/contextStores/runningActions'
import { VolumeStore } from 'stores/contextStores/volumeStore'
import { iOS } from 'utils/helpers'
import { Deferred, doNotWaitFct, doNotWaitResult, sleep } from 'utils/promise'

interface IAudioPlayer extends React.MediaHTMLAttributes<HTMLAudioElement> {
  data: AnimationComponent
  src: string
  resourcesLoadDeferredObj: Deferred<unknown>
}

@observer
export class AnimationSound extends React.Component<IAudioPlayer> {
  audioElement = React.createRef<HTMLAudioElement>()
  subscriptions: Array<() => void> = []
  @observable.ref
  disposer: IReactionDisposer | null = null

  @observable
  loopCount: number = 0

  @observable
  paused: boolean = true

  @observable
  volumeUpAnimationDuration: number = 0

  @observable
  volumeDownAnimationDuration: number = 0

  @observable
  volumeUpFunction: VolumeAnimationFunction = 'linear'

  @observable
  volumeDownFunction: VolumeAnimationFunction = 'linear'

  defaultVolume = 0
  minVolume = 0
  maxVolume = 1

  static contextType = StoresContext

  cancel: Function | null = null

  get eventEmitter(): EventEmitter {
    return this.context.eventEmitter
  }

  get runningActionsStore(): RunningActionsStore {
    return this.context.runningActionsStore
  }

  get volumeStore(): VolumeStore {
    return this.context.volumeStore
  }

  render() {
    return (
      <audio
        hidden
        preload="auto"
        ref={this.audioElement}
        src={this.props.src}
        onCanPlayThrough={this.onCanPlayThrough}
        onError={this.onCanPlayThrough}
      />
    )
  }

  @bind
  onCanPlayThrough() {
    if (this.props.resourcesLoadDeferredObj.resolve) {
      this.props.resourcesLoadDeferredObj.resolve(true)
    }
  }

  componentDidMount() {
    this.disposer = reaction(
      () => this.volumeStore.muted,
      (muted) => {
        let shouldIncreseVolume = !muted
        const audio = this.audioElement?.current
        if (audio) {
          iOS()
            ? (audio.muted = muted)
            : doNotWaitResult(
                this.changeVolumeLogarithmicly(audio, shouldIncreseVolume, 1000)
              )
        }
      }
    )
    this.subscribeForEvent('play', this.handlePlayAction)
    this.subscribeForEvent('pause', this.handlePauseAction)
    this.audioElement.current?.addEventListener('ended', this.emitComplete)
    this.audioElement.current?.load()
  }

  componentDidUpdate() {
    this.audioElement.current?.removeEventListener('ended', this.emitComplete)
    this.audioElement.current?.addEventListener('ended', this.emitComplete)
  }

  componentWillUnmount() {
    this.unsubscribeFromAllEvents()
    this.audioElement.current?.removeEventListener('ended', this.emitComplete)
    if (this.disposer) {
      this.disposer()
    }
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
    if (!this.audioElement.current) {
      return
    }
    this.resetAnimationsCount()
    this.setPlaybackSpeed(action)
    const shouldIncreseVolume = true
    this.setVolumeTimingFunction(action, shouldIncreseVolume)
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
        if (
          this.audioElement.current?.paused &&
          this.loopCount < action.count
        ) {
          doNotWaitResult(this.playAudio())
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
  resetAnimationsCount() {
    this.setLoopCount(0)
  }

  @bind
  setPlaybackSpeed(action: AudioAction) {
    if (this.audioElement.current && action.playbackSpeed) {
      this.audioElement.current.playbackRate = action.playbackSpeed
    }
  }

  @bind
  @action
  setVolumeTimingFunction(action: AudioAction, shouldIncreseVolume: boolean) {
    if (shouldIncreseVolume) {
      this.volumeUpAnimationDuration = action.volumeUpAnimationDuration
      this.volumeUpFunction = action.volumeUpFunction
    } else {
      this.volumeDownAnimationDuration = action.volumeDownAnimationDuration
      this.volumeDownFunction = action.volumeDownFunction
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
      this.stopPlayback()
      accept()
    }
  }

  @bind
  playAnimationOrComplete(actionCount: number, accept: Function) {
    if (this.loopCount < actionCount) {
      this.incrementAnimationCount()
      doNotWaitResult(this.playAudio())
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
  async playAudio() {
    const audio = this.audioElement.current
    if (!audio) {
      return
    }
    if (audio.paused) {
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'play'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPlay,
          isRunForControl,
          triggerName
        )
      )
      audio.volume = this.defaultVolume
      doNotWaitResult(audio.play())
      if (!this.volumeStore.muted) {
        const shouldIncreseVolume = true
        doNotWaitResult(
          this.graduallyChangeVolumeWithStep(
            this.volumeUpFunction,
            shouldIncreseVolume
          )
        )
      }
    }
  }

  @bind
  async graduallyChangeVolumeWithStep(
    volumeAnimationFunction: VolumeAnimationFunction,
    shouldIncreseVolume: boolean
  ): Promise<void> {
    const audio = this.audioElement?.current
    if (!audio || this.volumeStore.muted) {
      return
    }
    const volumeChangedInstantly = this.changeVolumeInstantlyIfNecessary(
      audio,
      shouldIncreseVolume
    )
    if (volumeChangedInstantly) {
      return
    }
    switch (volumeAnimationFunction) {
      case 'linear': {
        doNotWaitResult(this.changeVolumeLinearly(audio, shouldIncreseVolume))
        return
      }
      case 'logarithmic': {
        doNotWaitResult(
          this.changeVolumeLogarithmicly(audio, shouldIncreseVolume)
        )
        return
      }
      default:
        this.changeVolumeInstantlyIfNecessary(audio, shouldIncreseVolume)
        return
    }

    return
  }

  @bind
  @action
  async changeVolumeLinearly(
    audio: HTMLAudioElement,
    shouldIncreseVolume: boolean
  ) {
    const STEP = shouldIncreseVolume ? 0.05 : -0.05
    const animationDuration = shouldIncreseVolume
      ? this.volumeUpAnimationDuration
      : this.volumeDownAnimationDuration
    const INTERVAL = animationDuration * Math.abs(STEP)
    let volume = audio.volume
    volume += STEP
    while (volume >= this.minVolume && volume <= this.maxVolume) {
      audio.volume = volume
      await sleep(INTERVAL)
      volume += STEP
    }
    return
  }

  @bind
  @action
  async changeVolumeLogarithmicly(
    audio: HTMLAudioElement,
    shouldIncreseVolume: boolean,
    externalAnimationDuration?: number
  ) {
    const N_OF_STEPS = 20
    const SIGN = shouldIncreseVolume ? 1 : -1
    const animationDuration = externalAnimationDuration
      ? externalAnimationDuration
      : shouldIncreseVolume
      ? this.volumeUpAnimationDuration
      : this.volumeDownAnimationDuration
    const INTERVAL = animationDuration / N_OF_STEPS
    // function is y = ln(A + B * x) where y is volume and x is time(ms)
    // A & B - normalization constants, so that y(volume) changes between 0 and 1
    const A = shouldIncreseVolume ? 1 : Math.E
    const B = (SIGN * (Math.E - 1)) / animationDuration
    let time = INTERVAL
    let volume = Math.log(A + B * time)
    while (volume >= this.minVolume && volume <= this.maxVolume) {
      audio.volume = volume
      await sleep(INTERVAL)
      time += INTERVAL
      volume = Math.log(A + B * time)
    }
    return
  }

  @bind
  @action
  changeVolumeInstantlyIfNecessary(
    audio: HTMLAudioElement,
    shouldIncreseVolume: boolean
  ) {
    if (this.volumeUpAnimationDuration === 0 && shouldIncreseVolume) {
      audio.volume = 1.0
      return true
    }
    if (this.volumeDownAnimationDuration === 0 && !shouldIncreseVolume) {
      audio.volume = 0
      return true
    }
    return false
  }

  @bind
  async pause() {
    const shouldIncreseVolume = false
    doNotWaitResult(
      this.graduallyChangeVolumeWithStep(
        this.volumeDownFunction,
        shouldIncreseVolume
      )
    )
    // function execution when awaiting inside loop continues after first await
    // No way to wait until the whole cycle finishes
    await sleep(this.volumeDownAnimationDuration)
    if (this.audioElement?.current) {
      this.audioElement.current.pause()
      this.audioElement.current.currentTime = 0
    }
  }

  @bind
  async handlePauseAction(action: AudioAction) {
    if (!this.audioElement.current) {
      return
    }
    if (!this.audioElement.current.paused) {
      const shouldIncreseVolume = false
      this.setVolumeTimingFunction(action, shouldIncreseVolume)
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'pause'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPause,
          isRunForControl,
          triggerName
        )
      )
      let lottieEvent = {
        type: '__complete' as '__complete',
        components: [this.props.data.name],
        interrupted: true,
        paused: true,
      }
      await this.pause()
      doNotWaitResult(this.eventEmitter.emit(lottieEvent))
    }
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
  stopPlayback() {
    if (this.audioElement.current) {
      this.audioElement.current.pause()
      this.audioElement.current.currentTime = 0
    }
  }
}
