

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const colorSelect = document.getElementById('colorSelect');
    const saveBtn = document.getElementById('saveBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const brightness = document.getElementById('brightness');
    const maxZoom = 4;
    const minZoom = 0.5;
    const zoomStep = 0.5;

    let pixelSize = 10; // Each pixel is 10x10
    let gridSize = 32; // 32x32 grid
    let history = []; // for undo/redo
    let historyIndex = -1; // current index in history
    let isDrawing = false;
    let isErasing = false;
    let zoomLevel = 1;
    let isSelectionMode = false;
    let selectedPixels = [];
    let selectionStart = null;
    let selectionEnd = null;
    let isDrawingLine = false;
    let lineStartX = null;
    let lineStartY = null;



    // Initialize canvas
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;


    // Function to draw or erase a pixel
    function updatePixel(x, y) {
        if (isErasing) {
            ctx.clearRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            ctx.fillStyle = adjustBrightness(colorSelect.value, brightness.value);
            x = Math.floor(x);
            y = Math.floor(y);
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
        updatePreview();
    }

    // Adjust color brightness (unchanged)
    function adjustBrightness(hex, brightness) {
        const color = hexToRgb(hex);
        return `rgb(${Math.round(color.r * brightness)}, ${Math.round(color.g * brightness)}, ${Math.round(color.b * brightness)})`;
    }
   
    // Change background color
    document.getElementById('bgColorSelect').addEventListener('input', function(event) {
        document.getElementById('pixelCanvas').style.backgroundColor = event.target.value;
        document.getElementById('previewCanvas').style.backgroundColor = event.target.value;
    });

    // Convert hex to RGB (unchanged)
    function hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Event listeners for mouse interactions with both left and right click

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('mousedown', function(event) {
        if (event.button === 0) { // Left click
            isDrawing = true;
        } else if (event.button === 2) { // Right click
            isErasing = true;
        }
        updatePixelFromEvent(event);
    });

    canvas.addEventListener('mousemove', function(event) {
        if (isDrawing || isErasing) {
            updatePixelFromEvent(event);
        }
    });

    canvas.addEventListener('mouseup', function(event) {
        if (event.button === 0) {
            isDrawing = false;
        } else if (event.button === 2) {
            isErasing = false;
        }
    });

    canvas.addEventListener('mouseleave', function() {
        isDrawing = false;
        isErasing = false;
    });

    function updatePixelFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / pixelSize);
        const y = Math.floor((event.clientY - rect.top) / pixelSize);
        
        // Save current state before drawing/erasing - only save once per drag start
        if (!history[historyIndex + 1]) {
            history = history.slice(0, historyIndex + 1);
            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            historyIndex++;
        }
        
        updatePixel(x, y);
    }

    // Undo functionality (unchanged)
    undoBtn.addEventListener('click', function() {
        if (historyIndex > 0) {
            historyIndex--;
            ctx.putImageData(history[historyIndex], 0, 0);
        }
    });

    // Redo functionality (unchanged)
    redoBtn.addEventListener('click', function() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            ctx.putImageData(history[historyIndex], 0, 0);
        }
    });

    // Default background color
    const defaultBgColor = '#ffffff'; // Set your default background color here
    

// Clear canvas with confirmation
clearBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the canvas and reset the background color?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.backgroundColor = defaultBgColor;
        document.getElementById('previewCanvas').style.backgroundColor = '#ffffff';
        document.getElementById('bgColorSelect').value = defaultBgColor;
        history = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        historyIndex = 0;
    
    // Update preview
    updatePreview();
    
    // Save to history
    saveToHistory();
    }
});

// Save button functionality (modified)
saveBtn.addEventListener('click', function() {
    const pixelCanvas = document.getElementById('pixelCanvas');
    const bgColor = document.getElementById('bgColorSelect').value;
    let wasGridOn = canvas.classList.contains('grid-overlay');
    canvas.classList.remove('grid-overlay');

    // Create a new canvas element
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pixelCanvas.width;
    tempCanvas.height = pixelCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the background color
    tempCtx.fillStyle = bgColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the pixel art on top of the background
    tempCtx.drawImage(pixelCanvas, 0, 0);

    // Save the image
    const link = document.createElement('a');
    link.download = 'pixel_art.png';
    link.href = tempCanvas.toDataURL();
    link.click();
    if (wasGridOn) {
        canvas.classList.add('grid-overlay');
    }
});



