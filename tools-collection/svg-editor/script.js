document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const svgFileInput = document.getElementById('svgFileInput');
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const svgCode = document.getElementById('svgCode');
    const applySvgCode = document.getElementById('applySvgCode');
    const fillColor = document.getElementById('fillColor');
    const fillColorText = document.getElementById('fillColorText');
    const strokeColor = document.getElementById('strokeColor');
    const strokeColorText = document.getElementById('strokeColorText');
    const strokeWidth = document.getElementById('strokeWidth');
    const strokeWidthValue = document.getElementById('strokeWidthValue');
    const svgWidth = document.getElementById('svgWidth');
    const svgHeight = document.getElementById('svgHeight');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    const sizePresets = document.querySelectorAll('.size-preset');
    const previewContainer = document.getElementById('previewContainer');
    const noPreviewText = document.getElementById('noPreviewText');
    const svgPreview = document.getElementById('svgPreview');
    const downloadSvg = document.getElementById('downloadSvg');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // Current SVG state
    let currentSvg = null;
    let originalSvgString = '';
    let svgDoc = null;
    let currentWidth = 0;
    let currentHeight = 0;
    let aspectRatio = 1;

    // Initialize UI
    strokeWidth.value = 1;
    strokeWidthValue.textContent = strokeWidth.value;
    fillColor.value = '#000000';
    fillColorText.value = '#000000';
    strokeColor.value = '#000000';
    strokeColorText.value = '#000000';

    // Event Listeners for file upload
    browseBtn.addEventListener('click', () => svgFileInput.click());
    svgFileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleFileDrop);

    // Event Listeners for SVG code textarea
    applySvgCode.addEventListener('click', () => {
        const code = svgCode.value.trim();
        if (code) {
            try {
                processSvgString(code);
            } catch (error) {
                showError('无效的 SVG 代码，请检查后重试。');
            }
        } else {
            showError('请输入 SVG 代码。');
        }
    });

    // Color pickers sync with text inputs and apply changes in real-time
    fillColor.addEventListener('input', () => {
        fillColorText.value = fillColor.value;
        if (currentSvg) {
            applyFillColorToSvg(fillColor.value);
        }
    });

    fillColorText.addEventListener('input', () => {
        if (isValidColor(fillColorText.value)) {
            fillColor.value = fillColorText.value;
            if (currentSvg) {
                applyFillColorToSvg(fillColorText.value);
            }
        }
    });

    strokeColor.addEventListener('input', () => {
        strokeColorText.value = strokeColor.value;
        if (currentSvg) {
            applyStrokeColorToSvg(strokeColor.value);
        }
    });

    strokeColorText.addEventListener('input', () => {
        if (isValidColor(strokeColorText.value)) {
            strokeColor.value = strokeColorText.value;
            if (currentSvg) {
                applyStrokeColorToSvg(strokeColorText.value);
            }
        }
    });

    // Stroke width slider with real-time update
    strokeWidth.addEventListener('input', () => {
        strokeWidthValue.textContent = strokeWidth.value;
        if (currentSvg) {
            applyStrokeWidthToSvg(strokeWidth.value);
        }
    });

    // Size inputs with aspect ratio maintenance
    svgWidth.addEventListener('input', () => {
        if (!currentSvg) return;
        
        const newWidth = parseInt(svgWidth.value);
        if (isNaN(newWidth) || newWidth <= 0) return;
        
        if (maintainAspectRatio.checked) {
            const newHeight = Math.round(newWidth / aspectRatio);
            svgHeight.value = newHeight;
        }
        
        applySizeToSvg(parseInt(svgWidth.value), parseInt(svgHeight.value));
    });

    svgHeight.addEventListener('input', () => {
        if (!currentSvg) return;
        
        const newHeight = parseInt(svgHeight.value);
        if (isNaN(newHeight) || newHeight <= 0) return;
        
        if (maintainAspectRatio.checked) {
            const newWidth = Math.round(newHeight * aspectRatio);
            svgWidth.value = newWidth;
        }
        
        applySizeToSvg(parseInt(svgWidth.value), parseInt(svgHeight.value));
    });

    // Size presets with proportional scaling
    sizePresets.forEach(button => {
        button.addEventListener('click', () => {
            if (!currentSvg) {
                showError('请先上传或输入 SVG。');
                return;
            }
            
            const scale = parseFloat(button.getAttribute('data-scale'));
            const originalWidth = currentSvg.getAttribute('data-original-width') || currentWidth;
            const originalHeight = currentSvg.getAttribute('data-original-height') || currentHeight;
            
            const newWidth = Math.round(originalWidth * scale);
            const newHeight = Math.round(originalHeight * scale);
            
            svgWidth.value = newWidth;
            svgHeight.value = newHeight;
            applySizeToSvg(newWidth, newHeight);
        });
    });

    // Download SVG button
    downloadSvg.addEventListener('click', () => {
        if (!currentSvg) {
            showError('请先上传或输入 SVG。');
            return;
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(currentSvg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'custom-svg.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // File Upload Handlers
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type === 'image/svg+xml') {
            readSvgFile(file);
        } else {
            showError('请选择有效的 SVG 文件。');
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('border-primary-500');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('border-primary-500');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('border-primary-500');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'image/svg+xml') {
            readSvgFile(file);
        } else {
            showError('请拖放有效的 SVG 文件。');
        }
    }

    function readSvgFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const svgString = e.target.result;
            processSvgString(svgString);
            svgCode.value = svgString;
        };
        reader.onerror = function() {
            showError('读取文件时出错。');
        };
        reader.readAsText(file);
    }

    function processSvgString(svgString) {
        try {
            // Parse SVG
            const parser = new DOMParser();
            svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            
            // Check for parsing errors
            const parseError = svgDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('SVG parsing error');
            }

            // Get the SVG element
            currentSvg = svgDoc.documentElement;
            originalSvgString = svgString;
            
            // Get current dimensions
            currentWidth = parseInt(currentSvg.getAttribute('width')) || currentSvg.viewBox?.baseVal?.width || 100;
            currentHeight = parseInt(currentSvg.getAttribute('height')) || currentSvg.viewBox?.baseVal?.height || 100;
            
            // Store original dimensions for scaling
            currentSvg.setAttribute('data-original-width', currentWidth);
            currentSvg.setAttribute('data-original-height', currentHeight);
            
            // Calculate aspect ratio
            aspectRatio = currentWidth / currentHeight;

            // Update UI with current dimensions
            svgWidth.value = currentWidth;
            svgHeight.value = currentHeight;

            // Display the SVG
            updateSvgPreview();
        } catch (error) {
            console.error('Error processing SVG:', error);
            showError('处理 SVG 文件时出错。确保 SVG 格式正确。');
        }
    }

    function updateSvgPreview() {
        if (!currentSvg) return;

        // Show preview
        noPreviewText.classList.add('hidden');
        svgPreview.classList.remove('hidden');
        
        // Clear previous preview
        svgPreview.innerHTML = '';
        
        // Clone the current SVG
        const svgClone = currentSvg.cloneNode(true);
        
        // Make SVG responsive within the container
        svgClone.setAttribute('width', '100%');
        svgClone.setAttribute('height', 'auto');
        svgClone.style.maxWidth = '100%';
        
        svgPreview.appendChild(svgClone);
    }

    function applyFillColorToSvg(color) {
        if (!currentSvg) return;

        // Apply fill color to all shapes in the SVG
        const shapes = currentSvg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline');
        shapes.forEach(shape => {
            shape.setAttribute('fill', color);
        });

        updateSvgPreview();
    }

    function applyStrokeColorToSvg(color) {
        if (!currentSvg) return;

        // Apply stroke color to all shapes in the SVG
        const shapes = currentSvg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line');
        shapes.forEach(shape => {
            shape.setAttribute('stroke', color);
        });

        updateSvgPreview();
    }

    function applyStrokeWidthToSvg(width) {
        if (!currentSvg) return;

        // Apply stroke width to all shapes in the SVG
        const shapes = currentSvg.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line');
        shapes.forEach(shape => {
            shape.setAttribute('stroke-width', width);
        });

        updateSvgPreview();
    }

    function applySizeToSvg(width, height) {
        if (!currentSvg) return;

        // Update SVG dimensions
        currentSvg.setAttribute('width', width);
        currentSvg.setAttribute('height', height);
        
        // Update current dimensions
        currentWidth = width;
        currentHeight = height;

        updateSvgPreview();
    }

    function showError(message) {
        // Simple alert for now, could be improved to a toast notification
        alert(message);
    }

    function isValidColor(color) {
        // Basic color validation
        const s = new Option().style;
        s.color = color;
        return s.color !== '';
    }
}); 