import bind from 'bind-decorator'
import { Expose, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  ValidateNested,
} from 'class-validator'
import { action, observable } from 'mobx'
import 'reflect-metadata'
import { ContextStore } from 'stores/contextStores'
import { Default, ValidateCoupledChange } from 'utils/validationDecorators'
import {
  Action,
  ActionsTypesDiscriminator,
  ActionTypes,
  LottieAction,
} from './actions'
import { PositionRectangle } from './helpers'

const defaultPositionRectangle = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}

export class AnimationComponent {
  @Expose()
  @IsString()
  @Default('')
  name: string = ''

  @Expose()
  @Default(defaultPositionRectangle)
  @Type(() => PositionRectangle)
  @ValidateNested()
  posRect: PositionRectangle = defaultPositionRectangle

  @Expose()
  @Default(0)
  @IsInt()
  zIndex: number = 0

  @Expose()
  @Default('')
  resource: string = ''

  eventHandlers = [
    'onClick',
    'onSecondClick',
    'onHoverIn',
    'onHoverOut',
    'onShow',
    'onHide',
    'onEnd',
    'onPlay',
    'onPause',
    'onCursorPositionChange',
  ]

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onClick: ActionTypes[] = []

  @Expose()
  @IsArray()
  @ValidateNested()
  @Default([])
  @Type(() => Action, ActionsTypesDiscriminator)
  onSecondClick: ActionTypes[] = []

  @Expose()
  @IsArray()
  @ValidateNested()
  @Default([])
  @Type(() => Action, ActionsTypesDiscriminator)
  onHoverIn: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onHoverOut: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onShow: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onHide: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onEnd: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onPlay: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onPause: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [{ value: LottieAction, name: 'seek' }],
    },
  })
  @ValidateNested()
  @ValidateCoupledChange()
  @Default([])
  onCursorPositionChange: LottieAction[] = []

  @observable
  visible: boolean = false

  @bind
  @action
  setVisibility(value: boolean) {
    this.visible = value
  }

  @Expose()
  @Default(true)
  @IsBoolean()
  fluidFont: boolean = true

  @Expose()
  @Default({})
  style: { [key: string]: string } = {}

  @Expose()
  @Default(true)
  @IsBoolean()
  overflowScroll: boolean = true

  @bind
  parseStringRegexInActions(componentNames: string[]) {
    for (const key in this) {
      if (this.eventHandlers.includes(key)) {
        const actions = this[key as keyof AnimationComponent] as ActionTypes[]
        if (actions && Array.isArray(actions) && actions.length) {
          this.checkActionArrayForStringRegexInComponents(
            actions,
            componentNames
          )
        }
      }
    }
  }

  @bind
  checkActionArrayForStringRegexInComponents(
    actions: ActionTypes[],
    componentsNames: string[]
  ) {
    for (const action of actions) {
      action.extractComponentNamesFromRegex(componentsNames)
    }
  }

  @bind
  setStores(stores: ContextStore) {
    for (const key in this) {
      if (this.eventHandlers.includes(key)) {
        const actions = this[key as keyof AnimationComponent] as ActionTypes[]
        if (actions && Array.isArray(actions) && actions.length) {
          this.setStoresForActions(actions, stores)
        }
      }
    }
  }

  @bind
  setStoresForActions(actions: ActionTypes[], stores: ContextStore) {
    for (const action of actions) {
      action.setStores(stores)
    }
  }
}
