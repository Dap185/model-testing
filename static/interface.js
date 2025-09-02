/**
 * Interface generation front end logic
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('interfaceForm');
    const results = document.getElementById('results');
    
    // handle form submission
    form.addEventListener('submit', async function(e) {
        console.log('Submit button pressed. Attempting to generate interface...')
        e.preventDefault();
        
        const description = document.getElementById('description').value.trim();
        const model = document.getElementById('model-select').value;
        const useRag = document.getElementById('useRag').checked;
        
        if (!description || !model) {
            alert('Please fill in all required fields');
            return;
        }
        
        hideResults();
        
        try {
            const response = await generateInterface(description, model, useRag);
            
            if (response.error) {
                showError(response.error);
            } else {
                showResults(response);
            }
        } catch (error) {
            console.error('Error generating interface:', error);
            showError('Failed to generate interface. Please try again.');
        }
    });
    
    // initialize example cards
    setupExampleCards();
});

async function generateInterface(description, model, useRag) {
    const response = await fetch('/interface/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            description: description,
            model: model,
            useRag: useRag
        })
    });
    
    return await response.json();
}

function showResults(data) {
    const results = document.getElementById('results');
    if (!results) return;
    
    results.innerHTML = createResultsHTML(data);
    results.classList.remove('hidden');
    
    // scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    const results = document.getElementById('results');
    if (results) {
        results.classList.add('hidden');
    }
}

function showError(errorMessage) {
    const results = document.getElementById('results');
    if (!results) return;
    
    results.innerHTML = `
        <div class="error-message">
            <h3>❌ Generation Failed</h3>
            <p>${errorMessage}</p>
            <button onclick="hideResults()" class="btn btn-secondary">Close</button>
        </div>
    `;
    results.classList.remove('hidden');
}

function createResultsHTML(data) {
    const codeLines = (data.response || '').split('\n').length;
    const generationTime = data.time_elapsed ? `${data.time_elapsed.toFixed(2)}s` : 'N/A';
    
    return `
        <div class="result-header">
            <div class="success-message">
                <h3>✅ Interface Generated Successfully!</h3>
                <p>Your educational interface has been created using <strong>${data.model}</strong>.</p>
            </div>
            
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">${data.model}</div>
                    <div class="metric-label">Model Used</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${generationTime}</div>
                    <div class="metric-label">Generation Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${codeLines}</div>
                    <div class="metric-label">Lines of Code</div>
                </div>
            </div>
        </div>

        <div class="actions">
            <button class="btn btn-success" onclick="downloadInterface('${escapeHtml(data.response)}')">
                📥 Download HTML
            </button>
            <button class="btn btn-primary" onclick="copyToClipboard('${escapeHtml(data.response)}')">
                📋 Copy Code
            </button>
            <button class="btn btn-secondary" onclick="openInNewTab('${escapeHtml(data.response)}')">
                🔗 Open in New Tab
            </button>
            <button class="btn btn-primary" onclick="generateAnother()">
                🔄 Generate Another
            </button>
        </div>

        <div class="result-container">
            <div class="code-section">
                <h3>Generated Code</h3>
                <div class="code-display">${escapeHtml(data.response || 'No code generated')}</div>
            </div>
            
            <div class="preview-section">
                <h3>Live Preview</h3>
                <iframe class="preview-frame" srcdoc="${escapeHtml(data.response || '<p>No preview available</p>')}" sandbox="allow-scripts allow-same-origin">
                    Your browser does not support iframes.
                </iframe>
                <div class="preview-note">
                    <small>⚠️ Preview runs in sandboxed mode for security</small>
                </div>
            </div>
        </div>

        <div class="original-description">
            <h3>Original Description</h3>
            <div class="description-text">${escapeHtml(data.description || 'No description provided')}</div>
        </div>
    `;
}

function setupExampleCards() {
    // make example cards clickable
    window.fillExample = function(cardElement) {
        const title = cardElement.querySelector('h4').textContent;
        const description = cardElement.querySelector('p').textContent;
        
        document.getElementById('description').value = description;
        
        // add visual feedback
        cardElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cardElement.style.transform = 'scale(1)';
        }, 150);
        
        // scroll to form
        document.getElementById('description').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('description').focus();
    };
}

// utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function downloadInterface(code) {
    // Decode HTML entities first
    const decodedCode = decodeHtmlEntities(code);
    const blob = new Blob([decodedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-interface-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard(code) {
    const decodedCode = decodeHtmlEntities(code);
    navigator.clipboard.writeText(decodedCode).then(() => {
        // show temporary success message
        const originalText = event.target.textContent;
        event.target.textContent = '✅ Copied!';
        event.target.style.background = '#28a745';
        
        setTimeout(() => {
            event.target.textContent = originalText;
            event.target.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard. Please try selecting and copying manually.');
    });
}

function openInNewTab(code) {
    const decodedCode = decodeHtmlEntities(code);
    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(decodedCode);
        newWindow.document.close();
    } else {
        alert('Please allow pop-ups to open the interface in a new tab.');
    }
}

function generateAnother() {
    // clear form
    document.getElementById('description').value = '';
    document.getElementById('model').value = '';
    
    // hide results
    hideResults();
    
    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // focus description field
    setTimeout(() => {
        document.getElementById('description').focus();
    }, 500);
}

function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// add some CSS for the results (if not already in your styles.css)
const resultStyles = `
    .result-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
    }
    
    .code-section, .preview-section {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e9ecef;
    }
    
    .code-display {
        background: #2d3748;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 14px;
        line-height: 1.4;
        max-height: 500px;
        overflow-y: auto;
        white-space: pre-wrap;
    }
    
    .preview-frame {
        width: 100%;
        height: 500px;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: white;
    }
    
    .metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    
    .metric-card {
        background: #fff;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        text-align: center;
    }
    
    .metric-value {
        font-size: 20px;
        font-weight: bold;
        color: #007bff;
    }
    
    .metric-label {
        color: #6c757d;
        font-size: 12px;
        margin-top: 5px;
    }
    
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0;
    }
    
    .btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    
    .btn-primary {
        background: #007bff;
        color: white;
    }
    
    .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }
    
    .btn-secondary {
        background: #6c757d;
        color: white;
    }
    
    .btn-secondary:hover {
        background: #545b62;
        transform: translateY(-1px);
    }
    
    .btn-success {
        background: #28a745;
        color: white;
    }
    
    .btn-success:hover {
        background: #1e7e34;
        transform: translateY(-1px);
    }
    
    .error-message, .success-message {
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
    }
    
    .error-message {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .success-message {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .original-description {
        margin-top: 30px;
    }
    
    .description-text {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        font-style: italic;
        border-left: 4px solid #007bff;
    }
    
    .preview-note {
        margin-top: 10px;
        text-align: center;
        color: #6c757d;
    }
    
    .example-card {
        cursor: pointer;
        transition: transform 0.2s;
        padding: 15px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        margin: 10px 0;
    }
    
    .example-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .example-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    @media (max-width: 768px) {
        .result-container {
            grid-template-columns: 1fr;
        }
        
        .actions {
            justify-content: center;
        }
        
        .metrics {
            grid-template-columns: repeat(2, 1fr);
        }
    }
`;

// inject styles if they don't exist
if (!document.getElementById('interface-results-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'interface-results-styles';
    styleSheet.textContent = resultStyles;
    document.head.appendChild(styleSheet);
}