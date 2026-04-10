/**
 * Document Viewer Component
 * Handles PDF loading, rendering, navigation, and text selection
 */

const docContainer = document.getElementById('doc-container');
const fileUpload = document.getElementById('file-upload');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomLevelSpan = document.querySelector('.zoom-level');

let currentPdf = null;
let currentScale = 1.0;
let pdfDoc = null;

// Handle file upload
fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
        renderPdf(file);
    } else {
        alert('Only PDF supported in this first version!');
    }
});

async function renderPdf(file) {
    try {
        // Clear empty state and loading
        docContainer.innerHTML = '<div style="padding: 24px; text-align: center;">Loading document...</div>';
        
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF using pdf.js
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Clear container completely
        docContainer.innerHTML = '';
        
        // Render all pages (lazy loading can be added for large PDFs)
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            await renderPage(pageNum);
        }
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        docContainer.innerHTML = `<div class="empty-state"><h3>Error Loading Document</h3><p>${error.message}</p></div>`;
    }
}

async function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: currentScale });

    // Create wrapper for the page
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page page'; // added 'page' class which pdf_viewer.css uses
    pageWrapper.style.position = 'relative';
    pageWrapper.style.marginBottom = '24px';
    pageWrapper.style.boxShadow = 'var(--shadow-md)';
    pageWrapper.dataset.pageNum = pageNum;
    // CRITICAL: Explicitly constrain the wrapper to the viewport dimensions
    pageWrapper.style.width = `${viewport.width}px`;
    pageWrapper.style.height = `${viewport.height}px`;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.display = 'block';
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    
    // Create text layer
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;
    // Supply CSS variable expected by pdf_viewer.min.css in v3.x
    textLayer.style.setProperty('--scale-factor', viewport.scale);

    pageWrapper.appendChild(canvas);
    pageWrapper.appendChild(textLayer);
    docContainer.appendChild(pageWrapper);

    // Render Canvas
    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };

    await page.render(renderContext).promise;

    // Render Text Layer
    const textContent = await page.getTextContent();
    pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: []
    });
}

// Zoom functionality (rudimentary: re-renders)
zoomInBtn.addEventListener('click', () => {
    currentScale += 0.2;
    updateZoom();
});

zoomOutBtn.addEventListener('click', () => {
    if (currentScale > 0.4) {
        currentScale -= 0.2;
        updateZoom();
    }
});

function updateZoom() {
    zoomLevelSpan.textContent = Math.round(currentScale * 100) + '%';
    if (pdfDoc) {
        // Simple re-render logic. Could be optimized.
        const file = fileUpload.files[0];
        if (file) renderPdf(file);
    }
}
