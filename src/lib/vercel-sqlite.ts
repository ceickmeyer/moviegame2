import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';

export async function downloadDatabaseIfOnVercel() {
    // Only attempt download if running on Vercel
    if (!env.VERCEL) {
        console.log('Not running on Vercel, skipping database download');
        return;
    }

    const databasePath = path.join(process.cwd(), 'data', 'moviegame.db');
    const databaseUrl = env.DATABASE_DOWNLOAD_URL;

    if (!databaseUrl) {
        console.warn('DATABASE_DOWNLOAD_URL not set, cannot download database');
        return;
    }

    try {
        // Ensure data directory exists
        await fs.mkdir(path.dirname(databasePath), { recursive: true });

        // Download database file
        const response = await fetch(databaseUrl);
        if (!response.ok) {
            throw new Error(`Failed to download database: ${response.statusText}`);
        }

        const databaseBuffer = await response.arrayBuffer();
        await fs.writeFile(databasePath, Buffer.from(databaseBuffer));

        console.log('Database downloaded successfully');
    } catch (error) {
        console.error('Error downloading database:', error);
    }
}