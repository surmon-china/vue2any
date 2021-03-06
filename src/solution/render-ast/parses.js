
require('core-js')
const esprima = require('esprima')
const escodegen = require('escodegen')
const estraverse = require('estraverse')
const getParameterNames = require('get-parameter-names')

// init
let context = null
let options = null
let transfer = null
let isNeedTransferToServerData = (expression, keyword, notCheckEx) => {
  // console.warn('--------------------------keyword', keyword, 'expression', expression, keyword)
  if (!notCheckEx) {
    if (context.transfer.validate(expression)) {
      return false
    }
  }
  keyword = (keyword || context.options.variable)
  if (typeof keyword === 'string') {
    return (expression.startsWith(keyword) || 
            expression.startsWith(!`${keyword}`) || 
            expression.startsWith('!PHPDATA.') ||
            expression.startsWith('PHPDATA.'))
  } else if (keyword instanceof Array) {
    if (!keyword.includes('PHPDATA')) keyword.push('PHPDATA')
    return keyword.some(kw => (expression.startsWith(kw) || expression.startsWith(`!${kw}`)))
  }
}

// 将 _ssrClass => object => SERVERDATE 转移到 静态属性
const parseClassData = (node, parent, vm, keyword, prefix) => {
  // 如果是 object 形式
  const isObjectClass = node.arguments[1].type === 'ObjectExpression'
  if (isObjectClass) {
    const objectClass = node.arguments[1]
    if (objectClass && objectClass.properties && objectClass.properties.length) {
      objectClass.properties.forEach((propertie, i) => {
        const valueCode = escodegen.generate(propertie.value)
        const className = escodegen.generate(propertie.key)
        // 来自服务端
        // console.debug(node, valueCode, className)
        if (isNeedTransferToServerData(valueCode, keyword)) {
          const targetClassCode = transfer.echoConditionalOperator(valueCode, className)
          // 添加到静态数据
          node.arguments[0].value = node.arguments[0].value || ''
          node.arguments[0].value += ` ${targetClassCode}`
          // 从动态数据删除
          node.arguments[1].properties[i].delete = true
        }
      })
      node.arguments[1].properties = node.arguments[1].properties.filter(p => !p.delete)
    }
  }
  // console.log('处理后node', node.arguments)
  return node
}

// 将 _ssrList => 的所有相关参数转移为 SERVERDATA
const parseListData = function (node, parent, vm, keyword, prefix) {
  // 如果是参数是服务端的，则递归处理自身，因为自身也可能有 ssrlist
  // console.warn('从switch 处理列表开始', keyword, escodegen.generate(node), node, parent)
  const defaultListDataCode = escodegen.generate(node.arguments[0])
  const vtaGenerate = require('./generate')
  const instance = this

  const doFuckList = listNode => {
    const listData = listNode.arguments[0]
    let listRender = listNode.arguments[1]
    const listNodeCode = escodegen.generate(listNode)
    const listDataCode = escodegen.generate(listNode.arguments[0])
    const listRenderCode = escodegen.generate(listNode.arguments[1])
    const listRenderParams = getParameterNames(listRenderCode)
    const kws = Array.from(new Set(listRenderParams.concat(keyword)))
    // console.warn('---------------处理这个列表中', listDataCode, kws, prefix)
    listRender = vtaGenerate.parseAst.bind(instance)(listRender, vm, kws, prefix)
    if (!instance.transfer.validate(listData)) {
      const targetCode = instance.transfer.echoData(listDataCode, prefix)
      // console.warn('这个参数转一下', listDataCode, targetCode, listData)
      listNode.arguments[0] = {
        name: `"${targetCode}"`,
        type: 'Identifier'
      }
    }

    estraverse.replace(listRender, {
      enter(_node, _parent) {
        // console.debug('什么他妈的傻逼玩意', escodegen.generate(_node), _node)
        if (_node.type === 'CallExpression' && _node.callee.name === '_ssrList') {
          // 递归，递归的时候传递一个父的keyword
          const childList = _node
          // 这个子项的 call 的第一个参数是来自 parent 的 params 才让他递归
          const childListData = childList.arguments[0]
          const childListRender = childList.arguments[1]
          const childListDataCode = escodegen.generate(childList.arguments[0])
          const childListRenderCode = escodegen.generate(childList.arguments[1])
          const childListDataName = childListData.name || childListData.value || childListData.object.name
          if (listRenderParams.includes(childListDataName)) {
            // console.warn('发现了一个子列表', escodegen.generate(childList), childListData)
            _node = doFuckList(childList)
          }
        }
        return _node
      }
    })
    return listNode
  }

  if (isNeedTransferToServerData(defaultListDataCode, keyword)) {
    // console.warn('可以处理这个列表', escodegen.generate(node), node, parent)
    node = doFuckList(node)
  }

  // console.warn('傻逼们早就处理完了', escodegen.generate(node))
  return node
}

