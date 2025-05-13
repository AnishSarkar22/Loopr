<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    
    let glitchText = '';
    const text = "404";
    
    function glitch() {
        const chars = '!<>-_\\/[]{}—=+*^?#';
        let counter = 0;
        
        const interval = setInterval(() => {
            glitchText = text
                .split('')
                .map((char, i) => {
                    if (Math.random() < 0.1) {
                        return chars[Math.floor(Math.random() * chars.length)];
                    }
                    return char;
                })
                .join('');
            
            counter++;
            if (counter > 30) {
                clearInterval(interval);
                glitchText = text;
            }
        }, 50);
    }

    onMount(() => {
        glitch();
        setInterval(glitch, 5000);
    });
</script>

<style>
    .glitch {
        font-size: clamp(5rem, 15vw, 20rem);
        line-height: 1;
        text-shadow: 
            0.05em 0 0 rgba(255, 0, 0, 0.75),
            -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
            0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
        animation: glitch 500ms infinite;
        letter-spacing: -0.05em;
    }

    @keyframes glitch {
        0% {
            text-shadow: 
                0.05em 0 0 rgba(255, 0, 0, 0.75),
                -0.05em -0.025em 0 rgba(0, 255, 0, 0.75),
                -0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
        }
        14% {
            text-shadow: 
                0.05em 0 0 rgba(255, 0, 0, 0.75),
                -0.05em -0.025em 0 rgba(0, 255, 0, 0.75),
                -0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
        }
        15% {
            text-shadow: 
                -0.05em -0.025em 0 rgba(255, 0, 0, 0.75),
                0.025em 0.025em 0 rgba(0, 255, 0, 0.75),
                -0.05em -0.05em 0 rgba(0, 0, 255, 0.75);
        }
        49% {
            text-shadow: 
                -0.05em -0.025em 0 rgba(255, 0, 0, 0.75),
                0.025em 0.025em 0 rgba(0, 255, 0, 0.75),
                -0.05em -0.05em 0 rgba(0, 0, 255, 0.75);
        }
        50% {
            text-shadow: 
                0.025em 0.05em 0 rgba(255, 0, 0, 0.75),
                0.05em 0 0 rgba(0, 255, 0, 0.75),
                0 -0.05em 0 rgba(0, 0, 255, 0.75);
        }
        99% {
            text-shadow: 
                0.025em 0.05em 0 rgba(255, 0, 0, 0.75),
                0.05em 0 0 rgba(0, 255, 0, 0.75),
                0 -0.05em 0 rgba(0, 0, 255, 0.75);
        }
        100% {
            text-shadow: 
                -0.025em 0 0 rgba(255, 0, 0, 0.75),
                -0.025em -0.025em 0 rgba(0, 255, 0, 0.75),
                -0.025em -0.05em 0 rgba(0, 0, 255, 0.75);
        }
    }

    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        width: 100%;
    }
    
</style>

<div class="container" in:fade>
    <div class="hero-content text-center">
        <div class="max-w-md">
            <h1 class="text-primary mb-5 text-9xl font-black glitch">{glitchText}</h1>
            <h2 class="mb-5 text-2xl font-bold">Page Not Found</h2>
            <p class="mb-8 opacity-70">The page you're looking for doesn't exist or has been moved.</p>
            <a href="/" class="btn btn-primary hover:scale-105 transition-transform">
                Return Home
            </a>
        </div>
    </div>
</div>