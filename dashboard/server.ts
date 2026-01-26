import { watch } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const PORT = 3000;
const STATS_PATH = join(import.meta.dir, '..', '..', '..', 'script-output', 'megabase-exporter', 'stats.json');
const BUILD_DIR = join(import.meta.dir, 'build');

let cachedStats: string | null = null;
let statsLastModified: number = 0;

// Load stats.json into cache
async function loadStats(): Promise<string> {
	try {
		const content = await readFile(STATS_PATH, 'utf-8');
		const stats = await stat(STATS_PATH);
		statsLastModified = stats.mtimeMs;
		cachedStats = content;
		console.log(`📊 Loaded stats.json (${content.length} bytes)`);
		return content;
	} catch (error) {
		console.error('❌ Error loading stats.json:', error);
		return '{"error": "Stats file not found"}';
	}
}

// Watch for stats.json changes
watch(STATS_PATH, async (eventType) => {
	if (eventType === 'change') {
		console.log('🔄 stats.json changed, reloading...');
		await loadStats();
	}
});

// Initial load
await loadStats();

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// API endpoint for stats
		if (url.pathname === '/api/stats') {
			return new Response(cachedStats || '{"error": "No stats available"}', {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Cache-Control': 'no-cache'
				}
			});
		}

		// Serve static files from build directory
		try {
			const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
			const fullPath = join(BUILD_DIR, filePath);

			const file = Bun.file(fullPath);
			const exists = await file.exists();

			if (exists) {
				return new Response(file);
			}

			// Fallback to index.html for SPA routing
			const indexFile = Bun.file(join(BUILD_DIR, 'index.html'));
			if (await indexFile.exists()) {
				return new Response(indexFile);
			}

			return new Response('Not Found', { status: 404 });
		} catch (error) {
			console.error('Error serving file:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}
});

console.log(`
🚀 Factorio Megabase Dashboard Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server running at: http://localhost:${server.port}
📊 Stats endpoint: http://localhost:${server.port}/api/stats
📁 Serving from: ${BUILD_DIR}
📝 Watching: ${STATS_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
