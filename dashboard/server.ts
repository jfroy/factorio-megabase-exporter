/// <reference types="bun-types" />
import { watch } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const PORT = 3000;

// Environment configuration
const FACTORIO_PATH = process.env.FACTORIO_PATH || join(import.meta.dir, '..', '..', '..');
const STATS_PATH = join(FACTORIO_PATH, 'script-output', 'megabase-exporter', 'stats.json');
const TECH_ASSET_PATHS = [
	join(FACTORIO_PATH, 'data', 'base', 'graphics', 'technology'),
	join(FACTORIO_PATH, 'data', 'space-age', 'graphics', 'technology')
];
const FAVICON_PATH = join(FACTORIO_PATH, 'data', 'core', 'graphics', 'factorio.png');
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

		// Serve favicon from game data
		if (url.pathname === '/favicon.png') {
			const faviconFile = Bun.file(FAVICON_PATH);
			if (await faviconFile.exists()) {
				return new Response(faviconFile, {
					headers: {
						'Content-Type': 'image/png',
						'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
					}
				});
			}
			return new Response('Favicon not found', { status: 404 });
		}

	// API endpoint for technology assets
	if (url.pathname.startsWith('/api/assets/technology/')) {
		const assetName = url.pathname.replace('/api/assets/technology/', '');
		
		// Try each tech asset path
		for (const techPath of TECH_ASSET_PATHS) {
			const assetFile = Bun.file(join(techPath, assetName));
			if (await assetFile.exists()) {
				return new Response(assetFile, {
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
					}
				});
			}
			console.log(`Tech asset ${assetName} not found at ${assetFile.name}`);
		}
		
		// Fallback: try stripping the number suffix (e.g., worker-robot-speed-7.png -> worker-robot-speed.png)
		// This handles technologies that share the same asset file
		const match = assetName.match(/^(.+)-(\d+)(\.png)$/);
		if (match) {
			const [, baseName, , extension] = match;
			const fallbackAssetName = `${baseName}${extension}`;
			
			for (const techPath of TECH_ASSET_PATHS) {
				const assetFile = Bun.file(join(techPath, fallbackAssetName));
				if (await assetFile.exists()) {
					return new Response(assetFile, {
						headers: {
							'Access-Control-Allow-Origin': '*',
							'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
						}
					});
				}
				console.log(`Tech asset ${assetName} not found at ${assetFile.name}`);
			}
		}
		
		return new Response('Asset not found', { status: 404 });
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
🎨 Assets endpoint: http://localhost:${server.port}/api/assets/technology/
📁 Serving from: ${BUILD_DIR}
📝 Watching: ${STATS_PATH}
🎮 Factorio path: ${FACTORIO_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
