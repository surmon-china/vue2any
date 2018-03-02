
const =

const paraseSsrAttr = node => {
	console.log('解析属性选项', node)
	// 分析函数内的参数
	node.arguments = node.arguments.map(argument => {
    if (argument.type === 'UnaryExpression') {
      console.log('----------')
      let targetEsCode = ''
      if (argument.prefix) {
      	targetEsCode += argument.operator
      }
      if (argument.argument) {
      	if (argument.argument.type) {
      		if (argument.argument.type === 'MemberExpression') {
      			const 
      		}
      	}
      }
      return {
        type: Literal,
        value: targetEsCode
      }
    } else {
      return argument
    }
  })
	return node
}

module.exports = paraseSsrAttr