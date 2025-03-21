document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const originalImage = document.getElementById('originalImage');
    const originalImageContainer = document.getElementById('originalImageContainer');
    const noImageText = document.getElementById('noImageText');
    const originalSize = document.getElementById('originalSize');
    const previewContainer = document.getElementById('previewContainer');
    const compressionQuality = document.getElementById('compressionQuality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadAll = document.getElementById('downloadAll');
    const additionalSizesContainer = document.getElementById('additionalSizesContainer');
    const customWidth = document.getElementById('customWidth');
    const customHeight = document.getElementById('customHeight');
    const generateCustomSize = document.getElementById('generateCustomSize');
    const customPreviewContainer = document.getElementById('customPreviewContainer');
    const canvasCustom = document.getElementById('canvasCustom');
    const customSizeLabel = document.getElementById('customSizeLabel');
    const sizeCustom = document.getElementById('sizeCustom');
    const downloadCustom = document.getElementById('downloadCustom');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Size presets
    const SIZES = [16, 32, 48, 128];
    
    // Variables to store image data
    let uploadedImage = null;
    let imageType = null;
    let fileName = null;

    // Toggle mobile menu
    mobileMenuButton.addEventListener('click', function() {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
    });

    // Initialize UI
    function init() {
        // Set up event listeners
        fileInput.addEventListener('change', handleFileSelect);
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Set up drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        // Set up quality slider
        compressionQuality.addEventListener('input', function() {
            const value = Math.round(this.value * 100);
            qualityValue.textContent = value + '%';
            if (uploadedImage) {
                processImage();
            }
        });
        
        // Set up download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const size = parseInt(this.getAttribute('data-size'));
                downloadImage(size);
            });
        });
        
        downloadAll.addEventListener('click', downloadAllImages);
        
        // Set up custom size generation
        generateCustomSize.addEventListener('click', generateCustomSizedImage);
        downloadCustom.addEventListener('click', downloadCustomImage);
        
        // Show additional sizes section after image upload
        showAdditionalSizesSection(false);
    }
    
    // Prevent default drag and drop behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area on drag over
    function highlight() {
        dropArea.classList.add('border-primary-500');
    }
    
    // Remove highlight from drop area
    function unhighlight() {
        dropArea.classList.remove('border-primary-500');
    }
    
    // Handle file drop
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    // Handle selected files from input
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    // Process uploaded files
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        const fileType = file.type;
        
        // Check if file is an image
        if (!fileType.match('image/jpeg') && !fileType.match('image/png')) {
            alert('Please upload a JPEG or PNG image.');
            return;
        }
        
        imageType = fileType;
        fileName = file.name.split('.')[0];
        
        // Display original image
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            originalImage.onload = function() {
                showOriginalImage(true);
                uploadedImage = originalImage;
                
                // Calculate and display original file size
                const fileSizeKB = (file.size / 1024).toFixed(2);
                originalSize.textContent = `原始尺寸: ${originalImage.naturalWidth} × ${originalImage.naturalHeight} px | 文件大小: ${fileSizeKB} KB`;
                
                // Process image for different sizes
                processImage();
                
                // Show additional options
                showAdditionalSizesSection(true);
            };
        };
        reader.readAsDataURL(file);
    }
    
    // Show/hide original image container
    function showOriginalImage(show) {
        if (show) {
            originalImageContainer.classList.remove('hidden');
            noImageText.classList.add('hidden');
        } else {
            originalImageContainer.classList.add('hidden');
            noImageText.classList.remove('hidden');
        }
    }
    
    // Show/hide additional sizes section
    function showAdditionalSizesSection(show) {
        if (show) {
            additionalSizesContainer.classList.remove('hidden');
        } else {
            additionalSizesContainer.classList.add('hidden');
            customPreviewContainer.classList.add('hidden');
        }
    }
    
    // Process image for different sizes
    function processImage() {
        if (!uploadedImage) return;
        
        const quality = parseFloat(compressionQuality.value);
        
        // Show preview container
        previewContainer.classList.remove('hidden');
        
        // Process each size
        SIZES.forEach(size => {
            const canvas = document.getElementById(`canvas${size}`);
            const sizeLabel = document.getElementById(`size${size}`);
            
            // Draw image on canvas with desired size
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(uploadedImage, 0, 0, size, size);
            
            // Calculate and display file size
            calculateImageSize(canvas, quality, sizeLabel);
        });
    }
    
    // Generate custom sized image
    function generateCustomSizedImage() {
        const width = parseInt(customWidth.value);
        const height = parseInt(customHeight.value);
        
        if (!width || !height || width <= 0 || height <= 0 || !uploadedImage) {
            alert('请输入有效的宽度和高度');
            return;
        }
        
        // Resize canvas to match custom dimensions
        canvasCustom.width = width;
        canvasCustom.height = height;
        
        // Set display size (max 200px for either dimension while maintaining aspect ratio)
        if (width > height) {
            canvasCustom.style.width = '200px';
            canvasCustom.style.height = (200 * (height / width)) + 'px';
        } else {
            canvasCustom.style.height = '200px';
            canvasCustom.style.width = (200 * (width / height)) + 'px';
        }
        
        // Draw image on canvas
        const ctx = canvasCustom.getContext('2d');
        ctx.clearRect(0, 0, canvasCustom.width, canvasCustom.height);
        ctx.drawImage(uploadedImage, 0, 0, width, height);
        
        // Update UI
        customPreviewContainer.classList.remove('hidden');
        customSizeLabel.textContent = `${width} × ${height}`;
        
        // Calculate file size
        const quality = parseFloat(compressionQuality.value);
        calculateImageSize(canvasCustom, quality, sizeCustom);
    }
    
    // Calculate and display the file size of an image
    function calculateImageSize(canvas, quality, sizeLabel) {
        let dataUrl;
        
        if (imageType === 'image/png') {
            dataUrl = canvas.toDataURL('image/png');
        } else {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        // Approximate file size calculation
        const base64 = dataUrl.split(',')[1];
        const decodedData = atob(base64);
        const fileSizeBytes = decodedData.length;
        const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);
        
        sizeLabel.textContent = `文件大小: ${fileSizeKB} KB`;
        
        return fileSizeKB;
    }
    
    // Download a single image
    function downloadImage(size) {
        if (!uploadedImage) return;
        
        const canvas = document.getElementById(`canvas${size}`);
        const quality = parseFloat(compressionQuality.value);
        let dataUrl;
        let extension;
        
        if (imageType === 'image/png') {
            dataUrl = canvas.toDataURL('image/png');
            extension = 'png';
        } else {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            extension = 'jpg';
        }
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}-${size}x${size}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Download custom sized image
    function downloadCustomImage() {
        if (!uploadedImage) return;
        
        const width = parseInt(customWidth.value);
        const height = parseInt(customHeight.value);
        
        if (!width || !height || width <= 0 || height <= 0) {
            alert('请输入有效的宽度和高度');
            return;
        }
        
        const quality = parseFloat(compressionQuality.value);
        let dataUrl;
        let extension;
        
        if (imageType === 'image/png') {
            dataUrl = canvasCustom.toDataURL('image/png');
            extension = 'png';
        } else {
            dataUrl = canvasCustom.toDataURL('image/jpeg', quality);
            extension = 'jpg';
        }
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}-${width}x${height}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Download all images as a zip file
    function downloadAllImages() {
        if (!uploadedImage) return;
        
        // Create a temporary link for each size and trigger download
        SIZES.forEach(size => {
            downloadImage(size);
        });
        
        // Check if custom size is available
        if (!customPreviewContainer.classList.contains('hidden')) {
            downloadCustomImage();
        }
    }
    
    // Initialize the application
    init();
}); 