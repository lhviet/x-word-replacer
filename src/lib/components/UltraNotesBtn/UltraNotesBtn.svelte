<script lang='ts'>
	let className = '';
	export { className as class };
</script>

<a class='nav-link custom-effect {className}'
   href='https://chrome.google.com/webstore/detail/ultra-notes/ngfhnakbmjknpcepkeiilllocgbdfehi'
   target='_blank'>
    <span>Have you ever try Ultra Notes?</span>
    <i class='ms-2 fs-4 align-middle fa fa-pencil-square-o'></i>
</a>

<style>
    .custom-effect {
        text-align: center;
        color: #fff;
        text-decoration: none;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        background: -webkit-gradient(linear, left top, right top, from(yellow), color-stop(orange), color-stop(red), color-stop(violet), color-stop(purple), color-stop(blue), to(yellow));
        background: linear-gradient(90deg, yellow, orange, red, violet, purple, blue, yellow);
        background-size: 400%;
        border-radius: 15px;
        z-index: 1;

    }

    .custom-effect:before {
        content: "";
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        z-index: -1;
        background: linear-gradient(45deg, #f15523, #ef3224, #7c3697);
        background-size: 400%;
        border-radius: 40px;
        opacity: 0;
        transition: 0.5%;

        filter: blur(20px);
        opacity: 1;
        animation: animate 20s linear infinite;
    }

    @keyframes animate {
        0% {
            background-position: 0%;
        }
        100% {
            background-position: 400%;
        }
    }
</style>