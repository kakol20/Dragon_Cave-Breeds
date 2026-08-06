// Code for helping with development

async function separatePlayerJSON() {
	console.log('Success');

	const response = await fetch('test/testPlayer.json', { cache: 'no-store' });
	if (!response.ok) console.log(`Error fetching testPlayer.json: ${response.status}`);

	const devPlayer = await response.json();
	devPlayer.sort((a, b) => {
		if (a.done !== b.done) return a.done - b.done;

		return a.id.localeCompare(b.id);
	});
	// console.log(devPlayer);

	let finishedIndx = 0;
	for (let i = 0; i < devPlayer.length; ++i) {
		if (!devPlayer[i].done) continue;
		finishedIndx = i;
		break;
	}

	console.log('Finished Index', finishedIndx);

	const devUnfinished = devPlayer.slice(0, finishedIndx);
	console.log('Unfinished', devUnfinished);
	console.log(JSON.stringify(devUnfinished));
	console.log(' ');

	const devFinished = devPlayer.slice(finishedIndx, devPlayer.length);
	console.log('Finished', devFinished);
	console.log(JSON.stringify(devFinished));
}
