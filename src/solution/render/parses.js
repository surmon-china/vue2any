
require('core-js')
require('./expand')
const esprima = require('esprima')
const estraverse = require('estraverse')
const escodegen = require('escodegen')

// 转换细分的三目运算表达式
const parseConditionalOperator = function(expression, keyword) {
  const options = this.options
  const transfer = this.transfer
  const pattern = new RegExp(`([^?]+)\?([^:]+):(.+)`, 'g')
  const isConditionalOperator = pattern.test(expression)
  if (isConditionalOperator) {
    // 分析出条件和两种结果
    const expressionResults = /([^?]+)\?([^:]+):(.+)/g.exec(expression)
    let condition = expressionResults[1].trim()
    // 去括号
    const signPattern = () => /\(([\s\S]*?)\)/g
    if (signPattern().test(condition)) {
      const _condition = signPattern().exec(condition)[1]
      condition = _condition || condition
    }
    // todo: 这里还需要对三目运算两种值的类型进行判断
    const trueValue = expressionResults[2].trim()
    const falseValue = expressionResults[3].trim()
    const targetCode = transfer.echoConditionalOperator(
      condition,
      trueValue,
      falseValue
    )
    return `"${targetCode}"`
  } else {
    return expression
  }
  return expression
}

// 替换 variable
const parseVariable = function(expression, keyword) {
  const options = this.options
  const transfer = this.transfer
	if (typeof expression === 'function') {
		expression = `${expression}`
	}
  if (!expression.includes(keyword)) {
    return expression
  }
  const pattern = new RegExp(`\\(${keyword}([^,]*?)\\)`, 'g')
  expression = expression.replace(pattern, variable => {
    // console.log('variable', variable)
    const targetVariable = variable.replace(/\(|\)/g, '')
    const targetLangEcho = transfer.echoData(targetVariable)
    return `("${ targetLangEcho }")`
  })
  return expression
}

