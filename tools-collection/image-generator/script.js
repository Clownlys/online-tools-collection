document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const modelSelect = document.getElementById('model');
    const numImagesInput = document.getElementById('numImages');
    const promptTextarea = document.getElementById('prompt');
    const generateBtn = document.getElementById('generateBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsGrid = document.getElementById('resultsGrid');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Grok API Endpoint - follows OpenAI compatibility
    const GROK_API_URL = 'https://api.x.ai/v1/images/generations';

    // Toggle API Key visibility
    toggleApiKeyBtn.addEventListener('click', function() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        } else {
            apiKeyInput.type = 'password';
            this.innerHTML = '<i class="fa-solid fa-eye"></i>';
        }
    });

    // Mobile menu toggle
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });

    // Load API key from local storage
    if (localStorage.getItem('grokApiKey')) {
        apiKeyInput.value = localStorage.getItem('grokApiKey');
    }

    // Generate button click handler
    generateBtn.addEventListener('click', generateImages);

    // Enter key in prompt textarea triggers generation
    promptTextarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            generateImages();
        }
    });

    // Number input validation
    numImagesInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            this.value = 1;
        } else if (value > 4) {
            this.value = 4;
        }
    });

    // Main function to generate images
    async function generateImages() {
        // Validate inputs
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showError('请输入 API 密钥');
            apiKeyInput.focus();
            return;
        }

        const prompt = promptTextarea.value.trim();
        if (!prompt) {
            showError('请输入提示词');
            promptTextarea.focus();
            return;
        }

        const model = modelSelect.value;
        const numImages = parseInt(numImagesInput.value) || 1;

        // Save API key to local storage
        localStorage.setItem('grokApiKey', apiKey);

        // Show loading state
        showLoading();

        try {
            // Prepare request body following OpenAI structure
            const requestBody = {
                model: model,
                prompt: prompt,
                n: numImages
            };

            // Make API request
            const response = await fetch(GROK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Title': 'Grok AI Image Generator'
                },
                body: JSON.stringify(requestBody)
            });

            // Parse response
            const data = await response.json();

            // Handle error
            if (!response.ok) {
                let errorMsg = '生成失败';
                if (data.error && data.error.message) {
                    errorMsg = data.error.message;
                }
                throw new Error(errorMsg);
            }

            // Display results
            displayResults(data);
        } catch (error) {
            showError(error.message || '连接 API 时出错，请检查您的网络连接和 API 密钥');
        } finally {
            hideLoading();
        }
    }

    // Display generated images
    function displayResults(data) {
        // Clear previous results
        resultsGrid.innerHTML = '';

        // Check if data contains images
        if (data.data && data.data.length > 0) {
            // Hide no results message
            noResultsMessage.classList.add('hidden');
            resultsGrid.classList.remove('hidden');

            // Create image elements
            data.data.forEach((item, index) => {
                const imageUrl = item.url;
                
                // Create card for image
                const card = document.createElement('div');
                card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300';
                
                // Create image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'aspect-square relative';
                
                // Create image element
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = `Generated image ${index + 1}`;
                img.className = 'w-full h-full object-cover';
                img.loading = 'lazy';
                
                // Add loading state
                img.onload = function() {
                    img.classList.add('opacity-100');
                };
                img.classList.add('opacity-0', 'transition-opacity', 'duration-300');
                
                // Append image to container
                imgContainer.appendChild(img);
                
                // Add download button
                const downloadBtn = document.createElement('a');
                downloadBtn.href = imageUrl;
                downloadBtn.download = `generated-image-${Date.now()}-${index}.png`;
                downloadBtn.className = 'absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition duration-300';
                downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
                downloadBtn.target = '_blank';
                imgContainer.appendChild(downloadBtn);
                
                // Append to card
                card.appendChild(imgContainer);
                
                // Add card footer with info
                const cardFooter = document.createElement('div');
                cardFooter.className = 'p-3 bg-gray-50 text-xs text-gray-500';
                cardFooter.textContent = `图片 ${index + 1} · 右键点击保存`;
                card.appendChild(cardFooter);
                
                // Append card to results grid
                resultsGrid.appendChild(card);
            });
            
            // Close error message if it's open
            errorContainer.classList.add('hidden');
        } else {
            showError('API 返回无效数据');
        }
    }

    // Show loading state
    function showLoading() {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>正在生成...';
        loadingIndicator.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        errorContainer.classList.add('hidden');
    }

    // Hide loading state
    function hideLoading() {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fa-solid fa-image mr-2"></i>生成图像';
        loadingIndicator.classList.add('hidden');
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        
        if (resultsGrid.children.length === 0) {
            noResultsMessage.classList.remove('hidden');
            resultsGrid.classList.add('hidden');
        }
    }
}); 