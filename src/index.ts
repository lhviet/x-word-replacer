import MainUI from '$lib/MainUI';

function render() {
	const target = document.getElementById("root");

	if (target) {
		new MainUI({
			target,
			props: {
			},
		});
	}
}

document.addEventListener("DOMContentLoaded", render);