// 替换 class
const parseClass = function(expression, keyword) {
  const options = this.options
  const transfer = this.transfer
  if (typeof expression === 'function') {
    expression = `${expression}`
  }
  if (!expression.includes(keyword)) {
    return expression
  }
  const pattern = new RegExp(`_ssrClass\\(([\\s\\S]*?)\\)`, 'g')

  // console.log('pattern', pattern)
  expression = expression.replace(pattern, variable => {
    // console.log('_ssrClass', variable)

    // 如果包含目标语言的变量标识，则进行转换
    const variablePattern = new RegExp(`${keyword}([^,]*?)`, 'g')
    // console.log('variablePattern', variablePattern, variable, variablePattern.test(variable))
    if (variablePattern.test(variable)) {

      // console.log('variable', variable)
      const staticClasses = /_ssrClass\((.*?),/g.exec(variable)[1]
      // console.log('staticClasses', staticClasses)
      let dynamicClasses = variable.match(/\"\,([\s\S]*?)\)$/g)
      dynamicClasses = dynamicClasses[0].replace(/(\"\,|\)$)/g, '')
      // console.log('dynamicClasses', dynamicClasses)

      // 拿到的 class 为：1. objectName 2. object 3.array
      // 如果是数组
      if (dynamicClasses.startsWith('[')) {
        // 分析数组，并批量转换为三木运算
        let dynamicClassesArr = dynamicClasses.replace(/\[|\]/g, '').split(',')
        // console.log('数组1', dynamicClassesArr)
        dynamicClassesArr = dynamicClassesArr.map(classes => {
          return parseConditionalOperator.bind(this)(classes)
        })
        dynamicClasses = `[${dynamicClassesArr}]`
        // console.log('数组2', dynamicClasses)

      } else if (dynamicClasses.startsWith('{')) {
        // console.log('对象', dynamicClasses)
        const pattern = () => new RegExp(`\\{([\\s\\S]*?)\\}`, 'g')
        dynamicClasses = dynamicClasses.replace(/\s/g, '')
        dynamicClasses = pattern().exec(dynamicClasses)[1].split(',')
        dynamicClasses = dynamicClasses.reduce((targetClasses, cls, i) => {
          const conditionalOperator = /([^:]*):(([\s\S]*))/g.exec(cls)
          targetClasses += transfer.echoConditionalOperator(
            conditionalOperator[2],
            conditionalOperator[1],
            ''
          ) + ' '
          return targetClasses
        }, '')
        dynamicClasses = `"${dynamicClasses}"`
      } else {
        console.log('一个来自 php\'s class obejct')
      }
      resultClasses = `_ssrClass(${staticClasses}, ${dynamicClasses})`
      // console.log('resultClasses', resultClasses)
      return resultClasses
    } else {
      return variable
    }
  })
  // console.log('resultFn', expression)
  return expression
}

// 替换 style
const parseStyle = function(expression, keyword) {
  const self = this
  const options = this.options
  const transfer = this.transfer
  if (typeof expression === 'function') {
    expression = `${expression}`
  }
  if (!expression.includes(keyword)) {
    return expression
  }
  const pattern = new RegExp(`_ssrStyle\\(([\\s\\S]*?)(null\\)|}\\))`, 'g')
  expression = expression.replace(pattern, variable => {
    // console.log('_ssrStyle', variable)
    const variablePattern = () => new RegExp(`${keyword}([^,]*?)`, 'g')
    // console.log('variablePattern', variablePattern, 'variable', variable)
    if (variablePattern().test(variable)) {
      let allStyles = /_ssrStyle\(([\s\S]*),(\{[\s\S]*\}\,|null\,)([\s\S]*)\)$/g.exec(variable)
      // console.log('allStyles', allStyles)
      const staticStyles = allStyles[1]
      let dynamicStyles = allStyles[2].trim()
      let extraStyles = allStyles[3].trim()
      // console.log('staticStyles', staticStyles)
      // console.log('dynamicStyles', dynamicStyles)
      // console.log('extraStyles', extraStyles)

      // 拿到的 class 为：1.array 2.object 3...
      if (dynamicStyles.startsWith('[')) {
        let dynamicStylesArr = dynamicStyles.replace(/\[|\]/g, '').split(',')
        // console.log('dynamicStyles', dynamicStylesArr)
        dynamicStylesArr = dynamicStylesArr.map(classes => {
          return parseConditionalOperator.bind(self)(classes)
        })
        dynamicStyles = `[${dynamicStylesArr}]`
        // console.log('dynamicStyles', dynamicStyles)

      } else if (dynamicStyles.startsWith('{')) {
        // console.log('对象', dynamicStyles)
        const pattern = () => new RegExp(`\\{([\\s\\S]*?)\\}`, 'g')
        dynamicStyles = dynamicStyles.replace(/\s/g, '')
        dynamicStyles = pattern().exec(dynamicStyles)[1].split(',')
        dynamicStyles = dynamicStyles.reduce((targetStyles, cls, i) => {
          const conditionalOperator = /([^:]*):(([\s\S]*))/g.exec(cls)
          const styleKey = conditionalOperator[1]
          const styleValue = transfer.echoData(conditionalOperator[2])
          targetStyles += `${styleKey}: "${styleValue}",`
          return targetStyles
        }, '')
        dynamicStyles = `{${dynamicStyles}}`
      } else {
        console.log('一个来自 php\'s style obejct')
      }

      // 处理 v-show 或其他
      if (extraStyles && 
          extraStyles !== 'null' && 
          variablePattern().test(extraStyles)
      ) {
        // 如果是 v-show
        if (extraStyles.includes('display:')) {
          const displayValue = /display:([\s\S]*)\}/g.exec(extraStyles)[1].trim()
          // console.log('处理 v-show', displayValue)
          const _displayValue = parseConditionalOperator.bind(self)(displayValue, keyword)
          // console.log('处理 v-show', _displayValue)
          extraStyles = extraStyles.replace(displayValue, _displayValue)
          // console.log('处理 v-show', extraStyles)
        }
      }

      resultStyles = `_ssrStyle(${staticStyles}, ${dynamicStyles}, ${extraStyles})`
      // console.log('resultStyles', resultStyles)
      return resultStyles
    } else {
      return variable
    }
  })
  // console.log('resultFn', expression)
  return expression
}

// 替换 attr
const parseAttr = function(expression, keyword) {
  const options = this.options
  const transfer = this.transfer
  if (typeof expression === 'function') {
    expression = `${expression}`
  }
  if (!expression.includes(keyword)) {
    return expression
  }
  // console.log('expression', expression)
  const pattern = () => new RegExp(`_ssrAttr\\([\\s\\S]*?,([\\s\\S]*?)\\)`, 'g')
  return expression.replace(pattern(), _expression => {
    const attrVar = pattern().exec(_expression)
    // console.log('_expression', _expression, 'attrVar', attrVar)
    if (attrVar && 
        attrVar[1] && 
        attrVar[1].includes(keyword) &&
        !attrVar[1].includes(`$${keyword}`)) {
      const attrValue = attrVar[1].startsWith('(') ? attrVar[1].slice(1) : attrVar[1]
      return _expression.replace(attrValue, `"${transfer.echoData(attrValue)}"`)
    } else {
      return _expression
    }
  })
}

// 分析三元运算符
const parseTernaryOperator = function(expression, keyword) {
  const transfer = this.transfer
  if (typeof expression === 'function') {
    expression = `${expression}`
  }
  const pattern = () => /([\s\S]*?)\?([\s\S]*?):([\s\S:]*)/g
  let ternaryOperator = pattern().exec(expression)
  // ternaryOperator = expression.getAllContent('(')
  console.log('\n三元运算符的匹配： \n\n', ternaryOperator)

  if (!ternaryOperator) {
    return expression
  }

  // ast
  let toAst = {}
  const getAst = (expression, ast) => {
    const deepTos = pattern().exec(expression)
    ast.condition = deepTos[1].trim()
    ast.trueValue = deepTos[2].trim()
    ast.falseValue = deepTos[3].trim()
    if (ast.falseValue.includes('?') && ast.falseValue.includes(':')) {
      const falseValue = ast.falseValue
      ast.falseValue = {}
      getAst(falseValue, ast.falseValue)
    } else {
      ast.falseValue = ast.falseValue.replace(/\(|\)/g, '')
    }
  }
  getAst(expression, toAst)
  console.log(toAst)

  // return expression

  // 分析ast 是否满足要求
  let targetExpression = ``  
  const parseAst = (ast, elseif) => {
    const exs = transfer.transferExpression(ast.condition)
    exs.left = transfer.accessObject(exs.left)
    if (exs.right && exs.right.includes(keyword)) {
      exs.right = transfer.accessObject(exs.right)
    }
    targetExpression += `'${transfer.condition[elseif ? 'elseif' : 'if'](exs)}'+`
    targetExpression += `${ast.trueValue}+`
    console.log('ast', ast)
    if (ast.falseValue && ast.falseValue.falseValue) {
      parseAst(ast.falseValue, true)
    } else {
      targetExpression += `'${transfer.condition.else}'+`
      targetExpression += `${ast.falseValue}+'${transfer.condition.endif}'`
      console.log('ast', ast.falseValue)
    }
  }
  parseAst(toAst, false)
  console.log('targetExpression', targetExpression)
  expression = expression.replace(pattern(), targetExpression)
  return expression
}

// 转换条件表达式
const parseConditionalExpression = function(expression, keyword, componentVm) {
  const instance = this
  const options = this.options
  const transfer = this.transfer
  const exAst = esprima.parse(expression, { sourceType: 'script' })
  estraverse.replace(exAst, {
    enter(node, parent) {

      // 解析条件表达式
      if (node.type === 'ConditionalExpression') {
        // console.log('条件表达式', node, '\n', escodegen.generate(node))
        // 语句 && 条件
        const expressionCode = escodegen.generate(node)
        const testCode = escodegen.generate(node.test)
        // 如果来自于服务端，则处理
        if (testCode.includes(keyword) && !transfer.validate(testCode)) {
          // console.debug('来自服务端', expressionCode)
          const targetCode = parseTernaryOperator.bind(instance)(expressionCode, keyword)
          return {
             name: `${targetCode}`,
             type: 'Identifier'
          }
        }
      }
    }
  })
  return escodegen.generate(exAst, {
    format: {
      indent: {
          style: '    ',
          base: 0,
          adjustMultilineComment: false
      },
      newline: '\n',
      space: ' ',
      json: false,
      renumber: true,
      hexadecimal: false,
      quotes: 'auto',
      escapeless: false,
      compact: true,
      parentheses: true,
      semicolons: false,
      safeConcatenation: false
    }
  })
}

module.exports = {
  parseAttr,
  parseStyle,
  parseClass,
	parseVariable,
  parseConditionalExpression
}
