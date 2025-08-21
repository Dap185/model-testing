from flask import Flask, request, jsonify, render_template
#permit cross-origin requests from frontend
from flask_cors import CORS


import time
import os
import pandas as pd

from dotenv import load_dotenv


from openai import OpenAI
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

#set your output csv file
CSV_FILE = './data.csv'

"""Initialize Flask app"""
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

load_dotenv()

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/custom')
def custom():
    return render_template('customPrompt.html')

@app.route('/adding')
def adding():
    return render_template('adding.html')

@app.route('/numberline')
def numberline():
    return render_template('numberline.html')

@app.route('/api/testPrompt', methods=['POST'])
def test_prompt():
    """Endpoint to test a prompt with a specified model."""
    data = request.get_json(force=True)
    
    prompt = data.get('messages', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    model = data.get('model', '')
    if not model:
        return jsonify({'error': 'No model provided'}), 400
    
    api_key = ''
    response = ''
    if model.startswith('gpt'):
        api_key = os.getenv('OPENAI_API_KEY')
    elif model.startswith('claude'):
        api_key = os.getenv('ANTHROPIC_API_KEY')
    elif model.startswith('gemini'):
        api_key = os.getenv('GEMINI_API_KEY')
    else:
        return jsonify({'error': f'Model not found {model}'}), 500
    if not api_key:
        return jsonify({'error': 'Key not found in env'}), 500

    if model.startswith('gpt'):
        response, status = openai_routine(api_key, model, prompt)
    elif model.startswith('claude'):
        response, status = anthropic_routine(api_key, model, prompt)
    elif model.startswith('gemini'):
        # Placeholder for Gemini API call
        response, status = gemini_routine(api_key, model, prompt)
    else:
        return jsonify({'error': f'Model not found {model}'}), 500
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
            messages=prompt
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
        response = client.messages.create(
            model=model,
            max_tokens=1000,
            system=prompt[0]['content'] if isinstance(prompt[0], dict) else prompt[0],
            temperature=0.7,
            messages=prompt[1:],
        )
        end_time = time.time()
        time_elapsed = end_time - start_time
        text_response = "".join(
            block.text for block in response.content if block.type == "text"
        )
        print("Anthropic Response:", text_response)
        return {
            'model': model,
            'prompt': prompt,
            'response': text_response,
            'time_elapsed': time_elapsed
        }, 200
    except Exception as e:
        print("Error with Anthropic API:", str(e))
        return jsonify({'error': str(e)}), 500






def gemini_routine(api_key, model, prompt):
    """Call gemini api with the provided model and prompt"""
    client = OpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    start_time = time.time()
    response = client.chat.completions.create(
        model=model,
        messages=prompt
    )
    end_time = time.time()
    time_elapsed = end_time - start_time
    print("Gemini Response:", response.choices[0].message.content)
    return {  
        'model': model,
        'prompt': prompt,
        'response': response.choices[0].message.content,
        'time_elapsed': time_elapsed
    }, 200



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
