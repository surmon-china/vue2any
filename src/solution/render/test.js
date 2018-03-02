
const esprima = require('esprima')
const estraverse = require('estraverse')
const escodegen = require('escodegen')
// const parses = require('./parses')
// const parseKeys = Object.keys(parses)
// console.log(parses, parseKeys)

let renderFn = `[_ssrNode("<div id=\\"app\\""+(_ssrAttr("show", !PHPDATA.show.aaa))+">")]`
// console.log(renderFn)
// console.log(esprima)
// console.log(estraverse)
// console.log(escodegen)

const ast = esprima.parse(renderFn, { sourceType: 'script' })
console.log('ast', ast)
console.log('------------------')

const parseFunctionParams = node => {
  if (node.right.type === 'CallExpression') {
    node.right.arguments = node.right.arguments.map(arg => {
      if (arg.type === 'UnaryExpression') {
        console.log('----------')
        return {
          type: "Literal",
          value: "ppppppp"
        }
      } else {
        return arg
      }
    })
  }
  return node
}

const parseCallExpression = node => {
  // console.log('解析函数', node)
  // const fnName = node.callee.name
  // if (parseKeys.includes(fnName)) {
  //   node = parses[fnName](node)
  // }
  return node
}

// 解析成员表达式
const parseMemberExpression = node => {
  let esCode = ''
  const accessObject = object => {
    if (object.object) {
      accessObject(object.object)
    } else {
      esCode += object.name
    }
    if (object.property) {
      esCode += '.' + object.property.name
    }
  }
  accessObject(node)
  // console.log('parseMemberExpression', esCode, node)
  const newNode = {
    name: esCode,
    type: 'Identifier'
  }
  return newNode
}

// 解析一元表达式
const parseUnaryExpression = node => {
  let esCode = ''
  if (node.prefix) {
    esCode += node.operator
  }
  if (node.argument) {
    if (node.argument.type === 'Identifier') {
      esCode += node.argument.name
    } else if(node.argument.type === 'MemberExpression') {
      esCode += parseMemberExpression(node.argument).name
    }
  }
  const newNode = {
    name: esCode,
    type: 'Identifier'
  }
  return newNode
}

estraverse.replace(ast, {
  enter(node, parent) {
    /* 
      需要处理的：
      1. 变量
      2. _ssrClass
      3. _ssrStyle
      3. _ssrAttr
    */
    switch(node.type) {
      case 'Identifier':
        // console.log('标识符', node, parent)
        break
      case 'ArrayExpression':
        // console.log('数组', node, parent)
        break
      case 'ExpressionStatement':
        // console.log('表达式声明', node, parent)
        break
      case 'BinaryExpression':
        // console.log('表达式', node, parent)
        // node = parseFunctionParams(node)
        // return node
        break
      case 'Identifier':
        // console.log('识别码', node, parent)
        break
      case 'Literal':
        // console.log('文本', node, parent)
        break
      case 'CallExpression':
        // node = parseCallExpression(node)
        // return node
        // console.log('调用表达式', node)
        break
      case 'MemberExpression':
        console.log('成员表达式', node)
        node = parseMemberExpression(node)
        return node
        break
      case 'UnaryExpression':
        console.log('一元表达式', node)
        node = parseUnaryExpression(node)
        return node
        break
    }

    // console.log('enter', node, parent)
  },
  leave(node, parent) {
    // console.debug('leave', node, parent)
  }
})

const resultCode = escodegen.generate(ast)
console.log('resultCode', resultCode)
