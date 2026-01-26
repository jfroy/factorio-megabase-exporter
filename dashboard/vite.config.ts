import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Get git short hash at build time
const getGitHash = () => {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
};

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		strictPort: false,
		host: true
	},
	define: {
		'__GIT_HASH__': JSON.stringify(getGitHash())
	}
});
