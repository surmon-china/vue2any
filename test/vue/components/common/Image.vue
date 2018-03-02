<template>
	<div>i'm a Global image Component {{ src }}</div>
</template>

<script>
	export default {
		name: 'imageaaa',
		props: {
			src: {
				type: String
			}
		},
		data() {
			return {
				title: 'i am xxxxxx.jpg'
			}
		}
	}
</script>