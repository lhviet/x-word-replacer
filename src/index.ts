import MainUI from '$lib/MainUI';

function render() {
	const target = document.body;

	if (target) {
		new MainUI({
			target,
			props: {
			},
		});
	}
}

document.addEventListener("DOMContentLoaded", render);
