(() => {
  // Override console.log so that our custom log container also shows logs.
  (function() {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      const logContainer = document.getElementById("consoleLogsContainer");
      if (logContainer) {
        const logEntry = document.createElement("p");
        logEntry.textContent = new Date().toLocaleTimeString() + " - " + args.join(" ");
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    };
  })();

  // Verify that we're on a product page.
  const asinElem = document.getElementById("ASIN");
  if (!asinElem) {
    console.log("No ASIN found. Not a product page. Extension inactive.");
    return;
  }
  const asin = asinElem.value;
  console.log("ASIN:", asin);
  const hostname = window.location.host;
  const domain = hostname.substring(hostname.indexOf('.') + 1);
  const offerIDOnly = false;

  const associateTags = {
    "co.uk": "corefinder-21",
    "de": "corefinder00-21",
    "es": "corefinder0-21",
    "fr": "corefinder01-21",
    "it": "corefinder02-21",
    "com": "corefinder-20",
    "pl": "corefinder0d-21",
    "se": "corefinder0b-21",
    "nl": "corefinder06-21",
    "be": "corefinder0a-21"
  };

  // Determine the TLD.
  let tld = "";
  if (domain.endsWith("co.uk")) {
    tld = "co.uk";
  } else {
    const parts = domain.split(".");
    tld = parts[parts.length - 1];
  }
  const assocTag = associateTags[tld] || "corefinder-21";

  let ATCURL = "";
  let newAsin, newOfferID;
  if (offerIDOnly) {
    if (asin.includes(":")) {
      const parts = asin.split(":");
      newAsin = parts[0];
      newOfferID = parts[1];
      ATCURL = `https://www.${domain}/gp/aws/cart/add.html/?AssociateTag=${assocTag}&OfferListingId.1=${newOfferID}&Quantity.1&ASIN.1=${newAsin}`;
    }
  } else {
    if (asin.length === 10 && !asin.includes(":")) {
      newAsin = asin;
      ATCURL = `https://www.${domain}/gp/aws/cart/add.html/?AssociateTag=${assocTag}&Quantity.1&ASIN.1=${newAsin}`;
    } else if (asin.includes(":")) {
      const parts = asin.split(":");
      newAsin = parts[0];
      newOfferID = parts[1];
      ATCURL = `https://www.${domain}/gp/aws/cart/add.html/?AssociateTag=${assocTag}&OfferListingId.1=${newOfferID}&Quantity.1&ASIN.1=${newAsin}`;
    }
  }
  console.log("Add to Cart URL:", ATCURL);

  const postData = new URLSearchParams();
  if (asin.includes(":")) {
    postData.append("OfferListingId.1", newOfferID);
    postData.append("ASIN.1", newAsin);
  } else {
    postData.append("ASIN.1", asin);
  }
  postData.append("Quantity.1", "1");

  let checkoutUrl = '';
  let priceLimit = 0;

  // Inject premium CSS.
  const style = document.createElement('style');
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes pulse { 
      0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); } 
      70% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); } 
      100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); } 
    }
    @keyframes shake {
      0% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
      100% { transform: translateX(0); }
    }
    @keyframes glitch {
      0% { transform: translate(0); opacity: 1; }
      20% { transform: translate(-2px, 2px); opacity: 0.8; }
      40% { transform: translate(-2px, -2px); opacity: 0.9; }
      60% { transform: translate(2px, 2px); opacity: 0.8; }
      80% { transform: translate(2px, -2px); opacity: 0.9; }
      100% { transform: translate(0); opacity: 1; }
    }

    /* Modal overlay */
    #priceModalOverlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      z-index: 999;
      animation: fadeIn 0.5s ease-out;
    }
    /* Price Modal */
    #priceModal {
      font-family: 'Montserrat', sans-serif;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1e1e2f;
      padding: 30px 40px;
      border-radius: 12px;
      box-shadow: 0 15px 30px rgba(0,0,0,0.6);
      color: #fff;
      z-index: 1000;
      animation: fadeIn 0.5s ease-out;
      text-align: center;
      width: 320px;
    }
    #priceModal h2 {
      margin-bottom: 20px;
      font-weight: 500;
      font-size: 24px;
    }
    #priceModal input {
      padding: 12px;
      width: 100%;
      border: none;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 18px;
      background: #2a2a3d;
      color: #fff;
      text-align: center;
    }
    #priceModal input.error {
      animation: shake 0.5s;
      border: 2px solid #ff4d4d;
    }
    #priceModal button {
      padding: 12px;
      width: 100%;
      border: none;
      border-radius: 6px;
      background: linear-gradient(45deg, #6a11cb, #2575fc);
      color: #fff;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    #priceModal button:hover {
      background: linear-gradient(45deg, #2575fc, #6a11cb);
    }
    
    /* Status Panel styling following Nielsen Norman heuristics */
    #statusPanel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(255,255,255,0.95);
      border: 1px solid #ddd;
      padding: 15px 20px 15px 40px;
      border-radius: 8px;
      font-family: 'Montserrat', sans-serif;
      color: #333;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.5s ease-out;
      z-index: 1000;
      line-height: 1.5;
      border-left: 6px solid #FF9900;
    }
    #statusPanel h3 {
      margin: 0 0 10px;
      font-size: 20px;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    #statusPanel h3 img {
      height: 30px;
      width: auto;
      object-fit: contain;
      margin-right: 8px;
    }
    /* Product Info within status panel */
    #productInfo {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      animation: fadeIn 1s ease-out;
    }
    #productImageStatus {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 4px;
      margin-right: 10px;
    }
    #productNameStatus {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    #statusPanel p {
      font-size: 14px;
      margin: 6px 0;
    }
    #statusPanel .edit-btn {
      background: none;
      border: none;
      font-size: 14px;
      color: #0073bb;
      cursor: pointer;
      margin-left: 5px;
    }
    #statusPanel .edit-btn:hover {
      text-decoration: underline;
    }
    #statusPanel input.price-edit {
      width: 80px;
      padding: 4px;
      font-size: 14px;
      margin-left: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #statusPanel .status-main {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
    }
    /* Animated Author Text */
    #animatedAuthor {
      display: inline-block;
      animation: glitch 1s infinite;
    }
    /* Toggable console logs container */
    #consoleLogsContainer {
      display: none;
      margin-top: 10px;
      padding: 10px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 150px;
      overflow-y: auto;
      font-size: 12px;
      color: #333;
    }
    #toggleLogsBtn {
      background: none;
      border: none;
      color: #0073bb;
      font-size: 14px;
      cursor: pointer;
      margin-top: 10px;
    }
    #toggleLogsBtn:hover {
      text-decoration: underline;
    }
    #sourceCodeLink {
    display: block;
    margin-top: 10px;
    text-align: center;
    color: #0073bb;
    font-size: 14px;
    text-decoration: none;
  }
  #sourceCodeLink:hover {
    text-decoration: underline;
  }
    /* In-stock pulse animation for product image */
    .in-stock-pulse {
      animation: pulse 1s infinite;
    }
  `;
  document.head.appendChild(style);

  // Update status panel details.
  function updateStatus(mainMessage, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = mainMessage;
      statusMessage.className = '';
      if (type === 'in-stock') {
        statusMessage.classList.add('in-stock');
      }
    }
  }
  function updateExtraStatus() {
    const priceElem = document.getElementById('priceLimitValue');
    const lastCheckedElem = document.getElementById('lastChecked');
    if (priceElem) {
      priceElem.textContent = priceLimit ? priceLimit : "Not Set";
    }
    if (lastCheckedElem) {
      const now = new Date();
      lastCheckedElem.textContent = now.toLocaleTimeString();
    }
  }
  // Populate product info in the status panel.
  function updateProductInfo() {
    const productTitleElem = document.getElementById("productTitle");
    const landingImageElem = document.getElementById("landingImage");
    const productNameStatus = document.getElementById("productNameStatus");
    const productImageStatus = document.getElementById("productImageStatus");

    if (productTitleElem && productNameStatus) {
      productNameStatus.textContent = productTitleElem.textContent.trim();
    } else {
      productNameStatus.textContent = "Unknown Product";
    }
    if (landingImageElem && productImageStatus) {
      productImageStatus.src = landingImageElem.src;
    }
  }

  async function checkStock(retryCount = 0) {
    try {
      updateStatus("Checking stock...", "info");
      updateExtraStatus();
      const response = await fetch(ATCURL, {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Device-Memory": "8",
          "Dnt": "1",
          "Downlink": "9.4",
          "Dpr": "2",
          "Ect": "4g",
          "Priority": "u=0, i",
          "Rtt": "100",
          "sec-ch-device-memory": "8",
          "sec-ch-dpr": "2",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "Windows",
          "sec-ch-ua-platform-version": "15.0.0",
          "sec-ch-viewport-width": "1053",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "User-Agent": navigator.userAgent
        },
        cache: "no-store"
      });
      if (!response.ok) {
        console.error("HTTP error", response.status);
        updateStatus("HTTP error " + response.status, "error");
        return false;
      }
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const csrfInput = doc.querySelector('#activeCartViewForm > input[type=hidden]');
      const csrfToken = csrfInput.value;
      const dataEncodedOfferingElement = doc.querySelector('input[name="OfferListingId.1"]');
      if (!dataEncodedOfferingElement) {
        console.log("No stock: Offer ID missing");
        updateStatus("No stock: Offer ID missing", "info");
        return false;
      }
      const dataEncodedOffering = dataEncodedOfferingElement.value;
      const priceElem = doc.querySelector('span.a-size-medium.a-color-base.sc-product-price.a-text-bold');
      if (!priceElem) {
        console.log("No stock: Price doesn't exist");
        updateStatus("Price info not found", "info");
        return false;
      }
      const priceText = priceElem.textContent.trim();
      let sanitized = priceText.replace(/[^0-9.]/g, '');
      if (sanitized.includes('.')) {
        let parts = sanitized.split('.');
        if (parts.length > 2) {
          let lastPart = parts.pop();
          sanitized = parts.join('') + '.' + lastPart;
        }
      }
      const price = Math.floor(parseFloat(sanitized));
      if (priceLimit < price) {
        console.log("Over limit");
        updateStatus("Price " + price + " exceeds limit", "info");
        return false;
      }
      
      postData.append("anti-csrftoken-a2z", csrfToken);
      postData.append("OfferListingId.1", dataEncodedOffering);

      const params = new URLSearchParams();
      params.append("partialCheckoutCart", "1");
      params.append("tangoWeblabStatus", "tango_prime_T1");
      params.append("isToBeGiftWrappedBefore", "0");
      params.append("proceedToCheckout", "1");
      params.append("pipelineType", "Chewbacca");
      params.append("referrer", "cart");
      params.append("ref_", "ox_sc_proceed");

      if (domain == 'amazon.co.uk') {
        const form = document.querySelector("form#sc-alm-ewc-buy-box-ptc-button-QW1hem9uIEZyZXNo");
        const hiddenInputs = form.querySelectorAll("input[type='hidden']");
        hiddenInputs.forEach(input => {
          params.append(input.name, input.value);
        });
        checkoutUrl = `https://www.${domain}/checkout/entry/cart?${params.toString()}`;
      } else {
        checkoutUrl = `https://www.${domain}/checkout/entry/cart?${params.toString()}`;
      }

      const cannotBuyDisclaimer = doc.querySelector("body > div > div:nth-child(2)");
      if (cannotBuyDisclaimer) {
        console.log("Blocked by disclaimer. Retrying...");
        updateStatus("Blocked by disclaimer. Retrying...", "info");
        if (retryCount < 3) {
          return checkStock(retryCount + 1);
        } else {
          console.log("Max retries reached");
          updateStatus("Max retries reached", "error");
          return false;
        }
      }
      const cartElem = doc.querySelector("#activeCartViewForm > div.a-row.a-spacing-mini.sc-list-body.sc-java-remote-feature > div > div");
      if (cartElem) {
        console.log("Stock detected!");
        updateStatus("In Stock!", "in-stock");
        // Add pulse effect to the product image.
        const productImageStatus = document.getElementById("productImageStatus");
        if (productImageStatus) {
          productImageStatus.classList.add("in-stock-pulse");
        }
        fetch(`https://www.${domain}/associates/addtocart`, {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded"
          },
          referrer: ATCURL,
          referrerPolicy: "strict-origin-when-cross-origin",
          body: postData.toString()
        });
        return true;
      } else {
        console.log("No stock.");
        updateStatus("Out of stock", "info");
        return false;
      }
    } catch (err) {
      console.error("Error checking stock:", err);
      updateStatus("Error checking stock", "error");
      return false;
    }
  }

  // Auto-refresh logic.
  function startAutoRefresh() {
    console.log("Starting auto-refresh...");
    const intervalId = setInterval(async () => {
      console.log("Refreshing stock check...");
      const inStock = await checkStock();
      if (inStock) {
        console.log("Product is in stock!");
        const utterance = new SpeechSynthesisUtterance("Product is in stock");
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
        clearInterval(intervalId);
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 500);
      } else {
        console.log("Product still out of stock. Next check in 10 seconds.");
      }
    }, 8000 + Math.random() * 2500);
  }

  // Build and inject the UI.
  (async () => {
    // Create overlay for the initial price modal.
    const overlay = document.createElement('div');
    overlay.id = 'priceModalOverlay';
    document.body.appendChild(overlay);

    // Create the price modal.
    const modal = document.createElement('div');
    modal.id = 'priceModal';
    const modalHeading = document.createElement('h2');
    modalHeading.textContent = 'Set Price Limit';
    modal.appendChild(modalHeading);
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'priceLimitInput';
    input.placeholder = 'Whole number only';
    modal.appendChild(input);
    const button = document.createElement('button');
    button.textContent = 'Confirm';
    button.addEventListener('click', validator);
    modal.appendChild(button);
    document.body.appendChild(modal);

    // Create the status panel.
    const statusPanel = document.createElement('div');
    statusPanel.id = 'statusPanel';
    statusPanel.innerHTML = `
      <h3>
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon Logo" />
        Stock Monitor
      </h3>
      <div id="productInfo">
        <img id="productImageStatus" src="" alt="Product Image" />
        <p id="productNameStatus">Loading...</p>
      </div>
      <p class="status-main" id="statusMessage">Waiting...</p>
      <p>Price Limit: 
        <span id="priceLimitValue">Not Set</span>
        <button class="edit-btn" id="editPriceButton">✎</button>
      </p>
      <p>Last Checked: <span id="lastChecked">N/A</span></p>
      <p><i>By   <span id="animatedAuthor">._.masteroogway._.</span></i></p>
      <p><a id="sourceCodeLink" href="https://github.com/pixelatedflower172/AmazonSFLChecker/blob/main/content%20-%20Copy.js" target="_blank" rel="noopener noreferrer">View Source Code</a></p>
      <button id="toggleLogsBtn">Show Logs</button>
      <div id="consoleLogsContainer"></div>
    `;
    document.body.appendChild(statusPanel);

    // Update product info from the current page.
    updateProductInfo();

    // Allow inline editing of the price limit.
    const editPriceButton = document.getElementById('editPriceButton');
    editPriceButton.addEventListener('click', () => {
      const priceLimitValue = document.getElementById('priceLimitValue');
      priceLimitValue.innerHTML = `<input type="number" class="price-edit" id="inlinePriceInput" value="${priceLimit !== 0 ? priceLimit : ''}" placeholder="Set price"/>`;
      const inlineInput = document.getElementById('inlinePriceInput');
      inlineInput.focus();
      inlineInput.addEventListener('blur', () => {
        const newValue = inlineInput.value;
        if(newValue.includes('.')) {
          inlineInput.classList.add('error');
          alert('Invalid input: Price must be a whole number');
          return;
        }
        priceLimit = parseFloat(newValue);
        priceLimitValue.textContent = priceLimit ? priceLimit : "Not Set";
      });
      inlineInput.addEventListener('keydown', (e) => {
        if(e.key === "Enter") {
          inlineInput.blur();
        }
      });
    });

    // Toggle console logs dropdown.
    const toggleLogsBtn = document.getElementById('toggleLogsBtn');
    toggleLogsBtn.addEventListener('click', () => {
      const logContainer = document.getElementById('consoleLogsContainer');
      if (logContainer.style.display === 'none' || !logContainer.style.display) {
        logContainer.style.display = 'block';
        toggleLogsBtn.textContent = 'Hide Logs';
      } else {
        logContainer.style.display = 'none';
        toggleLogsBtn.textContent = 'Show Logs';
      }
    });

    // Validate price input from the modal.
    function validator() {
      const priceInput = document.getElementById('priceLimitInput');
      const value = priceInput.value;
      if (value.includes('.')) {
        priceInput.classList.add('error');
        alert('Invalid input: Price must be a whole number');
        return;
      }
      priceLimit = parseFloat(value);
      document.getElementById('priceLimitValue').textContent = priceLimit;
      modal.style.display = 'none';
      overlay.style.display = 'none';
    }

    // Start the initial stock check.
    const inStock = await checkStock();
    if (inStock) {
      console.log("Product is in stock!");
      const utterance = new SpeechSynthesisUtterance("Product is in stock");
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);
    } else {
      startAutoRefresh();
    }
  })();
})();
