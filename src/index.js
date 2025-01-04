import { getDatabase, saveToMongoDB } from './utils/mongodb.js';
import { launchBrowser, extractAdsFromPage, processAds } from './utils/scraper.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_NAME = 'realEstateScraper';
const COLLECTION_NAME = 'listings';
const URL = "https://www.ss.lv/lv/real-estate/flats/riga/centre/hand_over/fDgSeF4belM=.html";

const getDetailedAds = async () => {
    let browser;
    let db;

    try {
        // Connect to MongoDB
        db = await getDatabase(DB_NAME);

        // Launch browser
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

        // Extract ads from main page
        const mainPageAds = await extractAdsFromPage(page);
        console.log(`Found ${mainPageAds.length} ads. Getting detailed information...`);

        // Process ads to get detailed information
        const detailedAds = await processAds(page, mainPageAds);

        // Save to MongoDB
        await saveToMongoDB(db, COLLECTION_NAME, detailedAds);

        // Also save to JSON file as backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `detailedAds_${timestamp}.json`;
        const dataDir = path.join(__dirname, 'data');
        const filePath = path.join(dataDir, filename);
        await fs.promises.writeFile(filePath, JSON.stringify(detailedAds, null, 2));
        console.log(`Backup saved to ${filePath}`);

    } catch (error) {
        const errorFilename = `error_${timestamp}.log`;
        const errorLogsDir = path.join(__dirname, 'data', 'errorlogs');
        if (!fs.existsSync(errorLogsDir)) {
            fs.mkdirSync(errorLogsDir, { recursive: true });
        }
        const errorFilePath = path.join(errorLogsDir, errorFilename);
        await fs.promises.writeFile(errorFilePath, `Error: ${error.message}\nStack: ${error.stack}`);
        console.log(`Error log saved to ${errorFilePath}`);
    } finally {
        if (browser) {
            await db.close();
            await db.client.close();
        }
        if (db) {
            await db.close();
            console.log('✅ MongoDB connection closed');
        }
    }
};

// Call the function to start the process
getDetailedAds();