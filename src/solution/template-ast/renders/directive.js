
const languageCode = require('../config').languageCode
const { echoData } = languageCode

// v-text、v-html
const textAndHtml = value => {
  return echoData(value)
}

// v-if
// v-else
// v-else-if
// v-show
// v-if
// v-for
// v-bind
// v-model
// v-pre
// v-cloak

module.exports = {
	text: textAndHtml,
	html: textAndHtml
}