// 解析条件表达式
const ConditionalExpression = function(node, parent, vm, keyword, prefix) {
  const expressionCode = escodegen.generate(node)
  const condition = escodegen.generate(node.test)
  // 如果来自于服务端，则处理
  // console.warn('---------------------解析条件表达式 来自服务端', expressionCode, condition)
  if (isNeedTransferToServerData(condition, keyword)) {
    // 如果是解析组件的判断句，则用逗号分隔
    let stitching = ''
    if (escodegen.generate(node.consequent).startsWith('_c') ||
        // escodegen.generate(node.consequent).startsWith('_v') || 
        escodegen.generate(node.consequent).startsWith('_ssrNode')) {
      stitching = ','
    } else {
      stitching = '+'
    }
    let targetExpression = ``
    // 递归 如果备选项是三目运算类型 则继续递归
    const parseTernaryOperatorAst = (node, elseif) => {
      const consequent = escodegen.generate(node.consequent)
      const alternate = escodegen.generate(node.alternate)
      const _testCode = escodegen.generate(node.test)
      const testCode = transfer.transferExpression(node, _testCode, keyword, prefix)
      // console.warn('----------------------testCode', _testCode, ' - ', testCode, keyword, prefix)
      targetExpression += `"${transfer.condition[elseif ? 'elseif' : 'if'](testCode)}"${stitching}`
      targetExpression += `${consequent}${stitching}`
      if (node.alternate.type === 'ConditionalExpression') {
        parseTernaryOperatorAst(node.alternate, true)
      } else {
        targetExpression += `"${transfer.condition.else}"${stitching}`
        targetExpression += `${alternate}${stitching}"${transfer.condition.endif}"`
        // console.log('ast', ast.falseValue)
      }
    }
    parseTernaryOperatorAst(node, false)
    // console.warn('---------------------解析条件表达式 来自服务端2', targetExpression)
    const targetAst = esprima.parse(targetExpression, { sourceType: 'script' })
    // console.warn('---------------------targetExpression', targetExpression, targetAst.body, '\n')
    return targetAst
  }
  return node
}

// 解析函数表达式
function CallExpression (node, parent, vm, keyword, prefix) {
  // console.log('解析函数表达式', this, node, escodegen.generate(node))
  // 如果是本身的函数则进行处理
  const renderFns = ['_ssrAttr', '_ssrStyle', '_ssrList', '_l', '_ssrClass', '_s', '_ssrEscape']
  const canParse = node.callee.name && renderFns.includes(node.callee.name)
  if (canParse) {
    switch(node.callee.name) {
      case '_ssrClass':
        // console.log('_ssrClass', node)
        node = parseClassData(node, parent, vm, keyword, prefix)
        break
      case '_l':
      case '_ssrList':
        node = parseListData.bind(this)(node, parent, vm, keyword, prefix)
        break
    }
  }
  return node
}

// 解析成员表达式
function MemberExpression (node, parent, vm, keyword, prefix) {
  const nodeCode = escodegen.generate(node)
  // console.log('------------解析成员表达式', nodeCode, node, keyword)
  if (isNeedTransferToServerData(nodeCode, keyword)) {
    const targetCode = transfer.echoData(nodeCode, prefix)
    // console.debug('成功解析成员表达式', node, nodeCode, targetCode, prefix)
    return {
      name: `"${targetCode}"`,
      type: 'Identifier'
    }
  }
  return node
}

// 解析一元表达式
const UnaryExpression = function(node, parent, vm, keyword, prefix) {
  const nodeCode = escodegen.generate(node)
  const _nodeCode = escodegen.generate(node.argument)
  if (node.prefix && node.operator === '!') {
    // console.log('----------解析一元表达式', _nodeCode, keyword, node, parent)
    // if (isNeedTransferToServerData(_nodeCode, keyword, true)) {
    if (isNeedTransferToServerData(nodeCode, keyword)) {
      const targetCode = transfer.echoData(nodeCode, prefix)
      // console.debug('----------成功解析一元表达式', targetCode)
      node = {
        name: `"${targetCode}"`,
        type: 'Identifier'
      }
    }
  }
  return node
}

// 解析变量常量
const Identifier = function(node, parent, vm, keyword, prefix) {
  const nodeCode = escodegen.generate(node)
  // console.log('解析变量表达式', 'nodeCode:', nodeCode, 'node:', node, 'parent:', parent)
  if (isNeedTransferToServerData(nodeCode, keyword)) {

    // 不作为形参时才应该被解析
    if (parent.type !== 'FunctionExpression') {
      const targetCode = transfer.echoData(nodeCode, prefix)
      // console.debug('成功解析变量表达式', 'node:', node, 'nodeCode:', nodeCode, 'targetCode:', targetCode)
      return {
        name: `"${targetCode}"`,
        type: 'Identifier'
      }
    }
  }
  return node
}

module.exports = function(_context) {
  if (!context) {
    context = _context
    options = _context.options
    transfer = _context.transfer
  }
  return {
    Identifier,
    CallExpression,
    UnaryExpression,
    MemberExpression,
    ConditionalExpression
  }
}
