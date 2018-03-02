
require('core-js')
const esprima = require('esprima')
const escodegen = require('escodegen')
const estraverse = require('estraverse')
const getParameterNames = require('get-parameter-names')

// 语言关键字符
const keywords = {
  prefix: '<?php',
  postfix: '?>',
  echo: 'echo',
  separator: ';'
}

// 判断参数是否从属于指定的服务端字段你
const validateServerData = (expression, keywords) => {
  if (validate(expression)) {
    return false
  }
  if (typeof keywords === 'string') {
    return (expression.startsWith(keywords) || 
            expression.startsWith(`!${keywords}`) || 
            expression.startsWith('PHPDATA.') || 
            expression.startsWith('!PHPDATA.'))
  } else if (Array.isArray(keywords)) {
    if (!keywords.includes('PHPDATA')) keywords.push('PHPDATA')
    return keywords.some(k => expression.startsWith(k) || expression.startsWith(`!${k}`))
  }
}

// 转译表达式
const transferExpression = (node, expression, keyword, prefix) => {
  // 要使用 ast 分析工具 对条件进行分组，然后再匹配
  // console.warn('说是要转译表达式呢', expression, node, keyword, prefix)
  const exAst = esprima.parse(expression, { sourceType: 'script' })
  estraverse.replace(exAst, {
    enter(node, parent) {
      if (node.type === 'Identifier') {
        // console.log('------------', node, assignObjectPrefix(node.name, prefix))
        node = {
          name: `${assignObjectPrefix(node.name, prefix)}`,
          type: 'Identifier'
        }
      } else if (node.type === 'MemberExpression') {
        if (node.property.type === 'Identifier' && node.property.name === 'length') {
          let jsCode = escodegen.generate(node)
          jsCode = jsCode.slice(0, jsCode.indexOf('.length'))
          // console.log('-------------实际上总是还会有别的类型', jsCode)
          if (isFromServerData(jsCode)) {
            node = {
              name: `empty(${accessObject(jsCode)})`,
              type: 'Identifier'
            }
          } else if (validateServerData(jsCode, keyword)) {
            node = {
              name: `empty(${assignObjectPrefix(jsCode, prefix)})`,
              type: 'Identifier'
            }
          }
        } else {
          const targetObj = escodegen.generate(node)
          // console.debug('------targetObj', targetObj, keyword)
          // 1. 如果是来自服务端的，则转译
          // 2. 如果是来自父组件的，则转译
          if (isFromServerData(targetObj)) {
            node = {
              name: `${accessObject(targetObj)}`,
              type: 'Identifier'
            }
          } else if (validateServerData(targetObj, keyword)) {
            node = {
              name: `${assignObjectPrefix(targetObj, prefix)}`,
              type: 'Identifier'
            }
          }
        }
      }
      return node
    }
  })
  let resultExpressions = escodegen.generate(exAst, { semicolons: false })
  if (resultExpressions[resultExpressions.length - 1] === ';') {
    resultExpressions = resultExpressions.substring(0, resultExpressions.length - 1)
  }
  // console.debug('------最终的结果', resultExpressions)
  return resultExpressions
}

// 验证语句正确性
const validate = sentence => {
  // console.warn('--------------------------sentence', sentence)
  return !!sentence && 
         typeof sentence === 'string' && 
         sentence.includes(keywords.prefix) && 
         sentence.includes(keywords.postfix)
}

// 是否需要转义
const isFromServerData = expression => {
  return !!expression && typeof expression === 'string' && expression.startsWith('PHPDATA.')
}

// 反向解析
const getDataFromEcho = sentence => {
  return sentence.replace('<?php echo ', '').replace('; ?>', '')
}

// 访问数组
const accessArray = value => `['${value}']`

// 访问类方法
const accessClass = value => `->${value}`

