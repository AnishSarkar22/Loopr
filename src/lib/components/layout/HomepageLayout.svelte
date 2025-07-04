<script lang="ts">
	import '../../../app.css';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="navbar bg-base-100 container mx-auto">
	<div class="flex-1">
		<a class="btn btn-ghost text-xl normal-case" href="/">Loopr</a>
	</div>
	<div class="flex-none">
		<ul class="menu menu-horizontal hidden px-1 text-lg sm:flex">
			<li class="md:mx-4">
				<a
					href="https://github.com/AnishSarkar22/Loopr"
					class=" navbar-btn border-base-300/100 flex items-center gap-2 rounded-xl border transition hover:text-white"
					target="_blank"
					rel="noopener"
					aria-label="Star Loopr on GitHub"
				>
					<!-- GitHub Icon SVG -->
					<svg
						width="18"
						height="18"
						fill="currentColor"
						class="inline"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.44 24 17.12 24 12.02 24 5.74 18.27.5 12 .5z"
						/>
					</svg>
					Star on GitHub
				</a>
			</li>
			<li class="navbar-btn border-base-content/5 rounded-xl border md:mx-2"><a href="/login">Login</a></li>
		</ul>
		<div class="dropdown dropdown-end sm:hidden">
			<!-- svelte-ignore a11y_label_has_associated_control -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<label tabindex="0" class="btn btn-ghost btn-circle">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h7"
					/></svg
				>
			</label>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<ul
				tabindex="0"
				class="menu menu-lg dropdown-content bg-base-100 rounded-box border-base-content/5 z-1 mt-3 w-52 border p-2 shadow-2xl"
			>
				<li><a href="/login">Login</a></li>
				<li class="md:mx-4">
					<a
						href="https://github.com/AnishSarkar22/Loopr"
						class="border-base-300/100 flex items-center gap-2 rounded-xl border transition hover:text-white"
						target="_blank"
						rel="noopener"
						aria-label="Star Loopr on GitHub"
					>
						<!-- GitHub Icon SVG -->
						<svg
							width="18"
							height="18"
							fill="currentColor"
							class="inline"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.44 24 17.12 24 12.02 24 5.74 18.27.5 12 .5z"
							/>
						</svg>
						Star on GitHub
					</a>
				</li>
			</ul>
		</div>
	</div>
</div>

<div class="">
	{@render children?.()}
</div>

<!-- Feedback Section -->
<section
	class="from-base-200 to-base-100 my-8 flex w-full flex-col items-center rounded-xl bg-gradient-to-b px-4 py-14 shadow-inner"
>
	<div class="flex w-full max-w-2xl flex-col items-center">
		<div class="mb-2 flex items-center gap-4">
			<h2 class="text-primary-400 mb-8 text-3xl font-extrabold sm:text-3xl">
				We'd Love Your Feedback!
			</h2>
		</div>
		<p class="mb-6 max-w-lg text-center text-gray-400">
			Help us make <span class="text-primary-400 font-semibold">Loopr</span> even better.<br />
			Share your ideas, report a bug, or just let us know how you're using the app!
		</p>
		<a
			href="mailto:anishsarkar282@gmail.com"
			class="bg-primary-500 hover:bg-primary-600 mb-2 inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white shadow-lg transition"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<rect
					x="3"
					y="5"
					width="18"
					height="14"
					rx="2"
					stroke="currentColor"
					stroke-width="2"
					fill="none"
				/>
				<path
					d="M3 7l9 6 9-6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					fill="none"
				/>
			</svg>
			anishsarkar282@gmail.com
		</a>
		<span class="mt-2 text-center text-xs text-gray-500">
			We reply to most messages within 24–48 hours (weekdays).
		</span>
	</div>
</section>

<!-- Spacer grows so the footer can be at bottom on short pages -->
<div class="grow"></div>
<div class="">
	<div class="mx-auto max-w-[1000px] border-t"></div>
	<footer class="flex w-full flex-col items-center gap-4 p-8 text-base">
		<nav class="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
			<a class="font-semibold hover:underline" href="/">Overview</a>
			<a class="font-semibold hover:underline" href="https://x.com/AnishSarkar22">Contact Me</a>
			<a
				class="font-semibold hover:underline"
				href="https://github.com/AnishSarkar22/Loopr"
				target="_blank"
				rel="noopener">Github</a
			>
		</nav>
		<aside class="text-center text-sm opacity-80">
			<p>
				Created with ❤️ by Anish Sarkar
				<!-- <a
          href="https://x.com/AnishSarkar22"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-primary"
          >Say hi on X!</a
        > -->
			</p>
			<p class="mt-1">© 2025 Loopr. All rights reserved.</p>
		</aside>
	</footer>
</div>

<style>
	.navbar-btn {
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.navbar-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.navbar-btn:hover::before {
		left: 100%;
	}
</style>
