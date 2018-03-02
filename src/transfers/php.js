
// 语言关键字符
const keywords = {
  prefix: '<?php',
  postfix: '?>',
  echo: 'echo',
  separator: ';'
}

// 转译表达式
const transferExpression = expression => {
  const pattern = /([^\s=\+<>-]+)\s*([=\+-<>]*)\s*([^\s=\+<>-]*)/g
  const expressions = pattern.exec(expression)
  const [ex, left, operator, right] = Array.from(expressions)
  return { left, operator, right }
}

// 验证语句正确性
const validate = sentence => {
  return !!sentence && 
         typeof sentence === 'string' && 
         sentence.includes(keywords.prefix) && 
         sentence.includes(keywords.postfix)
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
  // console.log(jsObj)
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

// 输出语句
const echoData = (data, prefix) => {
  // console.warn('php-echoData', data, prefix)
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
  return `<?php echo ${accessObject(data)}; ?>`
}

// 输出转义数据
const echoStripTagsData = data => {
  return `<?php echo strip_tags(${accessObject(data)}); ?>`
}

// 将普通输出语句转化为转义语句
const echoStripTagsFromEcho = echo => {
  const pattern = () => /[\s\S]*(\<\?php[\s\S]*?\?>)[\s\S]*/g
  const _echo = pattern().exec(echo)[1] || echo
  const data = getDataFromEcho(_echo)
  const resultCode = `<?php echo strip_tags(${data}); ?>`
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
  const ospace = exs.operator ? ' ' : ''
  const rspace = exs.right ? ' ' : ''
  return `<?php if(${exs.left}${ospace}${exs.operator}${rspace}${exs.right}): ?>`
}

const elseIf = exs => {
  const ospace = exs.operator ? ' ' : ''
  const rspace = exs.right ? ' ' : ''
  return `<?php elseif(${exs.left}${ospace}${exs.operator}${rspace}${exs.right}): ?>`
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
  echoConditionalOperator
}

module.exports = phpCodes
