import '!style-loader!css-loader!video.js/dist/video-js.css'
import bind from 'bind-decorator'
import classnames from 'classnames'
import * as mime from 'mime-types'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import { Deferred } from 'utils/promise'
import videojs from 'video.js'
import './VideoPlayer.css'
import classes from './VideoPlayer.module.css'

declare global {
  // eslint-disable-next-line
  namespace JSX {
    interface IntrinsicElements {
      'video-js': any
    }
  }
}

interface IPlayOnlyProps extends videojs.PlayerOptions {
  className?: string
  play?: boolean
  videoEnded?: () => void
  videoStarted?: () => void
  playStateChanged?: (value: boolean, position: number) => void
  playbackSpeed: number
  resourcesLoadDeferredObj: Deferred<unknown>
  seek: boolean
  position?: number
  playButton?: HTMLElement
}

export class DefaultPlayButton extends React.Component {
  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20.182 24.667"
        className={classnames(classes['player-button-default'])}
      >
        <path
          fill="#fff"
          d="M11.907.7a.5.5 0 0 1 .853 0L24.2 19.421a.5.5 0 0 1-.427.761H.892a.5.5 0 0 1-.427-.761z"
          opacity="0.5"
          transform="translate(20.182) rotate(90)"
        />
      </svg>
    )
  }
}

@observer
export class VideoPlayer extends React.Component<IPlayOnlyProps> {
  videoElement: HTMLVideoElement | null = null
  videoElementWrapperRef = React.createRef<HTMLDivElement>()

  videoJs: videojs.Player | null = null

  textTracks: { [key: string]: videojs.TextTrackOptions } = {}
  seeking: boolean = false
  currentTimeToSet: number = -1

  @observable
  showPlayButton = false

  render() {
    const playButton = this.props.playButton ?? <DefaultPlayButton />

    return (
      <div
        data-vjs-player
        data-simons-changes
        className={classnames(classes['player-wrapper'], this.props.className)}
        ref={this.videoElementWrapperRef}
      >
        {this.showPlayButton && (
          <div
            className={classnames(classes['player-button-wrapper'])}
            onClick={this.playVideo}
          >
            {playButton}
          </div>
        )}
        <video
          ref={(node) => (this.videoElement = node)}
          crossOrigin="anonymous"
          playsInline={true}
          preload="auto"
        />
      </div>
    )
  }

  componentDidMount() {
    this.initPlayer()
  }

  @bind
  initPlayer() {
    if (!this.videoElement) {
      console.error('Video Element does not exist')
      return
    }

    let src = this.props.src ?? ''
    this.videoJs = videojs(this.videoElement, {
      autoplay: this.props.play,
      sources: [
        {
          src: src,
          type: mime.lookup(src) || 'video/mp4',
        },
      ],
      muted: this.props.muted,
      loop: false,
      playsInline: true,
      controls: this.props.controls,
      poster: this.props.poster,
      errorDisplay: false,
      preload: 'auto',
      html5: {
        nativeTextTracks: false,
        vhs: {
          overrideNative: false,
        },
      },
    } as any)
    this.videoJs.on('pause', () => this.videoOnPause())
    this.videoJs.on('play', () => this.videoOnPlay())
    this.videoJs.on('timeupdate', () => this.videoOnProgress())
    this.videoJs.on('ended', () => this.videoOnEnded())
    this.videoJs.on('loadedmetadata', () => this.canPlayThrough())
    this.videoJs.on('error', () => this.canPlayThrough())
    this.videoElement?.addEventListener('seeked', () => {
      if (this.currentTimeToSet === -1) {
        this.seeking = false
      } else {
        const newCurrentTime = this.currentTimeToSet
        this.currentTimeToSet = -1
        this.videoJs?.currentTime(newCurrentTime)
      }
    })
  }

  async componentDidUpdate(prevProps: IPlayOnlyProps) {
    if (this.props.src !== prevProps.src && this.props.src) {
      this.videoJs?.src(this.props.src)
    }
    if (this.props.play && !prevProps.play) {
      await this.playVideo()
    }
    if (!this.props.play && prevProps.play) {
      await this.videoJs?.pause()
      this.videoJs?.currentTime(0)
    }
    if (this.props.muted !== prevProps.muted) {
      this.videoJs?.muted(!!this.props.muted)
    }
    if (this.props.playbackSpeed !== prevProps.playbackSpeed) {
      this.videoJs?.playbackRate(this.props.playbackSpeed)
    }
    if (this.props.seek && this.props.position !== prevProps.position) {
      this.scrollPlay()
    }
  }

  @bind
  async playVideo() {
    try {
      await this.videoJs?.play()
      runInAction(() => {
        this.showPlayButton = false
      })
    } catch (e) {
      runInAction(() => {
        this.showPlayButton = true
      })
    }
  }

  @bind
  canPlayThrough() {
    if (this.props.resourcesLoadDeferredObj.resolve) {
      this.props.resourcesLoadDeferredObj.resolve(true)
    }
  }

  componentWillUnmount() {
    if (!this.videoJs) {
      return
    }
    this.videoJs.dispose()
    this.videoJs = null
    if (this.videoElement) {
      while (this.videoElement.firstChild) {
        this.videoElement.removeChild(this.videoElement.firstChild)
      }
    }
    this.videoElement = null
  }

  videoOnPause(): void {
    if (!this.videoJs) {
      return
    }
    if (this.videoJs.seeking()) {
      return
    }
    if (this.props.playStateChanged) {
      this.props.playStateChanged(false, this.videoJs.currentTime())
    }
  }

  videoOnPlay(): void {
    if (!this.videoJs) {
      return
    }
    if (this.videoJs.currentTime() === 0) {
      this.videoJs.currentTime(0)
    }
    if (this.props.playStateChanged) {
      this.props.playStateChanged(true, this.videoJs.currentTime())
    }
    if (this.props.videoStarted) {
      this.props.videoStarted()
    }
  }

  videoOnProgress(): void {
    if (!this.videoJs) {
      return
    }
  }

  videoOnEnded(): void {
    if (this.props.videoEnded) {
      this.props.videoEnded()
    }
  }

  @bind
  scrollPlay() {
    if (this.props.position !== undefined && this.videoJs) {
      const newCurrentTime = this.props.position * this.videoJs.duration()
      if (!this.seeking) {
        this.seeking = true
        this.currentTimeToSet = -1
        if (!isNaN(newCurrentTime)) {
          this.videoJs.currentTime(newCurrentTime)
        }
      } else {
        this.currentTimeToSet = newCurrentTime
      }
    }
  }
}

export default VideoPlayer
