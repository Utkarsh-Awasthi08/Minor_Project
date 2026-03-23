console.log("Extension Loaded ✅");

// 🔥 inject script into page (important)
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// 🧠 get code from injected script
function getCode() {
    return new Promise((resolve) => {
        window.postMessage({ type: "GET_CODE" }, "*");

        function handler(event) {
            if (event.data.type === "CODE_RESULT") {
                window.removeEventListener("message", handler);
                resolve(event.data.code);
            }
        }

        window.addEventListener("message", handler);
    });
}




























// console.log("Extension Loaded ✅");
// function getCode() {
    
//     try {
//         console.log("Attempting to access Monaco Editor...");
//         if (!window.monaco)
//         {
//             console.log("Monaco Editor not found on the page.");
//          return null;
//         }
//         console.log("Monaco Editor found:", window.monaco);
//         const models = window.monaco.editor.getModels();
//         if (!models.length) return null;
//         console.log(models[0].getValue());
//         return models[0].getValue();
//     } catch (e) {
//         console.error("Error accessing Monaco Editor:", e);
//     }
// }
let problemName = "";

function getProblemNameFromURL() {
    const url = window.location.pathname;

    // Extract the slug between /problems/ and next /
    const match = url.match(/\/problems\/([^\/]+)\//);

    if (match) {
        let slug = match[1]; // e.g. "recover-binary-search-tree"

        // Convert to formatted name
        problemName = slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    } else {
        problemName = "Unknown";
    }

    console.log("Problem Name:", problemName);
}

getProblemNameFromURL();

function getResultContainer() {
    return document.querySelector('[data-layout-path="/ts0/t1"]');
}

function getError() {
    const container = getResultContainer();
    if (!container) return null;

    const errorEl = container.querySelector('div[class="font-menlo whitespace-pre-wrap break-all text-xs text-red-60 dark:text-red-60"]');
    return errorEl ? errorEl.innerText.trim() : null;
}

function getResultStatus() {
    const container = getResultContainer();
    if (!container) return null;
    const errorEl = container.querySelector('span[class*="text-red"]');
    const success = container.querySelector('[data-e2e-locator="submission-result"]');

    if(errorEl)
    return errorEl ? errorEl.innerText.trim() : null;
    
    else if(success)
    return success ? success.innerText.trim() : null;
}

async function captureData() {
    const code = await getCode();
    const error = getError();
    const status = getResultStatus();
    const url = window.location.href;
    console.log("Attempting to capture data...");
    console.log("URL:", url);
    console.log("Error:", error);
    console.log("Status:", status);
    console.log("Code:", code);
    if (!code) return;

    const data = {
        problem: problemName,
        url,
        code,
        error,
        status,
        timestamp: new Date().toISOString()
    };


    console.log("Captured Data:", data);
    submissionTriggered = false;
    // Save locally (temporary)
    chrome.storage.local.set({ lastSubmission: data });
}

let submissionTriggered = false;

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-e2e-locator="console-submit-button"]');

    if (btn) {
        submissionTriggered = true;
        console.log("Submission triggered");
    }
});

const observer = new MutationObserver(() => {
    const resultPanel = document.querySelector('[data-layout-path="/ts0/tb1"]');
    console.log("DOM changed, checking for result panel...");
    if (resultPanel && submissionTriggered) {
        observer.disconnect();
        setTimeout(() => {
            console.log("Result panel detected, capturing data...");
            captureData();
            console.log("Data captured, resetting submission trigger.");
            submissionTriggered = false;
        }, 6000);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});