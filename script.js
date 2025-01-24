document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const tracingCanvas = document.getElementById('tracingCanvas');
    const tracingCtx = tracingCanvas.getContext('2d');
    const colorSelect = document.getElementById('colorSelect');
    const saveBtn = document.getElementById('saveBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const brightness = document.getElementById('brightness');
    const maxZoom = 4;
    const minZoom = 0.5;
    const zoomStep = 0.5;
    const imageLoader = document.getElementById('imageLoader');
    const importImageBtn = document.getElementById('importImageBtn');
    const clearTracingBtn = document.getElementById('clearTracingBtn'); // If you added this button
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

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
    let tracingImage = null; // To keep track of the tracing image

    // Initialize canvases
    canvas.width = tracingCanvas.width = gridSize * pixelSize;
    canvas.height = tracingCanvas.height = gridSize * pixelSize;
    ctx.imageSmoothingEnabled = false;
    tracingCtx.globalAlpha = 0.5; // Default transparency for tracing

    // Function to draw or erase a pixel
    function updatePixel(x, y) {
        if (isErasing) {
            ctx.clearRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            ctx.fillStyle = adjustBrightness(colorSelect.value, brightness.value);
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
        updatePreview();
    }

    // Adjust color brightness 
    function adjustBrightness(hex, brightness) {
        const color = hexToRgb(hex);
        return `rgb(${Math.round(color.r * brightness)}, ${Math.round(color.g * brightness)}, ${Math.round(color.b * brightness)})`;
    }

    // Change background color
    document.getElementById('bgColorSelect').addEventListener('input', function(event) {
        canvas.style.backgroundColor = event.target.value;
        previewCanvas.style.backgroundColor = event.target.value;
    });

    // Convert hex to RGB
    function hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Event listeners for mouse interactions with both left and right click
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('mousedown', function(event) {
        event.stopPropagation()
        console.log('Mouse down on pixelCanvas');
        console.log('Event target:', event.target);
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
   
    //History Undo Redo function
    
    const maxHistory = 50;

    function updatePixelFromEvent(event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / (pixelSize * zoomLevel));
        const y = Math.floor((event.clientY - rect.top) / (pixelSize * zoomLevel));
        
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            if (!history[historyIndex + 1]) {
                history = history.slice(0, historyIndex + 1);
                if (history.length >= maxHistory) {
                    history.shift(); // Remove the oldest state
                }
                history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                historyIndex++;
            }
            
            updatePixel(x, y);
        }
    }

    // Undo functionality 
    undoBtn.addEventListener('click', function() {
        if (historyIndex > 0) {
            historyIndex--;
            ctx.putImageData(history[historyIndex], 0, 0);
            updatePreview();
        }
    });

    // Redo functionality 
    redoBtn.addEventListener('click', function() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            ctx.putImageData(history[historyIndex], 0, 0);
            updatePreview();
        }
    });

    // Default background color
    const defaultBgColor = '#ffffff'; // Set your default background color here

    // Clear canvas with confirmation
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.backgroundColor = defaultBgColor;
            previewCanvas.style.backgroundColor = '#ffffff';
            document.getElementById('bgColorSelect').value = defaultBgColor;
            history = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
            historyIndex = 0;
            updatePreview();
        }
    });

    // Save button functionality 
    saveBtn.addEventListener('click', function() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw background
        tempCtx.fillStyle = canvas.style.backgroundColor || defaultBgColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw pixel art
        tempCtx.drawImage(canvas, 0, 0);

        // Create download link
        const link = document.createElement('a');
        link.download = 'pixel_art.png';
        link.href = tempCanvas.toDataURL();
        link.click();
    });

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomLevelDisplay = document.getElementById('zoomLevel');

    function updateZoom() {
        canvas.style.transform = `scale(${zoomLevel})`;
        tracingCanvas.style.transform = `scale(${zoomLevel})`;
        canvas.style.transformOrigin = 'top left';
        tracingCanvas.style.transformOrigin = 'top left';
        zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    }

    zoomInBtn.addEventListener('click', () => {
        if (zoomLevel < maxZoom) {
            zoomLevel += zoomStep;
            updateZoom();
        }
        updatePreview();
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel > minZoom) {
            zoomLevel -= zoomStep;
            updateZoom();
        }
        updatePreview();
    });

    // Function to adjust image transparency
    function adjustImageTransparency(image, transparency, scaleFactor = 1) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width * scaleFactor;
        canvas.height = image.height * scaleFactor;
        ctx.globalAlpha = transparency;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    // Handle image upload
    imageLoader.addEventListener('change', handleImage, false);
    function handleImage(e) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                let scaledWidth = tracingCanvas.width;
                let scaledHeight = tracingCanvas.height;
                // Scale the image to fit the canvas if it's larger or smaller
                let scaleFactor = Math.max(scaledWidth / img.width, scaledHeight / img.height);
                let scaledImage = adjustImageTransparency(img, 0.5, scaleFactor);
                tracingImage = scaledImage;
                tracingCtx.clearRect(0, 0, tracingCanvas.width, tracingCanvas.height);
                tracingCtx.drawImage(tracingImage, 0, 0, scaledWidth, scaledHeight);
                updatePreview();
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }

    // Button to import image for tracing
    importImageBtn.addEventListener('click', function() {
        imageLoader.click();
    });

    // Function to clear tracing image
    function clearTracingImage() {
        if (tracingImage) {
            tracingCtx.clearRect(0, 0, tracingCanvas.width, tracingCanvas.height);
            tracingImage = null;
            updatePreview();
            imageLoader.value = '';
        }
    }

    // If you have a button to clear the tracing image
    if (clearTracingBtn) {
        clearTracingBtn.addEventListener('click', clearTracingImage);
    }

    // Update preview function to include both canvases
    function updatePreview() {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
        if (tracingImage) {
            previewCtx.globalAlpha = 0.5;
            previewCtx.drawImage(tracingCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
            previewCtx.globalAlpha = 1;
        }
    }

    // Grid toggle (assuming you have this functionality)
    document.getElementById('gridToggle').addEventListener('click', function() {
        canvas.classList.toggle('grid-overlay');
    });

    // Line drawing:
    function redrawLine(event) {
        const rect = canvas.getBoundingClientRect();
        let endX = Math.floor((event.clientX - rect.left) / (pixelSize * zoomLevel));
        let endY = Math.floor((event.clientY - rect.top) / (pixelSize * zoomLevel));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (history[historyIndex]) {
            ctx.putImageData(history[historyIndex], 0, 0);
        }

        if (event.shiftKey) { // If Shift is pressed, draw a straight line
            if (Math.abs(lineStartX - endX) > Math.abs(lineStartY - endY)) {
                endY = lineStartY; // Horizontal line
            } else {
                endX = lineStartX; // Vertical line
            }
        }

        ctx.beginPath();
        ctx.moveTo(lineStartX * pixelSize + pixelSize / 2, lineStartY * pixelSize + pixelSize / 2);
        ctx.lineTo(endX * pixelSize + pixelSize / 2, endY * pixelSize + pixelSize / 2);
        ctx.strokeStyle = adjustBrightness(colorSelect.value, brightness.value);
        ctx.lineWidth = pixelSize;
        ctx.lineCap = "round";
        ctx.stroke();
    }

    function finishLine(event) {
        history = history.slice(0, historyIndex + 1);
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        historyIndex++;
        updatePreview();
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


});