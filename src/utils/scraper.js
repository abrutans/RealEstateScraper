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
        
        return Array.from(adElements).map(ad => {
            const td_elements = ad.querySelectorAll("td.msga2-o.pp6");
            const url = ad.querySelector("div.d1 a")?.href || "N/A";
            const id = ad.getAttribute('id')?.replace('tr_', '') || "N/A";
            const thumbnailImg = ad.querySelector("img.isfoto");
            const thumbnailUrl = thumbnailImg ? thumbnailImg.src : null;

            return {
                id: id,
                url: url,
                title: ad.querySelector("div.d1 a")?.textContent?.trim() || "N/A",
                location: td_elements[0]?.textContent?.trim() || "N/A",
                rooms: td_elements[1]?.textContent?.trim() || "N/A",
                area: td_elements[2]?.textContent?.trim() || "N/A",
                floor: td_elements[3]?.textContent?.trim() || "N/A",
                series: td_elements[4]?.textContent?.trim() || "N/A",
                pricePerM2: td_elements[5]?.textContent?.trim() || "N/A",
                totalPrice: td_elements[6]?.textContent?.trim() || "N/A",
                thumbnailUrl: thumbnailUrl
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