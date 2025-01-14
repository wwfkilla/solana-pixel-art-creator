

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
    let isDraggingSelection = false;


    // Initialize canvas
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;
    ctx.imageSmoothingEnabled = false;


    // Function to draw or erase a pixel
    function updatePixel(x, y) {
        if (isErasing) {
            ctx.clearRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            ctx.fillStyle = adjustBrightness(colorSelect.value, brightness.value);
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }

    // Adjust color brightness (unchanged)
    function adjustBrightness(hex, brightness) {
        const color = hexToRgb(hex);
        return `rgb(${Math.round(color.r * brightness)}, ${Math.round(color.g * brightness)}, ${Math.round(color.b * brightness)})`;
    }
   
    // Change background color
    document.getElementById('bgColorSelect').addEventListener('input', function(event) {
        document.getElementById('pixelCanvas').style.backgroundColor = event.target.value;
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
        document.getElementById('bgColorSelect').value = defaultBgColor;
        history = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        historyIndex = 0;
    }
});

// Save button functionality (modified)
saveBtn.addEventListener('click', function() {
    const pixelCanvas = document.getElementById('pixelCanvas');
    const bgColor = document.getElementById('bgColorSelect').value;

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
});

// Zoom out button handler 
zoomOutBtn.addEventListener('click', () => {
    if (zoomLevel > minZoom) {
        zoomLevel -= zoomStep;
        updateZoom();
    }
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

// Add near other UI controls
const gridToggle = document.getElementById('gridToggle');
gridToggle.addEventListener('click', () => {
    canvas.classList.toggle('grid-overlay');
});



});