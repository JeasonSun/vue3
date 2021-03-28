import { hasChanged, isArray, isObject } from '@vue/shared/src'
import { track, trigger } from './effect'
import { TrackOpTypes, TriggerOpTypes } from './operators'
import { reactive } from './reactive'

export function ref (value) {
  // 将普通类型变成一个对象
  return createRef(value)
}

// ref和reactive的区别， reactive内容采用proxy， ref中内部使用的defineProperty

export function shallowRef (value) {
  return createRef(value, true)
}

const convert = val => (isObject(val) ? reactive(val) : val)
// beta版本之前的版本ref就是个对象，由于对象不方便扩展 改成了类。
class RefImpl {
  public _value // 表示声明了一个_value属性，但是没有赋值
  public __v_isRef = true
  constructor (public rawValue, public shallow) {
    // 参数中前面增加修饰符，表示此属性放到了实例上
    this._value = shallow ? rawValue : convert(rawValue) //如果是深度，需要把里面的都变成响应式的。
  }

  // 类的属性访问器 转es5会变成defineProperty
  get value () {
    // 代理
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value (newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(this, TriggerOpTypes.SET, 'value', newValue)
    }
  }
}

function createRef (rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow)
}

class ObjectRefImpl {
  public __v_isRef = true
  constructor (public target, public key) {}
  get value () {
    return this.target[this.key]
  }

  set value (newValue) {
    this.target[this.key] = newValue
  }
}

export function toRef (target, key) {
  return new ObjectRefImpl(target, key)
}

export function toRefs (object) {
  // object可能传递的是一个数组 或者对象
  const ret = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}
