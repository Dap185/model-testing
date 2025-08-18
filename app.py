from flask import Flask, request, jsonify, render_template
#permit cross-origin requests from frontend
from flask_cors import CORS

import time
import os
import pandas as pd

from openai import OpenAI
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

#set your output csv file
CSV_FILE = './data.csv'

"""grab keys"""
def get_anthropic_key():
    with open('keys/anthropic_api_key', 'r') as f:
        return f.read().strip()

def get_openai_key():
    with open('keys/openai_api_key', 'r') as f:
        return f.read().strip()

"""Initialize Flask app"""
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/testPrompt', methods=['POST'])
def test_prompt():
    """Endpoint to test a prompt with a specified model."""
    data = request.get_json(force=True)
    prompt = data.get('message', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    model = data.get('model', '')
    print(f'Using model: {model}, using prompt: {prompt}')   
    if not model:
        return jsonify({'error': 'No model provided'}), 400
    print(f"testing prompt, model: {model}, prompt: {prompt}")
    api_key = ''
    response = ''
    if model.startswith('gpt'):
        api_key = get_openai_key()
    elif model.startswith('Claude'):
        api_key = get_anthropic_key()
    
    if not api_key:
        return jsonify({'error': 'OpenAI API key not found'}), 500

    if model.startswith('gpt'):
        response, status = openai_routine(api_key, model, prompt)
    elif model.startswith('Claude'):
        response, status = anthropic_routine(api_key, model, prompt)
    print(f"recording data, response was {response}")
    record_data(response)

    return jsonify(response), status





def openai_routine(api_key, model, prompt):
    """Call OpenAI API with the provided model and prompt."""
    client = OpenAI(api_key=api_key)
    try:
        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        end_time = time.time()
        time_elapsed = end_time - start_time

        print("OpenAI Response:", response.choices[0].message.content)
        return {
            'model': model,
            'prompt': prompt,
            'response': response.choices[0].message.content,
            'time_elapsed': time_elapsed
        }, 200
    except Exception as e:
        print("Error with OpenAI API:", str(e))
        return jsonify({'error': str(e)}), 500



def anthropic_routine(api_key, model, prompt):
    """Call Anthropic API with the provided model and prompt."""
    client = Anthropic(api_key=api_key)
    try:
        start_time = time.time()
        response = client.completions.create(
            model=model,
            prompt=f"{HUMAN_PROMPT} {prompt} {AI_PROMPT}",
            max_tokens=1000,
            temperature=0.7,
            top_p=1,
            stop_sequences=[HUMAN_PROMPT],
        )
        end_time = time.time()
        time_elapsed = end_time - start_time
        print("Anthropic Response:", response['completion'])
        return {
            'model': model,
            'prompt': prompt,
            'response': response['completion'],
            'time_elapsed': time_elapsed
        }, 200
    except Exception as e:
        print("Error with Anthropic API:", str(e))
        return jsonify({'error': str(e)}), 500







def record_data(response):
    print(f"recording data to CSV: {response}")
    """Record the response data to a CSV file."""
    if not os.path.exists(CSV_FILE):
        df = pd.DataFrame(columns=['model', 'prompt', 'response', 'time_elapsed'])
    else:
        df = pd.read_csv(CSV_FILE)

    new_data = {
        'model': response['model'],
        'prompt': response['prompt'],
        'response': response['response'],
        'time_elapsed': response.get('time_elapsed', None)
    }
    
    df.loc[len(df)] = new_data
    
    # Save to CSV
    df.to_csv(CSV_FILE, index=False)

if __name__ == '__main__':
    app.run(debug=True)
