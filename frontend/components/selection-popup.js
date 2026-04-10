/**
 * Selection Popup Component
 * Handles showing the tooltip when text is selected in the document viewer
 */

const popup = document.getElementById('selection-popup');
const docPanel = document.getElementById('doc-panel');
let currentSelection = '';

// Listen for selection changes in the document panel
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    
    // Quick check if there is a selection
    if (!selection.isCollapsed && selection.toString().trim().length > 0) {
        // Debounce slightly to wait for the user to finish selecting
        clearTimeout(window.selectionTimeout);
        window.selectionTimeout = setTimeout(() => {
            handleSelection(selection);
        }, 300);
    } else {
        hidePopup();
    }
});

function handleSelection(selection) {
    // Make sure the selection is inside the document container
    const isInsideDoc = docContainer.contains(selection.anchorNode);
    if (!isInsideDoc) {
        hidePopup();
        return;
    }

    currentSelection = selection.toString().trim();

    // Get the bounding box of the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Show popup positioned above the selection
    showPopup(rect.left + (rect.width / 2), rect.top);
}

function showPopup(x, y) {
    popup.classList.remove('hidden');
    
    // Calculate positioning, keep within screen bounds
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    
    let top = y - popupHeight - 10;
    let left = x - (popupWidth / 2);
    
    if (top < 0) top = y + 20; // Show below if no room above
    if (left < 0) left = 10;
    if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

function hidePopup() {
    popup.classList.add('hidden');
}

// Button actions
document.getElementById('btn-meaning').addEventListener('click', () => {
    fetchMeaning(currentSelection);
});

document.getElementById('btn-translate').addEventListener('click', () => {
    fetchTranslation(currentSelection);
});

document.getElementById('btn-explain').addEventListener('click', () => {
    fetchExplanation(currentSelection);
});

document.getElementById('btn-wikipedia').addEventListener('click', () => {
    openWikipedia(currentSelection);
});

// Mock functions for knowledge integration (to be connected to backend)
async function fetchMeaning(text) {
    showKnowledgePanel();
    const container = document.getElementById('knowledge-container');
    container.innerHTML = `
        <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-book"></i> Meaning</h3>
            <p><strong>${text}</strong></p>
            <p style="margin-top: 8px; color: var(--text-secondary);">Fetching definition from API...</p>
        </div>
    `;

    try {
        const res = await fetch(`http://localhost:5000/api/meaning?word=${encodeURIComponent(text)}`);
        const data = await res.json();
        if (data.error || !data.meaning) {
            container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;"><h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-book"></i> Meaning</h3><p><strong>${text}</strong></p><p style="margin-top: 8px; color: var(--text-secondary);">${data.error || data.meaning}</p></div>`;
        } else {
            container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;"><h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-book"></i> Meaning</h3><p><strong>${text}</strong></p><p style="margin-top: 8px;">${data.meaning}</p></div>`;
            
            // Also try to fetch wiki info
            fetchWiki(text, container);
        }
    } catch (e) {
        container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;"><p>Failed to connect to backend.</p></div>`;
    }
}

async function fetchWiki(text, container) {
    try {
        const res = await fetch(`http://localhost:5000/api/wikipedia?query=${encodeURIComponent(text)}`);
        const data = await res.json();
        if (data.summary) {
            container.innerHTML += `
            <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px; color: var(--accent-secondary);"><i class="fa-brands fa-wikipedia-w"></i> Wikipedia</h3>
                <p style="margin-bottom: 8px;">${data.summary}</p>
                <a href="${data.url}" target="_blank" style="font-size: 12px;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Read more on Wikipedia</a>
            </div>`;
        }
    } catch (e) {
        // Silent fail for wiki
    }
}

async function openWikipedia(text) {
    if (!text) return;

    // 1. Open Wikipedia article in a new tab immediately
    const wikiSearchUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(text)}`;
    window.open(wikiSearchUrl, '_blank');

    // 2. Also show a preview card in the Knowledge panel
    showKnowledgePanel();
    const container = document.getElementById('knowledge-container');
    container.innerHTML = `
        <div class="knowledge-card wiki-preview-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin-bottom: 10px; color: var(--accent-secondary); display:flex; align-items:center; gap:8px;">
                <i class="fa-brands fa-wikipedia-w"></i> Wikipedia
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); font-style: italic; margin-bottom: 10px;">Searching: "${text}"</p>
            <div style="display:flex; gap:8px; align-items:center; justify-content:center; padding:16px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="color:var(--accent-secondary);"></i>
                <span>Loading Wikipedia preview...</span>
            </div>
        </div>
    `;

    try {
        const res = await fetch(`http://localhost:5000/api/wikipedia?query=${encodeURIComponent(text)}`);
        const data = await res.json();

        if (data.summary) {
            container.innerHTML = `
                <div class="knowledge-card wiki-preview-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                        <i class="fa-brands fa-wikipedia-w" style="font-size:20px; color:var(--accent-secondary);"></i>
                        <h3 style="margin:0; color:var(--accent-secondary);">${data.title}</h3>
                    </div>
                    <p style="line-height:1.65; margin-bottom:14px; font-size:14px;">${data.summary}</p>
                    <a href="${data.url}" target="_blank"
                       style="display:inline-flex; align-items:center; gap:6px; font-size:13px;
                              padding:6px 14px; border-radius:6px; text-decoration:none;
                              background:rgba(139,92,246,0.15); color:var(--accent-secondary);
                              border:1px solid rgba(139,92,246,0.35); transition:background 0.2s;"
                       onmouseover="this.style.background='rgba(139,92,246,0.28)'"
                       onmouseout="this.style.background='rgba(139,92,246,0.15)'">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open full article
                    </a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px;">
                    <h3 style="color:var(--accent-secondary); margin-bottom:8px;"><i class="fa-brands fa-wikipedia-w"></i> Wikipedia</h3>
                    <p style="color:var(--text-secondary);">No Wikipedia article found for "${text}".</p>
                    <a href="${wikiSearchUrl}" target="_blank" style="font-size:13px; color:var(--accent-secondary);">Search on Wikipedia →</a>
                </div>`;
        }
    } catch(e) {
        container.innerHTML = `
            <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px;">
                <p style="color:red;">Failed to fetch Wikipedia preview. <a href="${wikiSearchUrl}" target="_blank" style="color:var(--accent-secondary);">Open Wikipedia directly →</a></p>
            </div>`;
    }
}

