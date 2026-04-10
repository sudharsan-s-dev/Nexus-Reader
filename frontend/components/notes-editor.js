/**
 * Notes Editor Component
 * Handles rich text editing and "insert location anchor" (deep link) features
 */

const editor = document.getElementById('notes-editor');
const addAnchorBtn = document.querySelector('.link-anchor-btn');
const toolbarBtns = document.querySelectorAll('.notes-toolbar .icon-btn:not(.link-anchor-btn)');

// Apply basic formatting
toolbarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const command = getCommandFromIcon(btn.querySelector('i').className);
        if (command) {
            document.execCommand(command, false, null);
            editor.focus();
        }
    });
});

function getCommandFromIcon(className) {
    if (className.includes('fa-bold')) return 'bold';
    if (className.includes('fa-italic')) return 'italic';
    if (className.includes('fa-list')) return 'insertUnorderedList';
    return null;
}

// Ensure editor content doesn't get messed up with raw divs
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.execCommand('insertLineBreak');
        e.preventDefault();
    }
});

// Deep Link Anchor Logic
addAnchorBtn.addEventListener('click', () => {
    // Calculate current scroll position in the document viewer
    const container = document.getElementById('doc-container');
    const scrollPos = container.scrollTop;
    
    // Find visible page
    const pages = document.querySelectorAll('.pdf-page');
    let visiblePageNum = 1;
    let shortestDist = Number.MAX_VALUE;

    pages.forEach(page => {
        const topDist = Math.abs(page.offsetTop - scrollPos);
        if (topDist < shortestDist) {
            shortestDist = topDist;
            visiblePageNum = page.dataset.pageNum || 1;
        }
    });

    // Create the anchor HTML
    const anchorId = 'anchor-' + Date.now();
    const anchorHTML = `<span class="doc-anchor" contenteditable="false" data-scroll="${scrollPos}" data-page="${visiblePageNum}" title="Click to go to Page ${visiblePageNum}"><i class="fa-solid fa-location-crosshairs"></i> Page ${visiblePageNum}</span>&nbsp;`;
    
    // Insert into editor at caret position
    editor.focus();
    insertHtmlAtCaret(anchorHTML);
    
    attachAnchorListeners();
});

// Helper to insert HTML at cursor
function insertHtmlAtCaret(html) {
    let sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            
            const el = document.createElement("div");
            el.innerHTML = html;
            let frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
}

// Function to attach click listeners to the anchors inside the editor
function attachAnchorListeners() {
    const anchors = editor.querySelectorAll('.doc-anchor');
    anchors.forEach(anchor => {
        // Remove old listener to avoid duplicates
        anchor.replaceWith(anchor.cloneNode(true));
    });
    
    // Re-select and add listener
    editor.querySelectorAll('.doc-anchor').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const scrollPos = parseInt(anchor.dataset.scroll) || 0;
            const container = document.getElementById('doc-container');
            container.scrollTo({
                top: scrollPos,
                behavior: 'smooth'
            });
            
            // Highlight effect on the container to give feedback
            container.style.boxShadow = 'inset 0 0 0 2px var(--accent-primary)';
            setTimeout(() => {
                container.style.boxShadow = '';
            }, 500);
        });
    });
}

// Initial attachment
attachAnchorListeners();

// Re-attach listeners when editor content changes (e.g., pasting notes back)
editor.addEventListener('input', () => {
    // Debounce listener attachment
    clearTimeout(window.editorTimeout);
    window.editorTimeout = setTimeout(() => {
        attachAnchorListeners();
    }, 500);
});
