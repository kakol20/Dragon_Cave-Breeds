async function run() {
	try {
		draw();
	} catch(err) {
		document.getElementById('output').innerHTML = `${err}<br>Reloading in 5 seconds`;
		await sleep(5 * 1000);
		location.reload();
	}
}