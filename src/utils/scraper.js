import puppeteer from "puppeteer";

export const launchBrowser = async () => {
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1366, height: 768 }
    });
    console.log('✅ Browser launched');
    return browser;
};

export const extractAdsFromPage = async (page) => {
    return await page.evaluate(() => {
        const adElements = document.querySelectorAll("tr[id^='tr_']");
        
        // Convert NodeList of ad elements to an array and map over each ad element
        return Array.from(adElements).map(ad => {
            // Select all td elements with class 'msga2-o pp6' within the ad element
            const tdElements = ad.querySelectorAll("td.msga2-o.pp6");
            // Select the anchor element within the div with class 'd1'
            const urlElement = ad.querySelector("div.d1 a");
            // Select the image element with class 'isfoto' within the ad element
            const thumbnailImg = ad.querySelector("img.isfoto");

            // Return an object with the extracted ad details
            return {
            id: ad.getAttribute('id')?.replace('tr_', '') || "N/A", // Extract and clean the ad ID
            url: urlElement ? urlElement.href : "N/A", // Extract the URL of the ad
            title: urlElement ? urlElement.textContent.trim() : "N/A", // Extract the title of the ad
            location: tdElements[0]?.textContent?.trim() || "N/A", // Extract the location
            rooms: tdElements[1]?.textContent?.trim() || "N/A", // Extract the number of rooms
            area: tdElements[2]?.textContent?.trim() || "N/A", // Extract the area
            floor: tdElements[3]?.textContent?.trim() || "N/A", // Extract the floor
            series: tdElements[4]?.textContent?.trim() || "N/A", // Extract the series
            pricePerM2: tdElements[5]?.textContent?.trim() || "N/A", // Extract the price per square meter
            totalPrice: tdElements[6]?.textContent?.trim() || "N/A", // Extract the total price
            thumbnailUrl: thumbnailImg ? thumbnailImg.src : null // Extract the thumbnail image URL.git
            };
        });
        });
    };

export const extractDetailedInfo = async (page) => {
    return await page.evaluate(() => {
        const galleryImages = Array.from(document.querySelectorAll("#msg_div_msg img"))
            .map(img => img.src)
            .filter(src => src);

        const bigImage = document.querySelector("td.pic_td_big img");
        const bigImageUrl = bigImage ? bigImage.src : null;

        const thumbnailGallery = Array.from(document.querySelectorAll("td.pic_td_sm img"))
            .map(img => img.src)
            .filter(src => src);

        return {
            fullDescription: document.querySelector("#msg_div_msg")?.textContent?.trim() || "N/A",
            contactPhone: document.querySelector("td.contacts_table_cell")?.textContent?.trim() || "N/A",
            images: {
                mainImage: bigImageUrl,
                galleryImages: [...new Set([...galleryImages, ...thumbnailGallery])],
            },
            additionalDetails: Array.from(document.querySelectorAll("table.options_list tr")).map(row => ({
                label: row.querySelector("td:first-child")?.textContent?.trim() || "",
                value: row.querySelector("td:last-child")?.textContent?.trim() || ""
            }))
        };
    });
};

export const processAds = async (page, ads) => {
    const detailedAds = [];

    for (let i = 0; i < ads.length; i++) {
        const ad = ads[i];
        
        if (ad.url !== "N/A") {
            try {
                console.log(`Processing ad ${i + 1}/${ads.length}: ${ad.title}`);
                
                await page.goto(ad.url, { waitUntil: "domcontentloaded" });
                await page.waitForTimeout(1000);

                const detailedInfo = await extractDetailedInfo(page);

                detailedAds.push({
                    ...ad,
                    ...detailedInfo,
                    dateScrapped: new Date().toISOString(),
                    timestamp: Date.now()
                });

            } catch (error) {
                console.error(`Error processing ad ${ad.url}:`, error.message);
                detailedAds.push({
                    ...ad,
                    error: error.message,
                    dateScrapped: new Date().toISOString(),
                    timestamp: Date.now()
                });
            }
        }
    }

    return detailedAds;
};