async function fetchTranslation(text, lang = 'es') {
    showKnowledgePanel();
    const container = document.getElementById('knowledge-container');
    
    // We only want to show loading state if it's the first time
    if (!document.getElementById('lang-select')) {
        container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-language"></i> Translation</h3>
            <p style="margin-top: 8px; color: var(--text-secondary);">Translating: "${text}"...</p>
        </div>`;
    } else {
        document.getElementById('trans-result').innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Translating...`;
    }
    
    try {
        const res = await fetch('http://localhost:5000/api/translate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text, lang: lang})
        });
        const data = await res.json();
        
        // Define popular languages for the dropdown
        const languages = [
            {code: 'es', name: 'Spanish'},
            {code: 'fr', name: 'French'},
            {code: 'de', name: 'German'},
            {code: 'it', name: 'Italian'},
            {code: 'hi', name: 'Hindi'},
            {code: 'zh-CN', name: 'Chinese (Simplified)'},
            {code: 'ja', name: 'Japanese'},
            {code: 'ru', name: 'Russian'},
            {code: 'ar', name: 'Arabic'},
            {code: 'ta', name: 'Tamil'},
            {code: 'ko', name: 'Korean'}
        ];
        
        let optionsHtml = languages.map(l => 
            `<option value="${l.code}" ${l.code === lang ? 'selected' : ''}>${l.name}</option>`
        ).join('');

        container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="color: var(--accent-primary); margin: 0;"><i class="fa-solid fa-language"></i> Translation</h3>
                <select id="lang-select" style="padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-panel); color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer;">
                    ${optionsHtml}
                </select>
            </div>
            
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-style: italic;">Original: "${text}"</p>
            <div style="padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 6px; border-left: 3px solid var(--accent-primary);">
                <p id="trans-result" style="font-size: 15px; line-height: 1.5; color: var(--text-primary);">
                    ${data.error ? 'Error: ' + data.error : data.translation}
                </p>
            </div>
        </div>`;

        // Add event listener to select
        document.getElementById('lang-select').addEventListener('change', (e) => {
            fetchTranslation(text, e.target.value);
        });

    } catch(e) {
        container.innerHTML = `<div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px;">
            <p style="color: red;">Failed to connect to backend.</p>
        </div>`;
    }
}

async function fetchExplanation(text) {
    showKnowledgePanel();
    const container = document.getElementById('knowledge-container');
    container.innerHTML = `
        <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px; background: rgba(99, 102, 241, 0.05);">
            <h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Explanation</h3>
            <p style="font-style: italic; margin-bottom: 8px;">"${text}"</p>
            <div style="display: flex; gap: 8px; align-items: center; justify-content: center; padding: 20px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent-primary);"></i>
                <span>Simplifying concept...</span>
            </div>
        </div>
    `;
    
    try {
        const res = await fetch('http://localhost:5000/api/explain', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text})
        });
        const data = await res.json();
        container.innerHTML = `
        <div class="knowledge-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 16px; background: rgba(99, 102, 241, 0.05);">
            <h3 style="margin-bottom: 8px; color: var(--accent-primary);"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Explanation</h3>
            <p style="font-style: italic; margin-bottom: 12px; color: var(--text-secondary); border-left: 3px solid var(--accent-primary); padding-left: 8px;">"${text}"</p>
            <p style="line-height: 1.6;">${data.explanation}</p>
        </div>
        `;
    } catch(e) {
        container.innerHTML = `<p>Failed to connect to backend.</p>`;
    }
}

function showKnowledgePanel() {
    // Simulate clicking the knowledge tab
    const tabBtn = document.querySelector('.tab[data-target="knowledge-tab"]');
    if (tabBtn) tabBtn.click();
    hidePopup();
}
