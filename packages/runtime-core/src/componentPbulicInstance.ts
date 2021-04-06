import { hasOwn } from '@vue/shared/src'

export const PublicInstanceProxyHandlers = {
  get ({ _: instance }, key) {
    const { setupState, props, data } = instance
    if (key[0] === '$') {
      return // 不能访问$开头的变量
    }
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }
    if (hasOwn(props, key)) {
      return props[key]
    }
    if (hasOwn(data, key)) {
      return data[key]
    }
    return
  },
  set ({ _: instance }, key, value) {
    const { setupState, props, data } = instance
    if (hasOwn(setupState, key)) {
      return (setupState[key] = value)
    }
    if (hasOwn(props, key)) {
      return (props[key] = value)
    }
    if (hasOwn(data, key)) {
      return (data[key] = value)
    }
  }
}