// 访问对象
const accessObject = jsObj => {
  const isReverse = jsObj.startsWith('!')
  if (isReverse) {
    jsObj = jsObj.slice(1)
  }
  return jsObj.split('.').reduce((code, value, index, a) => {
    if (index === 0) {
      code += value
    } else {
      code += accessArray(value)
    }
    return code
  }, isReverse ? '!$' : '$')
}

// 三目运算语句
const echoConditionalOperator = (condition, trueValue = '', falseValue = '') => {
  if (!trueValue.includes(`"`) && !trueValue.includes(`'`)) {
    trueValue = `'${trueValue}'`
  }
  if (!falseValue.includes(`"`) && !falseValue.includes(`'`)) {
    falseValue = `'${falseValue}'`
  }
  return `<?php echo ${accessObject(condition)} ? ${trueValue} : ${falseValue}; ?>`
}

// 合并对象前缀
/*
  assignObjectPrefix('a.b.c', { a: '<?php echo($a); ?>' })
*/
const assignObjectPrefix = (data, prefix) => {
  // console.warn('------------php-assignObjectPrefix', data, prefix)
  if (prefix) {
    const prop = data.split('.')[0]
    const propPrefix = prefix[prop]
    if (propPrefix) {
      const propPrefixData = getDataFromEcho(propPrefix).replace(/[\$|\'\]]/g, '').replace(/\[/g, '.')
      data = data.split('.').splice(1).join('.')
      if (data) {

      }
      data = propPrefixData + (!!data ? `.${data}` : '')
      // console.warn('php输出', 'data', data, 'propPrefixData', propPrefixData)
    }
  }
  return accessObject(data)
}

// 输出语句
const echoData = (data, prefix) => {
  const resultData = assignObjectPrefix(data, prefix)
  return `<?php echo ${resultData}; ?>`
}

// 输出转义数据
const echoStripTagsData = data => {
  return `<?php echo htmlspecialchars(${accessObject(data)}); ?>`
}

// 将普通输出语句转化为转义语句
const echoStripTagsFromEcho = echo => {
  const pattern = () => /[\s\S]*(\<\?php[\s\S]*?\?>)[\s\S]*/g
  const _echo = pattern().exec(echo)[1] || echo
  const data = getDataFromEcho(_echo)
  const resultCode = `<?php echo htmlspecialchars(${data}); ?>`
  // console.log(echo, '-------', _echo, '------', data, '------', resultCode)
  return echo.replace(_echo, resultCode)
}

// 循环前句
const foreachBefore = (data, item, key) => {
  if (key) {
    return `<?php foreach (${data} as $${key} => $${item}):?>\n`
  } else {
    return `<?php foreach (${data} as $${item}):?>\n`
  }
}

const cif = exs => {
  /*
  const ospace = exs.operator ? ' ' : ''
  const rspace = exs.right ? ' ' : ''
  // console.log('说是要转译表达式呢', typeof exs.right, exs.right)
  if (isFromServerData(exs.right)) {
    exs.right = accessObject(exs.right)
  }
  */
  return `<?php if(${exs}): ?>`
}

const elseIf = exs => {
  /*
  const ospace = exs.operator ? ' ' : ''
  const rspace = exs.right ? ' ' : ''
  // console.log('说是要转译表达式呢', typeof exs.right, exs.right)
  if (isFromServerData(exs.right)) {
    exs.right = accessObject(exs.right)
  }
  */
  return `<?php elseif(${exs}): ?>`
}

const phpCodes = {
  keywords,
  validate,
  echoData,
  echoStripTagsData,
  echoStripTagsFromEcho,
  accessArray, 
  accessClass,
  accessObject,
  foreach: {
    before: foreachBefore,
    after: `<?php endforeach; ?>`
  },
  condition: {
    if: cif,
    elseif: elseIf,
    else: `<?php else: ?>`,
    endif: `<?php endif; ?>`
  },
  getDataFromEcho,
  transferExpression,
  echoConditionalOperator,
  assignObjectPrefix
}

module.exports = phpCodes
