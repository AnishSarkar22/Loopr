<script lang="ts">
	const ldJson = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Loopr',
		url: 'https://loopr-pi.vercel.app/'
	};
	const jsonldScript = `<script type="application/ld+json">${JSON.stringify(ldJson) + '<'}/script>`;

	const features = [
		{
			name: 'Free to host',
			description:
				'Instructions included for Cloudflare + Appwrite. Free to start, and cost effective to scale.',
				// TODO: add github link here
			link: '',
			linkText: 'Docs',
			newPage: true,
			svgContent: `<g fill="none">
		<path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m4.012 15.762l1.69-5.069c.766-2.298 1.149-3.447 2.055-3.66c.906-.215 1.763.642 3.475 2.355l3.38 3.379c1.712 1.713 2.569 2.569 2.355 3.475s-1.363 1.29-3.661 2.055l-5.069 1.69c-2.765.922-4.148 1.383-4.878.653s-.269-2.113.653-4.878Z" />
		<path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M12.235 18.346s-.758-2.281-.758-3.79c0-1.51.758-3.792.758-3.792m-4.17 8.72s-.64-2.753-.758-4.55c-.195-2.969.758-7.581.758-7.581" opacity="0.5" />
		<path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m14.51 10.006l.143-.72c.146-.727.67-1.32 1.373-1.554a2.07 2.07 0 0 0 1.372-1.555l.144-.72m.028 7.796l.212.123c.657.38 1.483.296 2.051-.207a1.76 1.76 0 0 1 1.876-.297L22 13M9.795 2.779A1.4 1.4 0 0 0 10 4.5l.097.098c.394.393.539.97.378 1.503" />
		<path fill="currentColor" d="M6.928 3.94a.536.536 0 1 1 .758.76a.536.536 0 0 1-.758-.76m5.229 3.217a.536.536 0 1 1 .759.759a.536.536 0 0 1-.759-.759m5 3a.536.536 0 1 1 .759.759a.536.536 0 0 1-.759-.759m1.901 5.156a.536.536 0 1 1 .759.759a.536.536 0 0 1-.759-.759" opacity="0.5" />
		<path fill="currentColor" d="m19.173 10.328l-.486.12l.073.293l.292.072zM21 8.5l-.5-.001A.5.5 0 0 0 21 9zm-1.829 1.828l.486-.12v-.002l-.004-.014l-.012-.055l-.042-.212a6 6 0 0 1-.085-.684a3.2 3.2 0 0 1 .027-.748c.04-.23.11-.36.173-.425l-.707-.707c-.27.27-.393.634-.45.957c-.06.33-.06.68-.041.986a7 7 0 0 0 .163 1.116l.005.02l.001.005v.002h.001zm.543-2.26c.243-.243.435-.224.524-.183c.096.044.263.204.261.614l1 .002c.002-.684-.296-1.272-.842-1.524c-.554-.256-1.183-.083-1.65.384zm-.543 2.26l-.12.485h.002l.001.001l.006.002l.02.004l.07.016q.091.02.247.049c.205.037.489.079.798.099c.306.02.656.018.986-.04c.324-.058.687-.18.958-.452l-.707-.707c-.065.064-.196.133-.426.174c-.222.04-.484.044-.747.027a6 6 0 0 1-.965-.143h-.003zm2.968.164c.467-.467.64-1.096.384-1.65c-.253-.546-.84-.844-1.525-.842l.003 1c.41-.001.57.165.614.262c.04.088.06.28-.183.523z" />
		<path stroke="currentColor" d="m15.188 3.417l-.027.098c-.03.106-.046.16-.039.212s.036.098.093.189l.053.082c.201.32.302.48.234.611c-.07.131-.262.146-.648.176l-.1.008c-.11.009-.164.013-.212.038s-.084.068-.155.155l-.065.079c-.25.304-.375.456-.518.437s-.21-.198-.341-.555l-.034-.092c-.038-.102-.056-.152-.093-.19c-.037-.036-.088-.055-.189-.092l-.092-.034c-.357-.132-.535-.198-.555-.34c-.02-.144.133-.27.437-.52l.079-.065c.086-.07.13-.106.155-.154s.03-.103.038-.213l.008-.1c.03-.385.045-.578.175-.647c.131-.069.291.032.611.234l.083.052c.09.058.136.086.189.093s.105-.008.212-.038l.097-.027c.376-.107.563-.16.664-.06c.1.1.047.288-.06.663Z" opacity="0.5" stroke-width="1" />
	</g>`
		},
		{
			name: 'Real-Time Alerts',
			description: 'Get instant notifications via email or integrations when your services go down.',
			svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...$$props}>
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.53 14.394c-.213 1.353.738 2.292 1.902 2.76c4.463 1.795 10.673 1.795 15.136 0c1.164-.468 2.115-1.407 1.902-2.76c-.13-.832-.777-1.524-1.256-2.2c-.627-.897-.689-1.874-.69-2.915C19.525 5.26 16.157 2 12 2S4.475 5.26 4.475 9.28c0 1.04-.062 2.018-.69 2.914c-.478.676-1.124 1.368-1.255 2.2M9 21c.796.622 1.848 1 3 1s2.204-.378 3-1" color="currentColor" />
</svg>
			</svg>`
		},
		//     {
		//       name: "Email",
		// TODO: add link here
		//       link: "",
		//       linkText: "Docs",
		//       description: "Send emails to users, including template support.",
		//       svgContent: `<path d="M22 10C22.0185 10.7271 22 11.0542 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		// <path d="M6 8L8.1589 9.79908C9.99553 11.3296 10.9139 12.0949 12 12.0949C13.0861 12.0949 14.0045 11.3296 15.8411 9.79908" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		// <circle cx="19" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>`,
		//     },
		{
			name: 'Performance',
			newPage: true,
			linkText: 'Docs',
			// TODO: add a github link here
			link: '',
			description:
				'Modern SvelteKit stack ensures quick responses and high Lighthouse scores.',
			svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...$$props}>
	<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M15.268 18.229c-1.98 2.678-2.969 4.017-3.892 3.734s-.923-1.925-.923-5.21v-.31c0-1.185 0-1.777-.379-2.148l-.02-.02c-.387-.363-1.003-.363-2.236-.363c-2.22 0-3.329 0-3.703-.673l-.019-.034c-.354-.683.289-1.552 1.574-3.29L8.732 5.77c1.979-2.678 2.969-4.017 3.892-3.734s.923 1.925.923 5.21v.31c0 1.185 0 1.777.379 2.148l.02.02c.387.363 1.003.363 2.236.363c2.22 0 3.329 0 3.704.673l.018.034c.354.683-.289 1.553-1.574 3.29" />
</svg>`
		},
		// {
		//   name: "Responsive",
		//   description: "Designed for mobile and desktop.",
		//   svgContent: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor">
		// 	<path d="M20 17.186C18.843 18 17.21 18 13.946 18H9.964c-3.264 0-4.897 0-6.054-.814a4.5 4.5 0 0 1-1.1-1.105C2 14.92 2 13.28 2 10s0-4.919.81-6.081c.3-.43.672-.804 1.1-1.105C5.067 2 6.7 2 9.964 2M12 18v4m-4 0h8" />
		// 	<path d="M18 2c1.886 0 2.828 0 3.414.586S22 4.114 22 6v4c0 1.886 0 2.828-.586 3.414S19.886 14 18 14h-1c-1.886 0-2.828 0-3.414-.586S13 11.886 13 10V6c0-1.886 0-2.828.586-3.414S15.114 2 17 2zm-.5 9.5h.009" />
		// </g>`,
		// },
		//     {
		//       name: "Delightful Stack",
		//       description:
		//         "Tools you'll love working with, including SvelteKit, Tailwind, DaisyUI, Postgres, and Supabase.",
		//       linkText: "Docs",
		//       newPage: true,
		// TODO: add link here
		//       link: "",
		//       svgContent: `<path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" stroke="currentColor" stroke-width="1.5"/>
		// <path d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10" stroke="currentColor" stroke-width="1.5"/>
		// <path d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14" stroke="currentColor" stroke-width="1.5"/>`,
		//     },
		//     {
		//       name: "Extensible",
		//       description: "Easily extend Loopr with integrations for Slack, Discord, Email, SMS, PagerDuty, GitHub, custom webhooks, and more. Build custom monitoring, dashboards, and admin tools to fit your needs.",
		//       svgContent: `<path d="M12.75 6.5C12.75 6.08579 12.4142 5.75 12 5.75C11.5858 5.75 11.25 6.08579 11.25 6.5H12.75ZM18 16.5L18.5303 17.0303C18.8232 16.7374 18.8232 16.2626 18.5303 15.9697L18 16.5ZM15.9697 17.4697C15.6768 17.7626 15.6768 18.2374 15.9697 18.5303C16.2626 18.8232 16.7374 18.8232 17.0303 18.5303L15.9697 17.4697ZM17.0303 14.4697C16.7374 14.1768 16.2626 14.1768 15.9697 14.4697C15.6768 14.7626 15.6768 15.2374 15.9697 15.5303L17.0303 14.4697ZM11.25 6.5V12.5H12.75V6.5H11.25ZM16 17.25H18V15.75H16V17.25ZM17.4697 15.9697L15.9697 17.4697L17.0303 18.5303L18.5303 17.0303L17.4697 15.9697ZM18.5303 15.9697L17.0303 14.4697L15.9697 15.5303L17.4697 17.0303L18.5303 15.9697ZM11.25 12.5C11.25 15.1234 13.3766 17.25 16 17.25V15.75C14.2051 15.75 12.75 14.2949 12.75 12.5H11.25Z" fill="currentColor"/>
		// <path d="M12.75 6.5C12.75 6.08579 12.4142 5.75 12 5.75C11.5858 5.75 11.25 6.08579 11.25 6.5H12.75ZM6 16.5L5.46967 15.9697C5.17678 16.2626 5.17678 16.7374 5.46967 17.0303L6 16.5ZM6.96967 18.5303C7.26256 18.8232 7.73744 18.8232 8.03033 18.5303C8.32322 18.2374 8.32322 17.7626 8.03033 17.4697L6.96967 18.5303ZM8.03033 15.5303C8.32322 15.2374 8.32322 14.7626 8.03033 14.4697C7.73744 14.1768 7.26256 14.1768 6.96967 14.4697L8.03033 15.5303ZM11.25 6.5V12.5H12.75V6.5H11.25ZM8 15.75H6V17.25H8V15.75ZM5.46967 17.0303L6.96967 18.5303L8.03033 17.4697L6.53033 15.9697L5.46967 17.0303ZM6.53033 17.0303L8.03033 15.5303L6.96967 14.4697L5.46967 15.9697L6.53033 17.0303ZM11.25 12.5C11.25 14.2949 9.79493 15.75 8 15.75V17.25C10.6234 17.25 12.75 15.1234 12.75 12.5H11.25Z" fill="currentColor"/>
		// <path d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C21.5093 4.43821 21.8356 5.80655 21.9449 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
		// `,
		//     },
		{
			name: 'Developer Experience',
			description:
				'Built in linting, type checking, formatting, and test framework. Run locally in your editor, and on Github CI.',
			newPage: true,
			linkText: 'Docs',
			link: 'https://github.com/CriticalMoments/CMSaasStarter?tab=readme-ov-file#developer-tools',
			svgContent: `<path d="M7 9C7 9.55228 6.55228 10 6 10C5.44772 10 5 9.55228 5 9C5 8.44772 5.44772 8 6 8C6.55228 8 7 8.44772 7 9Z" fill="currentColor"/>
<path d="M7 12C7 12.5523 6.55228 13 6 13C5.44772 13 5 12.5523 5 12C5 11.4477 5.44772 11 6 11C6.55228 11 7 11.4477 7 12Z" fill="currentColor"/>
<path d="M10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12Z" fill="currentColor"/>
<path d="M10 9C10 9.55228 9.55228 10 9 10C8.44772 10 8 9.55228 8 9C8 8.44772 8.44772 8 9 8C9.55228 8 10 8.44772 10 9Z" fill="currentColor"/>
<path d="M13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8C12.5523 8 13 8.44772 13 9Z" fill="currentColor"/>
<path d="M13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12Z" fill="currentColor"/>
<path d="M16 9C16 9.55228 15.5523 10 15 10C14.4477 10 14 9.55228 14 9C14 8.44772 14.4477 8 15 8C15.5523 8 16 8.44772 16 9Z" fill="currentColor"/>
<path d="M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z" fill="currentColor"/>
<path d="M19 9C19 9.55228 18.5523 10 18 10C17.4477 10 17 9.55228 17 9C17 8.44772 17.4477 8 18 8C18.5523 8 19 8.44772 19 9Z" fill="currentColor"/>
<path d="M19 12C19 12.5523 18.5523 13 18 13C17.4477 13 17 12.5523 17 12C17 11.4477 17.4477 11 18 11C18.5523 11 19 11.4477 19 12Z" fill="currentColor"/>
<path d="M2 11C2 8.17157 2 6.75736 2.87868 5.87868C3.75736 5 5.17157 5 8 5H16C18.8284 5 20.2426 5 21.1213 5.87868C22 6.75736 22 8.17157 22 11V13C22 15.8284 22 17.2426 21.1213 18.1213C20.2426 19 18.8284 19 16 19H8C5.17157 19 3.75736 19 2.87868 18.1213C2 17.2426 2 15.8284 2 13V11Z" stroke="currentColor" stroke-width="1.5"/>
<path d="M7 16H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
		},
		{
			name: 'Scalable',
			description: 'Handle new users and scale with horizontally scaling edge functions.',
			svgContent: `<path d="M3 22H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 11C3 10.0572 3 9.58579 3.29289 9.29289C3.58579 9 4.05719 9 5 9C5.94281 9 6.41421 9 6.70711 9.29289C7 9.58579 7 10.0572 7 11V17C7 17.9428 7 18.4142 6.70711 18.7071C6.41421 19 5.94281 19 5 19C4.05719 19 3.58579 19 3.29289 18.7071C3 18.4142 3 17.9428 3 17V11Z" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>
<path d="M10 7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5C12.9428 5 13.4142 5 13.7071 5.29289C14 5.58579 14 6.05719 14 7V17C14 17.9428 14 18.4142 13.7071 18.7071C13.4142 19 12.9428 19 12 19C11.0572 19 10.5858 19 10.2929 18.7071C10 18.4142 10 17.9428 10 17V7Z" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>
<path d="M17 4C17 3.05719 17 2.58579 17.2929 2.29289C17.5858 2 18.0572 2 19 2C19.9428 2 20.4142 2 20.7071 2.29289C21 2.58579 21 3.05719 21 4V17C21 17.9428 21 18.4142 20.7071 18.7071C20.4142 19 19.9428 19 19 19C18.0572 19 17.5858 19 17.2929 18.7071C17 18.4142 17 17.9428 17 17V4Z" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/>`
		},
		{
			name: 'Open Source',
			description:
				'GNU AGPL v3 licensed: free to use, modify, and share.',
			linkText: 'License',
			newPage: true,
			link: 'https://github.com/AnishSarkar22/Loopr/blob/main/LICENSE',
			svgContent: `
<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3a9 9 0 0 1 3.618 17.243l-2.193-5.602a3 3 0 1 0-2.849 0l-2.193 5.603A9 9 0 0 1 12 3" />
      `
		}
	];
</script>

<svelte:head>
	<title>Loopr</title>
	<meta
		name="description"
		content="Loopr is a monitoring platform for your websites and applications."
	/>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html jsonldScript}
</svelte:head>

<div class="hero min-h-[60vh]">
	<div class="hero-content py-12 text-center">
		<div class="max-w-xl">
			<div
				class="from-primary to-accent mb-3 bg-linear-to-r bg-clip-text pb-1 text-xl font-bold text-transparent mt-30 md:mt-5 md:mb-7 md:text-3xl"
			>
				Loopr
			</div>

			<div class="px-2 text-4xl font-bold mt:10 md:text-5xl" style="line-height: 1.3;">
				The
				<span class="decoration-secondary underline decoration-4 md:decoration-[6px]"
					>open source</span
				>,
				<span class="decoration-secondary underline decoration-4 md:decoration-[6px]"
					>lightning-fast</span
				>, and
				<span class="decoration-secondary underline decoration-4 md:decoration-[6px]"
					>easy-to-deploy</span
				>
				<span>monitoring platform</span>
			</div>
			<div class="mt-6 text-sm md:mt-15 md:text-lg">
				Built with <a href="https://kit.svelte.dev" class="link font-bold" target="_blank"
					>SvelteKit</a
				>,
				<a href="https://appwrite.io" class="link font-bold" target="_blank">Appwrite</a>,
				<a href="https://tailwindcss.com" class="link font-bold" target="_blank">Tailwind</a>,
				<a href="https://daisyui.com" class="link font-bold" target="_blank">DaisyUI</a>, and
				<a href="https://vitejs.dev" class="link font-bold" target="_blank">Vite</a>
			</div>
			<div class="mt-6 flex flex-row flex-wrap place-content-center gap-4 md:mt-7">
				<a href="https://github.com/AnishSarkar22/Loopr" target="_blank" rel="noopener">
					<button class="btn btn-primary flex items-center gap-2">
						<svg width="20" height="20" fill="currentColor" class="inline" viewBox="0 0 24 24">
							<path
								d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.44 24 17.12 24 12.02 24 5.74 18.27.5 12 .5z"
							/>
						</svg>
						Star on GitHub
					</button>
				</a>
				<a href="/signup">
					<button class="btn border-base-content/5 btn-outline border px-6">Signup</button>
				</a>
			</div>
		</div>
	</div>
</div>
<div class="min-h-[60vh]">
	<div class="px-7 pt-20 pb-8">
		<div class="mx-auto max-w-lg text-center">
			<div
				class="animate-gradient-x bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-4xl font-extrabold text-transparent drop-shadow-lg md:text-5xl md:mt-40 mt-50"
			>
				Explore the Features
			</div>
		</div>

		<div class="mx-auto mt-25 flex max-w-[1064px] flex-wrap place-content-center gap-10">
			{#each features as feature}
				<div class="card min-h-[300px] w-[270px] flex-none bg-gray-900 shadow-xl">
					<div class="card-body items-center p-[24px] pt-[32px] text-center">
						<div>
							<svg
								width="50px"
								height="50px"
								class="mt-1 mb-2 text-blue-100"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html feature.svgContent}
							</svg>
						</div>
						<h2 class="card-title">
							{feature.name}
						</h2>
						<p class="text-sm">
							{feature.description}
						</p>
						{#if feature.link}
							<a href={feature.link} class="pb-4" target={feature.newPage ? '_blank' : ''}>
								<button class="btn btn-xs btn-outline btn-primary min-w-[100px] rounded-full"
									>{feature.linkText ? feature.linkText : 'Try It'}</button
								>
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
<div class="hero mt-12 min-h-[60vh]">
	<div class="hero-content px-4 pt-4 pb-16 text-center">
		<div class="max-w-lg">
			<div class="flex flex-col items-center mt-4 mb-6 md:mb-20">
				<div class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent md:text-5xl">
					See it in Action
				</div>
				<div class="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded mt-2"></div>
			</div>
			<div class="mt-20 flex flex-col place-content-center content-center gap-6 lg:flex-row">
				<!-- for desktop view -->
				<div class="hidden md:block">
					<div class="mockup-browser bg-base-300 border-1 border-gray-900">
						<div class="mockup-browser-toolbar">
							<div class="input border">https://loopr-pi.vercel.app</div>
						</div>
						<img
							src="/images/dashboard-desktop.png"
							alt="Loopr Dashboard Screenshot"
							class="max-h-[600px] w-auto"
						/>
					</div>
				</div>
				<!-- For mobile view -->
				<div class="md:hidden">
					<a href="https://loopr-pi.vercel.app/" target="_blank" class="link">
						<div class="card overflow-hidden bg-base-300 border-1 border-gray-900 shadow-xl">
							<img
								alt="Screenshot of Loopr Dashboard"
								class="aspect-2044/1242"
								src="/images/dashboard-desktop.png"
							/>
						</div></a
					>
				</div>
				<!-- <div class="md:hidden justify-center">
					<div class="mockup-phone border-primary max-w-sm">
						<div class="mockup-phone-camera"></div>
						<div class="mockup-phone-display bg-base-100">
							<img
								alt="Screenshot of Loopr Dashboard"
								class="w-full h-full object-cover"
								src="/images/dashboard-phone.png"
							/>
						</div>
					</div>
				</div> -->
				<div class="mt-6 flex min-w-[270px] lg:mt-0 lg:min-w-[420px]">
					<div class="my-auto">
						<div class="px-4 text-lg md:text-xl">
							<strong>Loopr</strong> monitors your URLs and web services in real time.<br /><br />
							Stay notified and track uptime effortlessly, all in one place.
						</div>
						<div class="text-large mt-4">
							<a href="https://loopr-pi.vercel.app/" target="_blank">
								<button class="btn btn-primary btn-wide mt-3">Sign up</button>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes gradient-x {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}
	.animate-gradient-x {
		background-size: 200% 200%;
		animation: gradient-x 4s ease-in-out infinite;
	}
	.card {
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-8px);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}
	.card:hover svg {
		transform: scale(1.1);
	}

	.btn-outline {
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.btn-outline::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.btn-outline:hover::before {
		left: 100%;
	}
</style>
