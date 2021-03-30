import { isFunction } from '@vue/shared/src'
import { effect, track, trigger } from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operators'

class ComputedRefImpl {
  public _dirty = true // 默认取值时候不要用缓存
  public _value
  public effect
  constructor (getter, public setter) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
          trigger(this, TriggerOpTypes.SET, 'value')
        }
      }
    })
  }

  get value () {
    // 计算属性也要收集依赖
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false
    }

    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value (newValue) {
    this.setter(newValue)
  }
}

// vue2 和 vue3 computed原理是不一样的。
export function computed (getterOrOptions) {
  let getter
  let setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value must be readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
