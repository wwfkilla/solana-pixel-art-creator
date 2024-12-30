document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const colorSelect = document.getElementById('colorSelect');
    const saveBtn = document.getElementById('saveBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const brightness = document.getElementById('brightness');

    let pixelSize = 10; // Each pixel is 10x10
    let gridSize = 32; // 32x32 grid
    let history = []; // for undo/redo
    let historyIndex = -1; // current index in history
    let isDrawing = false;
    let isErasing = false;

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

    // Clear canvas (unchanged)
    clearBtn.addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        historyIndex = 0;
    });

    // Save button functionality (unchanged)
    saveBtn.addEventListener('click', function() {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'pixel_art.png';
        link.href = dataURL;
        link.click();
    });
});