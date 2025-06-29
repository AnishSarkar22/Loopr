<script lang="ts">
	import { goto } from '$app/navigation';
	
	function handleLogin() {
		goto('/login');
	}
	
	function handleSignup() {
		goto('/signup');
	}
</script>

<svelte:head>
	<title>Work in Progress</title>
</svelte:head>

<main>
	<!-- Animated background -->
	<div class="bg-animation">
		<div class="floating-shape shape1"></div>
		<div class="floating-shape shape2"></div>
		<div class="floating-shape shape3"></div>
		<div class="floating-shape shape4"></div>
	</div>
	
	<div class="container">
		<!-- Modern logo/icon -->
		<div class="logo-container">
			<div class="logo-circle">
				<div class="logo-inner">
					<div class="logo-dots">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Title with typewriter effect -->
		<div class="title-container">
			<h1 class="title">
				<span class="title-line">Work in</span>
				<span class="title-line emphasis">Progress</span>
			</h1>
		</div>
		
		<p class="subtitle">Crafting something extraordinary</p>
		
		<!-- Modern progress indicator -->
		<div class="progress-container">
			<div class="progress-ring">
				<svg class="progress-svg" viewBox="0 0 100 100">
					<circle cx="50" cy="50" r="45" class="progress-bg" />
					<circle cx="50" cy="50" r="45" class="progress-fill" />
				</svg>
				<div class="progress-text">
					<span class="progress-percent">73%</span>
					<span class="progress-label">Complete</span>
				</div>
			</div>
		</div>
		
		<!-- Modern glassmorphism buttons -->
		<div class="button-container">
			<button onclick={handleLogin} class="modern-btn login-btn">
				<span class="btn-text">Sign In</span>
				<div class="btn-shine"></div>
			</button>
			<button onclick={handleSignup} class="modern-btn signup-btn">
				<span class="btn-text">Get Started</span>
				<div class="btn-shine"></div>
			</button>
		</div>
		
		<!-- Status indicator -->
		<div class="status-container">
			<div class="status-dot"></div>
			<span class="status-text">System Status: Building</span>
		</div>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f0c29 50%, #000000 100%);
		min-height: 100vh;
		/* FIXED: Removed overflow: hidden and added proper overflow handling */
		overflow-x: hidden;
	}
	
	main {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		/* FIXED: Added proper width and overflow handling */
		width: 100%;
		max-width: 100vw;
		box-sizing: border-box;
	}
	
	/* Animated background shapes */
	.bg-animation {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		/* FIXED: Added overflow hidden here instead of body */
		overflow: hidden;
	}
	
	.floating-shape {
		position: absolute;
		background: linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
		border-radius: 50%;
		animation: float 20s infinite linear;
	}
	
	/* FIXED: Adjusted shape positions to prevent overflow */
	.shape1 {
		width: 300px;
		height: 300px;
		top: -150px;
		left: -150px;
		animation-delay: -5s;
	}
	
	.shape2 {
		width: 200px;
		height: 200px;
		top: 20%;
		right: -100px;
		animation-delay: -10s;
		animation-duration: 25s;
	}
	
	.shape3 {
		width: 150px;
		height: 150px;
		bottom: -75px;
		left: 30%;
		animation-delay: -15s;
		animation-duration: 30s;
	}
	
	.shape4 {
		width: 250px;
		height: 250px;
		top: 60%;
		right: 20%;
		animation-delay: -20s;
		animation-duration: 22s;
	}
	
	@keyframes float {
		0% { transform: translateY(0px) rotate(0deg); }
		25% { transform: translateY(-20px) rotate(90deg); }
		50% { transform: translateY(0px) rotate(180deg); }
		75% { transform: translateY(20px) rotate(270deg); }
		100% { transform: translateY(0px) rotate(360deg); }
	}
	
	.container {
		text-align: center;
		max-width: 600px;
		width: 100%;
		position: relative;
		z-index: 2;
		/* FIXED: Added proper responsive width handling */
		margin: 0 auto;
		box-sizing: border-box;
	}
	
	/* Modern logo */
	.logo-container {
		margin-bottom: 3rem;
		animation: fadeInDown 1s ease-out;
	}
	
	.logo-circle {
		width: 100px;
		height: 100px;
		margin: 0 auto;
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		animation: logoFloat 3s ease-in-out infinite;
	}
	
	.logo-inner {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}
	
	.logo-dots {
		display: flex;
		gap: 4px;
	}
	
	.logo-dots span {
		width: 6px;
		height: 6px;
		background: white;
		border-radius: 50%;
		animation: dotPulse 1.5s ease-in-out infinite;
	}
	
	.logo-dots span:nth-child(2) { animation-delay: 0.2s; }
	.logo-dots span:nth-child(3) { animation-delay: 0.4s; }
	
	@keyframes logoFloat {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}
	
	@keyframes dotPulse {
		0%, 100% { opacity: 0.3; transform: scale(0.8); }
		50% { opacity: 1; transform: scale(1.2); }
	}
	
	/* Modern title */
	.title-container {
		margin-bottom: 2rem;
	}
	
	.title {
		font-size: 4rem;
		font-weight: 800;
		margin: 0;
		line-height: 1.1;
	}
	
	.title-line {
		display: block;
		background: linear-gradient(135deg, #ffffff, #e5e7eb);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: fadeInUp 1s ease-out;
	}
	
	.title-line.emphasis {
		background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: fadeInUp 1s ease-out 0.3s both, shimmerText 3s ease-in-out infinite 2s;
	}
	
	@keyframes fadeInDown {
		from { opacity: 0; transform: translateY(-30px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	@keyframes shimmerText {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	
	.subtitle {
		font-size: 1.25rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 3rem;
		font-weight: 400;
		letter-spacing: 0.5px;
		animation: fadeInUp 1s ease-out 0.6s both;
	}
	
	/* Modern progress ring */
	.progress-container {
		margin-bottom: 4rem;
		animation: fadeInUp 1s ease-out 0.9s both;
	}
	
	.progress-ring {
		position: relative;
		width: 120px;
		height: 120px;
		margin: 0 auto;
	}
	
	.progress-svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	
	.progress-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.1);
		stroke-width: 8;
	}
	
	.progress-fill {
		fill: none;
		stroke: url(#gradient);
		stroke-width: 8;
		stroke-linecap: round;
		stroke-dasharray: 283;
		stroke-dashoffset: 76;
		animation: progressAnimation 3s ease-out 1.5s both;
	}
	
	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}
	
	.progress-percent {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		line-height: 1;
	}
	
	.progress-label {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-top: 2px;
	}
	
	@keyframes progressAnimation {
		from { stroke-dashoffset: 283; }
		to { stroke-dashoffset: 76; }
	}
	
	/* Modern buttons */
	.button-container {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		margin-bottom: 3rem;
		animation: fadeInUp 1s ease-out 1.2s both;
		/* FIXED: Added flex wrap for better responsiveness */
		flex-wrap: wrap;
	}
	
	.modern-btn {
		position: relative;
		padding: 1rem 2.5rem;
		border: none;
		border-radius: 50px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.btn-text {
		position: relative;
		z-index: 2;
	}
	
	.btn-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.6s ease;
	}
	
	.modern-btn:hover .btn-shine {
		left: 100%;
	}
	
	.login-btn {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}
	
	.login-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
	}
	
	.signup-btn {
		background: linear-gradient(135deg, #8b5cf6, #3b82f6);
		color: white;
		box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
	}
	
	.signup-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(139, 92, 246, 0.6);
	}
	
	/* Status indicator */
	.status-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		animation: fadeInUp 1s ease-out 1.5s both;
	}
	
	.status-dot {
		width: 8px;
		height: 8px;
		background: #10b981;
		border-radius: 50%;
		animation: statusPulse 2s ease-in-out infinite;
	}
	
	.status-text {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		font-weight: 500;
	}
	
	@keyframes statusPulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.2); }
	}
	
	/* FIXED: Enhanced responsive design */
	@media (max-width: 1024px) {
		main {
			padding: 1.5rem;
		}
		
		.title {
			font-size: 3.5rem;
		}
	}
	
	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}
		
		.title {
			font-size: 3rem;
		}
		
		.button-container {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}
		
		.modern-btn {
			width: 100%;
			max-width: 250px;
		}
		
		/* FIXED: Hide shapes on mobile instead of all small screens */
		.floating-shape {
			display: none;
		}
		
		.container {
			padding: 0 1rem;
		}
	}
	
	@media (max-width: 480px) {
		.title {
			font-size: 2.5rem;
		}
		
		.subtitle {
			font-size: 1.1rem;
		}
		
		main {
			padding: 0.5rem;
		}
	}
</style>

<!-- SVG gradient definition -->
<svg style="position: absolute; width: 0; height: 0;">
	<defs>
		<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
			<stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
			<stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
		</linearGradient>
	</defs>
</svg>