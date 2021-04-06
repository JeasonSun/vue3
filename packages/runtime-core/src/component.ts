import { ShapeFlags } from '@vue/shared/src'
import { PublicInstanceProxyHandlers } from './componentPbulicInstance'

export function createComponentInstance (vnode) {
  const instance = {
    // 组件的实例
    vnode,
    type: vnode.type,
    props: {}, // props attrs 有什么区别  vnode.props
    attrs: {},
    slots: {},
    ctx: {},
    setupState: {}, // 如果setup返回一个对象， 这个对象会作为setupState
    data: {},
    render: null,
    isMounted: false // 表示这个组件是否挂载过
  }

  instance.ctx = { _: instance }

  return instance
}

export function setupComponent (instance) {
  const { props, children } = instance.vnode
  // 根据props解析props 和 attrs， 将其放到instance上
  instance.props = props
  instance.children = children

  // 需要先看下，当前组件是不是有状态的组件， 还是函数组件
  const isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    // 表示现在是一个带状态的组件
    // 调用 当前实例的setup 方法， 用setup的返回值， 填充 setupState和对应的render方法。
    setupStatefulComponent(instance)
  }
}

function setupStatefulComponent (instance) {
  // 1. 代理， 传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  // 2. 获取组件的类型， 拿到组件的setup方法
  const Component = instance.type
  let { setup } = Component
  const setupContext = createSetupContext(instance)
  // ------ 如果没有setup------
  instance.setupState = setup(instance.props, setupContext)
  // -------如果没有render -------
  Component.render(instance.proxy)
}

function createSetupContext (instance) {
  return {
    attrs: instance.attrs,
    // props: instance.props,
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

// instance 表示组件的状态，
// context
// proxy 为了取值方便
