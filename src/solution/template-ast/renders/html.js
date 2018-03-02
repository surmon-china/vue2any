
// 是否为自闭和标签
const isSelfCloseTag = tag => {
	return ['img', 'input', 'br', 'hr', 'area'].includes(tag)
}

// 是否是合法的html属性
const isHtmlAttr = attr => {
	return ['class', 'id', 'src', 'disabled', 'checked', 'style', 'name', 'value'].includes(attr)
}

module.exports = {
	isHtmlAttr,
	isSelfCloseTag
}
