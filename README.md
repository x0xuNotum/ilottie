# iLottie

iLottie is a framework made to create complex interactive animations. Under the hood it operates images, videos and [Lottie animations](https://github.com/airbnb/lottie-web) to create one nice interactive experience.

## Who is this project for?

iLottie is intended to be used by designers and programmers who are already familiar with Lottie.
<hr/>

## Table of Contents
[Intro](#ilottie)

[Installation](#installation)

[Usage examples](#usage-examples)

[Content of YAML file](#content-of-yaml-file)

<hr/>

## Installation
*instructions for installation will go here*
<hr/>

## Usage examples
iLottie uses a single yaml configuration file to do its magic.

Here is an example of ILottie component usage:
```js
  <ILottie
    configSrc={path_to_config}
    config={config_file}
    externalValue={this.externalValue}
    language={'de'}
    muted={false}
    externalValueIsNormalized={true}
    onResourcesLoaded={this.onResourcesLoaded}
    onExternalValueOutOfRange={this.onExternalValueOutOfRange}
    onExternalTrigger={this.onExternalTrigger}
  />
```

`configSrc`: path to a yaml config file

`config`: string or object with iLottie config

`externalValue`: numeric value that is used to control the flow of animations. See more in 
[Yaml file examples](#content-of-yaml-file)

`language`: a language prefix that will be used when parsing content of YAML file. Can be used when working on a multilingual project: markup (html) resources names should contain 
`%language%` in their names. Then this string will be replaced with a specified lang prefix. This lets the user of the library to create markup files for different languages.

`muted`: mute control for all audios and videos used in the animation.

`externalValueIsNormalized`: specified if the external value provided is already normalized to 1. Defaults to `true`. Internally external value is always normalised, hence if you want to use arbitrary external values bigger than 1 for control of you animation, specify false in this field.

`onResourcesLoaded`: a callback to call when all resources specified in the YAML file are loaded. Might be useful for displaying a spinning loader while the resources are loading.

`onExternalValueOutOfRange`: a callback to call when external value leaves the total range specified in YAML file.

`onExternalTrigger`: a callback to call when externalTrigger action is used.(see more in [actions section](#action)). This callback shouldbe a function that expects 2 parameters: an eventName, that would let you define which action has called the callback, and an extra options object with any additional parameters. This could go as follows: you specify externalTrigger action somewhere in the YAML file

```yaml
- type: externalTrigger
  eventName: showElement
  options: 
    id: some_id
```

And in your callback you capture that event name, check what it is and execute your code:

```js
onExternalTrigger(eventName, options) {
  if (eventName === 'showElement') {
    /// your code goes here
  }
}
```

### Example of YAML file

```yaml
surfaceWidth: 1000
surfaceHeight: 1000
externalValueLimit: 1000
languages: ['en', 'de']

onExternalValue:
  - range: [0, 500]
    onRangeEnter:
      - type: show
        components: [background]
        animationFunction: ease-in
        animationDuration: 1000
      - type: show
        components: [lottie11]
        animationFunction: ease-in
        animationDuration: 1000
    onRangeLeave:
      - type: hide
        components: [background, lottie11]
  - range: [500, 1000]
    onRangeEnter:
      - type: show
        components: [lottie12]
    onCoupledChange:
      - type: seek
        components: [lottie12]
resources:
  - name: background
    type: svg
    src: https://picsum.photos/1000/1000?grayscale&blur=2
  - name: lottie 1
    type: lottie
    src: animations/myLottieAnimation.json
  - name: lottie 2
    type: lottie
    src: animations/myLottieAnimation2.json
  - name: pointRed
    type: svg
    src: test_images/pointRed.svg
  - name: pointGreen
    type: svg
    src: test_images/pointGreen.svg
  - name: pointWithImage
    type: png
    src: https://picsum.photos/200/300
  - name: cookie_font
    type: font
    src: Cookie-Regular.ttf
    fontFace: {
      font-family: cooky,
      font-weight: bold
    }
components:
  - name: background
    posRect: {x: -100, y: -100, width: 1200, height: 1200}
    zIndex: 0
    resource: background
  - name: stopLottie
    posRect: {x: 900, y: 900, width: 100, height: 100}
    zIndex: 2
    resource: pointRed
    onClick:
      - type: pause
        delay: 0
        components: [lottie11]
    onHoverIn:
      - type: setStyles
        delay: 0
        components: [stopLottie]
        styles: {
          transform: scale(1.1),
          transition: transform 0.3s ease-in
        }
    onHoverOut:
      - type: setStyles
        delay: 0
        components: [stopLottie]
        styles: {
          transform: scale(1),
          transition: transform 0.3s ease-in
        }
  - name: startLottie
    posRect: {x: 0, y: 900, width: 100, height: 100}
    zIndex: 2
    resource: pointGreen
    onClick:
      - type: play
        delay: 0
        count: 2
        components: [lottie11]
    onHoverIn:
      - type: setStyles
        delay: 0
        components: [startLottie]
        styles: {
          transform: scale(1.1),
          transition: transform 0.3s ease-in
        }
    onHoverOut:
      - type: setStyles
        delay: 0
        components: [startLottie]
        styles: {
          transform: scale(1),
          transition: transform 0.3s ease-in
        }
  - name: lottie11
    posRect: {x: 0, y: 0, width: 500, height: 500}
    zIndex: 1
    resource: lottie 1
    onShow:
      - type: show
        delay: 1000
        components: [stopLottie]
        animationFunction: ease-in
        animationDuration: 1000
        playingTurn: playWithPrevious
      - type: show
        delay: 0
        components: [startLottie]
        animationFunction: ease-in
        animationDuration: 1000
        playingTurn: playAfterPrevious
    onEnd:
      - type: show
        delay: 0
        components: [pointWithImage]
        animationFunction: ease-in
        animationDuration: 1000
        playingTurn: playWithPrevious
  - name: lottie12
    posRect: {x: 0, y: 0, width: 500, height: 500}
    zIndex: 1
    resource: lottie 2
  - name: pointWithImage
    posRect: {x: 0, y: 0, width: 100, height: 100}
    zIndex: 1
    resource: pointWithImage
```

### Content of YAML file

On the highest level, configuration file contains the following sections (more details below):


- `surfaceWidth`: number; defines the width of the interactive area. Relative units: all the sizes for all the components will be scaled with respect to this value.

Defaults to `1000`.
- `surfaceHeight`: number; same as surfaceWidth, but for height.

Defaults to `1000`.
- `externalValueLimit`: number; defines the maximum for the external value. If the external value(e.g. scroll position) is changing, this number sets the maximum of those changes. `Relative units!` This number represents relative maximum for current animation. See more in [onExtenralValue](#onExtenralValue).

Defaults to `1000`.
- `languages`: defines array of languages used in the current project. These languages are used when selecting the correct `markup` resource for multi-language projects. If non-empty array is specified, a certain files naming convention must be followed for markup resources([see below](#resources)).

Defaults to `[]`.
- `onExternalValue`: this section describes, what [actions](#action) must be triggered for certain external trigger values. The external trigger could be a scroll position or any other meaningful parameter, that is used to control animations from outside of iLottie component.

Defaults to `[]`.
- `resources`: contains the list of all the content files (images, Lottie animations `.json` files) used for the iLottie animation.

Defaults to `[]`.
- `components`: describes all the components participating in the iLottie animation, their behavior and interactions.

Defaults to `[]`.

<br/>
<br/>
<br/>

### **onExtenralValue**
This section contains a list of objects of the following shape:
```yaml
  range: [0, 500]
  onRangeEnter: <list of actions>
  onRangeLeave: <list of actions>
  onCoupledChange: <list of actions>
```

You need to have at least one item in this section in order to display anything.

This section can be used for 2 purposes: control flow of iLottie animation from outside and to define initial animation state(see below).

`Range` is an array of two numbers `>= 0`. 

Defaults to `[0, 10000]`.

`onRangerEnter`: defines all the [actions](#action), that will be executed whenever external trigger value *enters* the specified range.

Defaults to `[]`.

`onRangerLeave`: defines all the [actions](#action), that will be executed whenever external trigger value *leaves* the specified range.

Defaults to `[]`.

`onCoupledChange`: defines all the [actions](#action), that will be executed, whenever external trigger value *changes* within the specified range. Currently only actions of type **seek** are supported.

Defaults to `[]`.

Default value for the external trigger is `0`. If your animation is static(does not depend on scroll position or other external trigger), you still need to include one `onExternalValue` section to define what components should be shown on load. To do so, it's enough to include one section with range `[0, N]` where N is any number `>=0` (see Example 1).

**Example 1** Simply show the background, when external value enters range [0, 1000]. Can be used to show backgrond on load.
```yaml
- range: [0, 1000]
  onRangeEnter:
    - type: show
      components: [background]
```

**Example 2** In this example we assume, that external value changes. When external value is within [0, 500], show background1. When external value is within [500, 1000], show background2. `Note hiding background in onRangeLeave section`.
```yaml
- range: [0, 500]
  onRangeEnter:
    - type: show
      components: [background1]
  onRangeLeave:
    - type: hide
      components: [background1]
- range: [500, 1000]
  onRangeEnter:
    - type: show
      components: [background2]
  onRangeLeave:
    - type: hide
      components: [background2]
```


**Example 3** When entering range [500, 1000], show lottie animation and play it while scrolling(assuming, external value is scroll progress). See more about `seek` action in [actions](#action).
```yaml
- range: [50, 1000]
  onRangeEnter:
    - type: show
      components: [animation]
  onRangeLeave:
    - type: hide
      components: [animation]
  onCoupledChange:
    - type: seek
      components: [animation]
      segments: [[0, 150]]
```

<br/>
<br/>
<br/>

### **resources**
Describes all the content that is used for the current animation. Contains list of objects of the following shape:
```yaml
  - name: <name_of_content>
    type: <type of content>
    src: <path_to_the_content>
    fontFace: <object_with_font_face_rules>
```

All of the fields are **required**.

`name` is a string containing name of the content. **It must be unique**. Content is referenced from "components" section. Multiple components can be created for each of the content files.

`type` describes type of the content. The following types are currently supported: `svg`, `png`, `jpg`, `mp3`, `mp4`, `markup`(html), `font`, `lottie`. This field must be specified carefully, as the kinds of actions possible for `images` and `lottie` animations are different and are defined by this field.

`src` is a path to the content. Can be either relative to `public` folder of this repository or absolute external URL.

_For `markup` resource type only:_

There are proejcts that are targeting multilingual audience. In such projects one might use different `markup` files for deifferent languages. Then the animation would be fully adaptive to the needs of end-user.

If non-empty `languages` array was specified([see above](#content-of-yaml-file)), for each of the languages in that array there should be a resource file present in the corresponding folder. The name of the file should contain language prefix(one of the prefixes in `languages` array). Then in the YAML file you should refer to this group of files as `name_of_the_file_%language$.html`, where `%language%` will be replaced by iLottie to one of the language prefixes. For more details, see Example 3 below.

**Example 1:** relative path: `public` folder contains an `images` folder that contains file `pointGreen.svg`
```yaml
  - name: pointGreen
    type: svg
    src: images/pointGreen.svg
```

**Exampe 2:** external URL
```yaml
  - name: pointWithImage
    type: png
    src: https://picsum.photos/200/300
```
<br/>
<br/>
<br/>

**Example 3:** There should be 2 files named test_en.html and test_de.html in the public folder. iLottie will automatically choose the right file depending on the language preferences.
```yaml
languages: ['en', 'de']
resources:
  - name: test_markup
    type: markup
    src: test_%language%.html
```

`fontFace` contains object with CSS-rules defining font-face rules. Can only be used with `font` resource type.

### **components**
The heart and soul of the YAML file. Describes all the components that are part of the current iLottie animation.

This section contains list of objects with the following properties:
```yaml
  name: <name_of_component>
  posRect: { x: 0, y: 900, width: 100, height: 100 }
  zIndex: 1
  resource: <name_of_content>
  onClick: <list_of_actions>
  onSecondClick: <list_of_actions>
  onHoverIn: <list_of_actions>
  onHoverOut: <list_of_actions>
  onShow: <list_of_actions>
  onHide: <list_of_actions>
  onPlay: <list_of_actions>
  fluidFont: true
  style: <css_rules>
  overflowScroll: true
  fontFace: <font_face_description>
```

`name` and `content` are **required** in order to create a visible component.

`name` is the name of the component. Must be unique within `components` section.

`posRect` defines size and position of the component. These values are scaled with respect to [surfaceWidth](#content-of-yaml-file) and [surfaceHeight](#content-of-yaml-file). For any visual component(image, animation, video, markup) this property has to be set, otherwise dimensions of the component will be `0`.

Defaults to `{ x: 0, y: 0, width: 0, height: 0 }`.

The origin (0, 0) is in the top-left corner, with `Y axis` pointing down and `X axis` pointing to the right.

`x` and `y` can be negative as well as go higher than the `surfaceWidth` and `surfaceHeight` values.

<br/>

**Example**
Let's say we have defined `surfaceWidth: 1000` and `surfaceHeight: 1000`.

This value of `posRect` defines a square taking `10%` of the container's height and width positioned at the origin - top-left corner:
```
  posRect: {x: 0, y: 0, width: 100, height: 100}
```

#### "Why do I need values below 0 or higher than surfaceWidth/surfaceHeight anyway?"
To create consistent experience across different screen sizes. 
The safety area of iLottie (defined by `surfaceWidth` and `surfaceHeight`) is always fully visible. However, if the screen aspect ratio is different from the one set by `surfaceWidth` and `surfaceHeight`, there might be empty borders on the sides of iLottie component.
In this case you can create a high-resolution background image that goes beyond the borders of iLottie animation safety area. Then the user's screen will not be empty on the sides, and the animation will remain always visible across different screens.
<br/>
<br/>

`zIndex`: defines z-index of the component. You can define stack order of the components in your animation.

Defaults to `0`.
<br/>
<br/>

`content`: name of corresponding content. This field must match one of the content names inside `resources` section.

<br/>

**Example:** note that the content's `name` and the component's  `content` are the same
```yaml
resources:
  - name: background
    type: png
    src: images/background.png
components:
  - name: mainBackground
    posRect: {x: -100, y: -100, width: 1200, height: 1200}
    zIndex: 0
    resource: background
```
<br/> 

 `onClick`: contains a sequence of actions that must be executed when the component is clicked. Can be combined with `onSecondClick` to achieve *toggle* effect, e.g. show another component on first (odd) click and then hide that other component on second (even) click.

 Defaults to `[]`.

<br/> 

  `onSecondClick`: contains a sequence of actions that must be executed when component is clicked for the second (even) time.

 Defaults to `[]`.

<br/> 

  `onHoverIn`: contains a sequence of actions that must be executed when component is moused over, i.e. cursor is positioned within the boundaries of the component. Can be combined with `onHoverOut`.

 Defaults to `[]`.

<br/> 

  `onHoverOut`: contains a sequence of actions that must be executed when the cursor leaves the boundaries of the component.

 Defaults to `[]`.

<br/> 

  `onShow`: contains a sequence of actions that must be executed when component is shown.

 Defaults to `[]`.


**Important note:** actions in this list are executed immediately after the `show` action for the component is executed, **without waiting** until the animation is played to the end. So, if some action must be performed **after** the `show` animation is finished aka component is fully in view, `delay` must be added (see more about the delay below in the [action](#action) section).

**Example 1:** Imagine we have a `lottieAnimation` component that was revealed through the `show` action with the duration of `1000ms`. The `lottieAnimation` will start to `play` immediately after the `show` action was executed, i.e. animation will be already playing **while** it is fading in.

```yaml
components:
  - name: lottieAnimation
      posRect: { x: 0, y: 0, width: 1000, height: 1000 }
      zIndex: 3
      resource: lottieAnimation
      onShow:
        - type: play
          components: [lottieAnimation]
```

**Example 2:** Imagine we want to hide element **after** it was shown. If we used `onHide` action without a delay, we would never see the component appear, as the `hide` action would be called immediately after the `show`. Hence, a delay must be added(`>=` than the duration of `show` action).

```yaml
components:
  - name: blinkingButton
    posRect: { x: 0, y: 0, width: 100, height: 100 }
    zIndex: 1
    resource: blinkingButton
    onShow:
      - type: hide
        components: [blinkingButton]
        delay: 1000
```

<br/> 

  `onHide`: contains a sequence of actions that must be executed when component is hidden.

 Defaults to `[]`.

  Same rules as for `onShow` apply: if the desired action must be executed after the `hide` action is finished, a `delay` must be added.

<br/> 

  `onPlay`: contains a sequence of actions that must be executed when component has started playing a Lottie animation. Can be applied to `lottie` components only.

 Defaults to `[]`.

<br/> 

  `style`: contains set of css styles for the current component. Should be used with caution if styles are defined using classes, as class names loaded from YAML file are absolute(no CSS modules used). Hence, name collision is possible. Only use classes, if usage of HTML tags is not sufficient (see example below).
  
  It is possible to use media queries inside `style` object. Mind that unlike regular CSS, media queries rules should be placed inside tag- or class-based CSS ruleset(see example below).

 Defaults to `{}`.

  `fluidFont`: boolean. Meant to be used with *markup* resource type(html). Defines, whether the font should scale proportionally for the current component for different screen size. Only works, if font-size is set in *em* units.

 Defaults to `true`.

  `overflowScroll`: boolean. Meant to be used with *markup* resource type(html). If set to *true*, `overflow: scroll` will be set for the current markup component (i.e. scrollbar will appear, if text content overflows size of the component).

 Defaults to `true`.

  `fontFace`: string, defining css font-face. Should be used on component with `font` resource type. Not needed unless you want to define font-families yourself.

 Defaults to `''`.


**Example**. Note how for google-font we don't need to define font-face and can use the font right away. This is not the case for the "Cookie" font: without fontFace definition it can't be used.
  ```yaml
  resources:
    - name: background
      type: png
      src: path/to/background.png
    - name: cookie-font
      type: font
      src: path/to/font.ttf
    - name: some-google-font
      type: font
      src: https://www.path/to/font

  components:
    - name: background
      posRect: {x: 0, y: 0, width: 400, height: 400}
      zIndex: 2
      resource: background
      fluidFont: true
      overflowScroll: true
      style: {
        div: {
          padding: '2rem',
          line-height: 2,
          "@media screen and (max-width: 600px)": {
            color: red
          },
          "@media screen and (min-width: 600px)": {
            color: green
          }
        },
        '.my-class': {
          color: 'red',
          font-family: "Google font"
        },
        p: {
          font-size: '2em',
          font-family: 'Cookie'
        }
      }
    - name: GoogleFont
      resource: some-google-font
    - name: CookieFont
      resource: cookie-font
      fontFace: "@font-face {
        font-family: 'Cookie';
        src: url('/Cookie-Regular.ttf') format('truetype');
        font-weight: 'normal';
        font-style: 'normal';
      }"
  ```

<br/>
<hr/>

### Action
Actions define what happens to each of your components. Whether you want to show or hide a component, play a Lottie animation or add some styles to one of your components - you need to define an action for that.

Every action is an object of the following shape:
```yaml
  type: hide
  components: [background]
  delay: 1000
  playingTurn: playWithPrevious
  styles: {}
  animationFunction: ease-in
  animationDuration: 0
  segments: [[0, 100]]
  count: 1
  playbackSpeed: 2
  volumeUpFunction: linear
  volumeUpAnimationDuration: 1000
  volumeDownFunction: logarthmic
  volumeDownAnimationDuration: 2000
  eventName: hideFactual
  options: 
    id: some id
```
<br/>

`type` and `components` fields are **required**.

`type`: defines the type of action, i.e. what exactly will happen to the component. Currently the following action types are supported:
  - show: reveals the component that was not visible(fade in)
  - hide: hides the component(fade out)
  - play: plays the Lottie animation. For `lottie`, `mp3` and `mp4` content types
  - pause: stops the Lottie animation. For `lottie`, `mp3` and `mp4` content types
  - seek: plays the Lottie animation along with external value changes(e.g. on scroll). Right now only `lottie` content is supported.
  - setStyles: updates styles of the component.
  - externalTrigger: calls a callback passing specified eventName and options object. Can 
  be used to achieve any sort of side effect at desired time of animation flow

<br/>

`components`: array of the components that are the targets of the current action. If you want to perform an action on the same component the action is defined for, add the component itself in the list.

**Example:** This action shows 3 different button components with duration of 300 ms and delay of 500ms.
```yaml
- type: show
  components: [button1, button2, myFancyButton]
  delay: 500
  animationDuration: 300
  animationFunction: ease-in
```
<br/>

`delay`: delay before the start of animation in milliseconds.

Defaults to `0`.

<br/>

`playingTurn`: defines whether the action should be executed together with the previous action in the list or after the previous action is finished. Accepts 2 values: `playWithPrevious` and `playAfterPrevious`. Always refers to the previous action in the list. By changing this field and order of actions in the list, various desirable results can be achieved.

Defaults to `playWithPrevious`.


**Example:** this list of actions shows `button1` and `button2` components at the same time, and then shows two more buttons `button3` and `button4` after the first 2 are fully shown.

```yaml
  - type: show
    components: [button1, button2]
    animationDuration: 300
    animationFunction: ease-in
    playingTurn: playWithPrevious
  - type: show
    components: [button3]
    delay: 300
    animationDuration: 300
    animationFunction: ease-in
    playingTurn: playAfterPrevious
  - type: show
    components: [button4]
    animationDuration: 300
    animationFunction: ease-in
    playingTurn: playWithPrevious
```

<br/>

`style`: **can be used only with `setStyles` action type!**. Contains an object with regular CSS properties. 

Defaults to `{}`.

**Example**
```yaml
- type: setStyles
  components: [button]
  styles: {
    transform: scale(1.1),
    transition: transform 0.3s ease-in
  }
```

<br/>

`animationFunction`: **can be used only with `show` and `hide` action types!**. Defines [transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) .

Defaults to `ease-in`.

<br/>

`animationDuration`: **can be used only with `show` and `hide` action types!**. Defines duration of the animation in milliseconds.

Defaults to `0`.

<br/>

`segments`: **can be used only with `play` and `seek` action type!**. Contains list of Lottie animation segments to play. Each segment is also a list of 2 values, representing the start and the end (the first and the last frame) of the animation fragment.

Defaults to `[[0, nOfFrames]]`: If `segments` field is missing, animation is played from the first to the last frame.

**Example:** this action would play a corresponding Lottie animation from frame 80 to frame 120 and then play the same frames backwards.

```yaml
- type: play
  components: [lottieAnimation]
  segments: [[80, 120], [120, 80]]
  playingTurn: playAfterPrevious
```

<br/>

`count`: **can be used only with `play` action type!**. Defines number of times the animation must be played. Accepts `Infinity`.

Defaults to `1`. 
Must be used carefully: if you want to execute another action with `playingTurn: playAfterPrevious` after `play` action with `count >= 1`, this next action will start **only** after the animation is played `count` times. If `count: Infinity` is used, the next action will be executed **only if** the playing animation is paused by some other action, otherwise it will play forever and the next action will never be executed.

**Example 1:** `play` action is played once, then the next `hide` action is executed. Note that setting `count: 1` is optional, as it's the default value

```yaml
- type: play
  components: [lottieAnimation]
  count: 1
- type: hide
  components: [lottieAnimation]
  delay: 500
  playingTurn: playAfterPrevious
```

**Example 2:** `play` action is played three times, then the next `hide` action is executed.

```yaml
- type: play
  components: [lottieAnimation]
  count: 3
- type: hide
  components: [lottieAnimation]
  delay: 500
  playingTurn: playAfterPrevious
```

**Example 3:** `play` action is played infinitely. The next `hide` action will not be executed until the `lottieAnimation` is stopped from some other action in your config file.

```yaml
- type: play
  components: [lottieAnimation]
  count: Infinity
- type: hide
  components: [lottieAnimation]
  delay: 500
  playingTurn: playAfterPrevious
```

<br />

`playbackSpeed`: Sets the playback speed for components of `mp4`, `mp3` and `lottie` resource types. Defaults to `1`.

<br />

`volumeUpFunction`: **can be used only with `play` action type for `mp3` audio resources!** 

Defines the volume profile at the beginning of the playback. Accepted values: `linear` and `logarithmic`.
To accomplish the desired effect must be used in combination with `volumeUpAnimationDuration`.

<br />

`volumeUpAnimationDuration`: **can be used only with `play` action type for `mp3` audio resources!** 

Defines how long the volume increase will take.

<br />

`volumeDownFunction`: **can be used only with `pause` action type for `mp3` audio resources!** 

Defines the volume profile at the end of the playback. Accepted values: `linear` and `logarithmic`.
To accomplish the desired effect must be used in combination with `volumeDownAnimationDuration`.

<br />

`volumeDownAnimationDuration`: **can be used only with `pause` action type for `mp3` audio resources!** 

Defines how long the volume decrease will take.

## Contributing
Do we even need contributors?

## Credits
[dar0n](https://github.com/Dar0n)
[FibHeap](https://github.com/FibHeap)

## License
licence information
