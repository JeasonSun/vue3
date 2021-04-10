import { isArray, isObject } from '@vue/shared/src'
import { createVNode, isVnode } from './vnode'

export function h (type, propsOrChildren, children) {
  // console.log(type, propsOrChildren, children)
  const l = arguments.length // 儿子节点 要么是字符串， 要么是数组， 针对的是createVnode

  if (l === 2) {
    // 类型 + 属性、 类型 + 孩子

    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      // propsOrChildren  'hello world'?
      return createVNode(type, propsOrChildren)
    } else {
      // 如果第二个参数不是对象，那一定是孩子
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    } else {
    }
    return createVNode(type, propsOrChildren, children)
  }
}
