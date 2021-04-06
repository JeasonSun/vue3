// createVNode 创建虚拟节点的核心

import { isArray, isObject, isString, ShapeFlags } from '@vue/shared/src'

// h()
export const createVNode = (type, props, children = null) => {
  // 可以根据type来区分是组件，还是普通的元素

  // 给虚拟节点加一个类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  const vnode = {
    // 一个对象来描述对应的内容， 虚拟节点有跨平台的能力
    __v_isVnode: true,
    type,
    props,
    children,
    component: null,
    el: null, // 稍后会将虚拟节点和真实节点对应起来
    key: props && props.key, // diff算法会用到key
    shapeFlag, // 判断出自己当前的shapeFlag,同时可以知道children的shapeFlag
  }
  normalizeChildren(vnode, children)

  return vnode
}

function normalizeChildren (vnode, children) {
  let type = 0
  if (children === null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.shapeFlag = type | vnode.shapeFlag
}
