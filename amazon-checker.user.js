// ==UserScript==
// @name         Amazon SFL Availability Checker
// @namespace    https://www.amazon.co.uk/*
// @version      1.1
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
// @updateURL    https://raw.githubusercontent.com/yourusername/yourrepo/main/amazon-checker.user.js
// @downloadURL  https://raw.githubusercontent.com/yourusername/yourrepo/main/amazon-checker.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL = 5000; // Refresh every 5 seconds
    const SCROLL_DELAY = 1000; // Wait 1 second between scrolls
    const MAX_SCROLL_ATTEMPTS = 10; // Prevent infinite scrolling

    async function loadAllItems() {
        let attempts = 0;
        let prevHeight = 0;

        while (attempts < MAX_SCROLL_ATTEMPTS) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

            let newHeight = document.body.scrollHeight;
            if (newHeight === prevHeight) break; // Stop if no new items loaded

            prevHeight = newHeight;
            attempts++;
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
        await loadAllItems(); // Ensure all saved items are loaded first
        setTimeout(checkAvailability, 2000); // Wait 2s before checking
    })();
})();
