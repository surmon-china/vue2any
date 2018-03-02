<template>
	<div>
		<div>i'm a Global Component {{ text }}</div>
		<a-image :src="PHPDATA.imgsrc"></a-image>
	</div>
</template>

<script>
	import aImage from './common/Image.vue'
	export default {
		name: 'global',
		components: {
			aImage
		},
		data() {
			return {
				text: 'hahhahahha',
				imgsrc: 'https://xxxx/xxxx.xxx.xxx.jpg'
			}
		}
	}
</script>