// Get zoom control elements
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomLevelDisplay = document.getElementById('zoomLevel');

// Apply zoom transform to canvas
function updateZoom() {
    canvas.style.transform = `scale(${zoomLevel})`;
    canvas.style.transformOrigin = 'top left';
    zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
}

// Zoom in button handler
zoomInBtn.addEventListener('click', () => {
    if (zoomLevel < maxZoom) {
        zoomLevel += zoomStep;
        updateZoom();
    }
    updatePreview();
});

// Zoom out button handler 
zoomOutBtn.addEventListener('click', () => {
    if (zoomLevel > minZoom) {
        zoomLevel -= zoomStep;
        updateZoom();
    }
    updatePreview();
});

// Update mouse position calculation for zoomed canvas
function updatePixelFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / (pixelSize * zoomLevel));
    const y = Math.floor((event.clientY - rect.top) / (pixelSize * zoomLevel));
    
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        if (!history[historyIndex + 1]) {
            history = history.slice(0, historyIndex + 1);
            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            historyIndex++;
        }
        updatePixel(x, y);
    }
}

// Adding function to hide overflow when zoomed in
function updateZoom() {
    canvas.style.transform = `scale(${zoomLevel})`;
    canvas.style.transformOrigin = 'top left';
    zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    
    // Toggle scrollbars
    const container = document.querySelector('.canvas-container');
    if (zoomLevel === 1) {
        container.classList.add('no-scroll');
    } else {
        container.classList.remove('no-scroll');
    }
}

// Grid toggle
document.getElementById('gridToggle').addEventListener('click', function() {
    canvas.classList.toggle('grid-overlay');
});

// Add preview window
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

function updatePreview() {
    // Clear preview
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw main canvas content to preview
    previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
}

// Export as svg
function exportAsSVG() {
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;

    // Add background
    svgContent += `<rect x="0" y="0" width="${canvas.width}" height="${canvas.height}" fill="${canvas.style.backgroundColor || '#ffffff'}"/>`;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Group pixels by color
    const colorPaths = {};
    for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
            const i = (y * canvas.width + x) * 4;
            if (data[i + 3] > 0) { // If pixel is not transparent
                const color = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
                if (!colorPaths[color]) {
                    colorPaths[color] = [];
                }
                colorPaths[color].push([Math.floor(x), Math.floor(y)]);
            }
        }
    }

    // Convert grouped pixels into paths
    for (let color in colorPaths) {
        let pathData = colorPaths[color].map(([x, y]) => `M${x} ${y}h${pixelSize}v${pixelSize}h-${pixelSize}z`).join(' ');
        svgContent += `<path d="${pathData}" fill="${color}" stroke="none"/>`;
    }

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pixel-art.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

document.getElementById('exportSvgBtn').addEventListener('click', exportAsSVG);

// Line drawing:

// New functions for line drawing
function redrawLine(event) {
    const rect = canvas.getBoundingClientRect();
    let endX = Math.floor((event.clientX - rect.left) / (pixelSize * zoomLevel));
    let endY = Math.floor((event.clientY - rect.top) / (pixelSize * zoomLevel));

    // Clear the canvas and redraw the last state before drawing the line
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(history[historyIndex], 0, 0);

    if (event.shiftKey) { // If Shift is pressed, draw a straight line
        if (Math.abs(lineStartX - endX) > Math.abs(lineStartY - endY)) {
            endY = lineStartY; // Horizontal line
        } else {
            endX = lineStartX; // Vertical line
        }
    }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(lineStartX * pixelSize + pixelSize / 2, lineStartY * pixelSize + pixelSize / 2);
    ctx.lineTo(endX * pixelSize + pixelSize / 2, endY * pixelSize + pixelSize / 2);
    ctx.strokeStyle = adjustBrightness(colorSelect.value, brightness.value);
    ctx.lineWidth = pixelSize;
    ctx.lineCap = "round";
    ctx.stroke();
}

function finishLine(event) {
    // Save the current state with the line drawn
    history = history.slice(0, historyIndex + 1);
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex++;
    updatePreview();
}

});