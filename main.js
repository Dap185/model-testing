let model = "GPT-4";
let message = "";

const OPENAI_API_KEY = fetch('openai_api_key').then(res => res.text());
const ANTHROPIC_API_KEY = fetch('anthropic_api_key').then(res => res.text());

window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('model-select').addEventListener('change', function(event) {
        model = event.target.value;
    });

    document.getElementById('prompt-input').addEventListener('input', function(event) {
        message = event.target.value;
    });
});

function sendRequest() {
    console.log("Model:", model);
    console.log("Prompt:", message);
    if(model.startsWith("gpt-")) {
        openAIRequest();
    }
    else {
        anthropicRequest();
    }
        
}

async function openAIRequest() {
    
    await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: message }
            ]
        })
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        console.log("Response:", data);
        document.getElementById('response').innerText = JSON.stringify(data, null, 2);
    }).catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('response').innerText = 'Error: ' + error.message;
    });
}

async function anthropicRequest() {
    // Using fetch API (works in browser and Node.js 18+)

    const ANTHROPIC_API_KEY = 'your-api-key-here'; // Replace with your actual API key
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 1000,
            messages: [
            {
                role: 'user',
                content: message
            }
            ]
        })
        });

        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        document.getElementById('response').innerText = JSON.stringify(data, null, 2);
        return data.content[0].text;
    } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
    }
    
}