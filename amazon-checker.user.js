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
    const STORAGE_KEY = "amazonSFLItems"; // LocalStorage key for tracking availability

    function getStoredItems() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }

    function saveStoredItems(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function checkAvailability() {
        const savedItemsContainer = document.getElementById("sc-saved-cart-items");
        if (!savedItemsContainer) {
            console.error("❌ Saved for Later section not found!");
            return;
        }

        const storedItems = getStoredItems();
        const items = savedItemsContainer.querySelectorAll('div[data-asin]');
        let updatedItems = { ...storedItems };
        let newAvailableItems = [];

        items.forEach(item => {
            const asin = item.getAttribute('data-asin');
            const offeringId = item.getAttribute('data-encoded-offering');
            const availability = item.querySelector('.a-size-small.a-color-price.sc-product-availability');

            let isAvailable = asin && offeringId && (!availability || !availability.innerText.includes("Currently unavailable"));

            if (isAvailable) {
                if (!storedItems[asin]) {
                    // New availability found!
                    updatedItems[asin] = offeringId;
                    newAvailableItems.push({ asin, offeringId });
                }
            } else {
                // Remove unavailable items from storage
                delete updatedItems[asin];
            }
        });

        if (newAvailableItems.length > 0) {
            console.log("✅ Available Items Found:", newAvailableItems);
            alert(`🎉 Items Available! Check Console for ASINs.`);

            newAvailableItems.forEach(({ asin, offeringId }) => {
                let hostname = window.location.host;
                let splitStr = hostname.substring(hostname.indexOf('.') + 1);
                let checkoutUrl = `https://www.${splitStr}/gp/aws/cart/add.html?ASIN.1=${asin}&offeringID.1=${offeringId}&Quantity.1=1`;
                console.log(`🛒 Checkout Link for ASIN ${asin}:`, checkoutUrl);
                window.open(checkoutUrl, '_blank'); // Open checkout
            });
        } else {
            console.log("⏳ No new items available.");
        }

        saveStoredItems(updatedItems); // Save updated availability status

        setTimeout(() => {
            location.reload(); // Refresh page to check again
        }, CHECK_INTERVAL);
    }

    setTimeout(checkAvailability, 5000); // Run 5s after page load
})();
