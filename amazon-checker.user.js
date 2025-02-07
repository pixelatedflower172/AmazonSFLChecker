// ==UserScript==
// @name         Amazon SFL Availability Checker
// @namespace    https://www.amazon.co.uk/*
// @version      1.4
// @description  Auto-checks saved-for-later items, alerts if available, and opens checkout.
// @match        https://www.amazon.com/gp/cart/view.html*
// @match        https://www.amazon.co.uk/gp/cart/view.html*
// @match        https://www.amazon.de/gp/cart/view.html*
// @match        https://www.amazon.fr/gp/cart/view.html*
// @match        https://www.amazon.it/gp/cart/view.html*
// @match        https://www.amazon.es/gp/cart/view.html*
// @match        https://www.amazon.ca/gp/cart/view.html*
// @match        https://www.amazon.com.au/gp/cart/view.html*
// @match        https://www.amazon.co.jp/gp/cart/view.html*
// @match        https://www.amazon.co.nl/gp/cart/view.html*
// @updateURL    https://raw.githubusercontent.com/pixelatedflower172/AmazonSFLChecker/main/amazon-checker.user.js
// @downloadURL  https://raw.githubusercontent.com/pixelatedflower172/AmazonSFLChecker/main/amazon-checker.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL = 2000; // Refresh every 5 seconds
    const SHOW_MORE_DELAY = 1500; // Wait after clicking "Show More"

    async function clickShowMore() {
        let showMoreButton = document.querySelector('.a-declarative [aria-labelledby="sc-saved-cart-show-more-text"]');

        if (showMoreButton) {
            console.log("🔄 Clicking 'Show More' button...");
            showMoreButton.click();
            await new Promise(resolve => setTimeout(resolve, SHOW_MORE_DELAY)); // Wait for items to load
        } else {
            console.log("✅ All items are visible. Proceeding to check availability.");
        }
    }

    function checkAvailability() {
        const savedItemsContainer = document.getElementById("sc-saved-cart-items");
        if (!savedItemsContainer) {
            console.error("❌ Saved for Later section not found!");
            return;
        }

        const items = savedItemsContainer.querySelectorAll('div[data-asin]');
        let availableItems = [];

        items.forEach(item => {
            const asin = item.getAttribute('data-asin');
            const offeringId = item.getAttribute('data-encoded-offering');
            const availability = item.querySelector('.a-size-small.a-color-price.sc-product-availability');
            const titleElement = item.querySelector('.a-truncate-cut');

            if (!titleElement) return; // Skip if no title

            const title = titleElement.innerText.trim();

            // Only alert if title contains "5080", "5090", or "5070"
            if (!/50(70|80|90)/.test(title)) return; 

            let previouslyUnavailable = GM_getValue(asin, true); // Default: was unavailable

            let isNowAvailable = asin && offeringId && (!availability || !availability.innerText.includes("Currently unavailable"));

            if (isNowAvailable && previouslyUnavailable) {
                GM_setValue(asin, false); // Mark as available now
                availableItems.push({ asin, offeringId, title });
            } else if (!isNowAvailable) {
                GM_setValue(asin, true); // Still unavailable
            }
        });

        if (availableItems.length > 0) {
            console.log("✅ Available Items Found:", availableItems);
            let itemNames = availableItems.map(item => item.title).join("\n");
            alert(`🎉 Items Available!\n\n${itemNames}`);

            availableItems.forEach(({ asin, offeringId, title }) => {
                let hostname = window.location.host;
                let splitStr = hostname.substring(hostname.indexOf('.') + 1);
                let checkoutUrl = `https://www.${splitStr}/gp/checkoutportal/enter-checkout.html/?&discoveredAsins.1=${asin}&asin=${asin}&quantity=1&buyNow=1&offeringID.1=${offeringId}`;
                console.log(`🛒 Checkout Link for "${title}":`, checkoutUrl);
                window.open(checkoutUrl, '_blank'); // Open checkout
            });
        } else {
            console.log("⏳ No new items available.");
        }

        setTimeout(() => {
            location.reload(); // Refresh page to check again
        }, CHECK_INTERVAL);
    }

    (async function() {
        await clickShowMore(); // Ensure all saved items are loaded first
        setTimeout(checkAvailability, 2000); // Wait 2s before checking
    })();
})();
