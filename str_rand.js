module.exports = function str_rand(length) {
	let result = '';
	let words = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
	let max_position = words.length - 1;
	for(let i = 0; i < length; ++i) {
		let position = Math.floor(Math.random() * max_position);
		result = result + words.substring(position, position + 1);
	}
	return result;
}