from flask import Flask, request, jsonify, render_template
#permit cross-origin requests from frontend
from flask_cors import CORS

import time
import subprocess
import requests
import os
import pandas as pd

from dotenv import load_dotenv


from openai import OpenAI
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
import ollama

import json
import random

# Set globals
CSV_FILE = './data.csv'
LOCAL_MODEL_PREFIXES = ["llama", "gemma", "qwen", "phi", "deepseek", "llava", ]
# TODO: add function to scrape https://ollama.com/models for more prefixes

"""Initialize Flask app"""
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

load_dotenv()

#
# ENDPOINTS FOR ALL UNIQUE PAGES
#

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
 
@app.route('/interface')
def interface():
    return render_template('interface.html')

@app.route('/socraticPromptRequirements')
def socraticPromptRequirements():
    return render_template('socraticPromptRequirements.html')

#
# MAIN ENDPOINT FOR TESTING PROMPTS
# 

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
    
    response, status = call_model_with_prompt(model, prompt)

    print(f"recording data, response was {response}")
    record_data(response)

    return jsonify(response), status


def call_model_with_prompt(model, prompt):
    """
    Generic function to call any model with a prompt.
    Helper function to api handler
    Returns (response_dict, status_code) tuple.
    """
    # get API key based on model type
    api_key = ''
    response = ''
    if model.startswith('gpt'):
        api_key = os.getenv('OPENAI_API_KEY')
    elif model.startswith('claude'):
        api_key = os.getenv('ANTHROPIC_API_KEY')
    elif model.startswith('gemini'):
        api_key = os.getenv('GEMINI_API_KEY')
    elif is_local_model(model): # run on ollama
        api_key = None  # no key needed, open source model to be run locally
    else:
        return jsonify({'error': f'Model not found {model}'}), 500
    
    # only require API key for cloud-hosted models
    if model.startswith(('gpt', 'claude', 'gemini')) and not api_key:
        return jsonify({'error': 'Key not found in env'}), 500

    # use appropriate model handler routine
    if model.startswith('gpt'):
        return openai_routine(api_key, model, prompt)
    elif model.startswith('claude'):
        return anthropic_routine(api_key, model, prompt)
    elif model.startswith('gemini'):
        return gemini_routine(api_key, model, prompt)
    elif is_local_model(model):
        return ollama_routine(model, prompt)
    else:
        return jsonify({'error': f'Model not found {model}'}), 500



# 
# IDENTIFYING MODEL + RUNNING APPROPRIATE ROUTINE & SUBROUTINES
# ACTUAL API REQUESTS HERE
# 

def openai_routine(api_key, model, prompt):
    """Call OpenAI API with the provided model and prompt."""
    client = OpenAI(api_key=api_key)
    try:
        #get start and end time for analytics
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
        #assume for current data collection it's just system prompt
        #todo make more robust later

        #get start and end time for analytics
        start_time = time.time()
        #only system prompt
        if len(prompt) == 1:
            response = client.messages.create(
                model=model,
                max_tokens=1000,
                system=prompt[0]['content'] if isinstance(prompt[0], dict) else prompt[0],
                temperature=0.7,
            )

        #system + conversation
        elif len(prompt) > 1:
            system_prompt = prompt[0]['content'] if isinstance(prompt[0], dict) else prompt[0]
            messages = prompt[1:]  # everything after the first

            response = client.messages.create(
                model=model,
                max_tokens=1000,
                system=system_prompt,
                messages=messages,
                temperature=0.7,
            )
        else: 
            return jsonify({'error': 'No prompt provided for Anthropic'}), 400
        
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
    #get start and end time for analytics
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

#
# OLLAMA
#

def is_local_model(model: str) -> bool:
    """Check if this model should be run locally via Ollama."""
    return any(model.startswith(prefix) for prefix in LOCAL_MODEL_PREFIXES)

def ollama_routine(model, prompt):
    """Call ollama locally with the provided model and prompt"""

    # ensure ollama is running at routine call + model is ready
    start_ollama_server()
    wait_for_ollama()
    start_model_if_needed(model) 

    # check formatting b/c ollama just wants the prompt text
    if isinstance(prompt, list):
        prompt_text = "\n".join([f"{m['role']}: {m['content']}" for m in prompt])
    else:
        prompt_text = prompt
    
    start_time = time.time()
    response = ollama.generate(model=model, prompt=prompt_text)
    end_time = time.time()
    time_elapsed = end_time - start_time
    print("Ollama Response:", response['response'])
    return {  
        'model': model,
        'prompt': prompt_text,
        'response': response['response'],
        'time_elapsed': time_elapsed
    }, 200

def is_ollama_running():
    try:
        # `pgrep` returns 0 if a process is found
        subprocess.run(["pgrep", "ollama"], check=True, stdout=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def start_ollama_server():
    if not is_ollama_running():
        print("Starting Ollama server...")
        subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        print("Ollama server already running.")

def wait_for_ollama(timeout=5):
    """Wait until the Ollama local server is responding."""
    url = "http://localhost:11434/api/generate"
    start = time.time()
    while time.time() - start < timeout:
        try:
            requests.get(url)
            return True
        except requests.ConnectionError:
            time.sleep(0.1)
    raise RuntimeError("Ollama server did not start in time")

def start_model_if_needed(model):
    installed = subprocess.run(["ollama", "list"], capture_output=True, text=True)
    if model not in installed.stdout:
        print(f"Pulling model {model}...")
        subprocess.run(["ollama", "pull", model], check=True)

#
# SAVE RESPONSES TO .CSV
#
def record_data(response):
    #DBG
    print(json.dumps(response))
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


#
# INTERFACE GENERATION
#

@app.route('/interface/generate', methods=['POST'])
def generate_interface():
    """Endpoint to generate interface code with a specified model."""
    data = request.get_json(force = True)
    
    description = data.get('description', '')
    if not description:
        return jsonify({'error': 'No interface description provided'}), 400

    model = data.get('model', '')
    if not model:
        return jsonify({'error': 'No model provided'}), 400
    
    # get RAG context from examples
    print("Checking for additional context")
    context = get_interface_context()
    
    # create prompt for interface generation
    print("Creating interface prompt")
    interface_prompt = create_interface_prompt(description, context)
    
    response, status = call_model_with_prompt(model, interface_prompt)

    response['response'] = clean_html_response(response['response']) # try to remove any non-code portion of response
        
    print(f"recording data, response was {response}")
    record_data(response)

    return jsonify(response), status

def clean_html_response(response_text):
    """Simple HTML extraction - just remove common prefixes/suffixes."""
    text = response_text.strip()
    
    # Remove common prefixes
    prefixes_to_remove = [
        "Here's the HTML code:",
        "Here's your interface:",
        "```html",
        "```"
    ]
    
    for prefix in prefixes_to_remove:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    
    # Remove common suffixes
    if text.endswith("```"):
        text = text[:-3].strip()
    
    return text

def get_interface_context():
    """Load interface examples for RAG context."""
    try:
        # load interface examples if CSV exists
        examples = []
        if os.path.exists('data/ctat_interfaces.csv'):
            df = pd.read_csv('data/ctat_interfaces.csv')
            # sample a few examples for context
            sample_size = min(3, len(df))
            examples = df.sample(n=sample_size).to_dict('records')
            print("Interface examples found")
        
        # load component library if it exists
        components = []
        if os.path.exists('data/ctat_components.csv'):
            comp_df = pd.read_csv('data/ctat_components.csv')
            components = comp_df.to_dict('records')
            print("CTAT components found")

        return {
            'examples': examples,
            'components': components
        }
    except Exception as e:
        print(f"Error loading interface context: {e}")
        return {'examples': [], 'components': []}

def create_interface_prompt(description, context):
    """Create a prompt for interface generation with RAG context."""
    
    context_text = ""
    if context['examples']:
        context_text += "\nHere are some example interfaces for reference:\n"
        for i, example in enumerate(context['examples'][:3]):
            context_text += f"\nExample {i+1}:\nDescription: {example.get('description', 'N/A')}\n"
            if 'html_content' in example:
                context_text += f"HTML: {example['html_content'][:200]}...\n"
    
    if context['components']:
        context_text += "\nYou should use one of these available UI components where applicable:\n"
        for comp in context['components'][:5]:
            context_text += f"- {comp.get('name', 'Unknown')}: {comp.get('description', 'N/A')}\n"
    
    prompt = [
        {
            "role": "system",
            "content": f"""You are an expert at generating educational web interfaces using CMU's Cognitive Tutor Authoring Tools (CTAT). 
            Create complete, functional HTML with embedded CSS and JavaScript for a CTAT interface.

            Guidelines:
            - Generate complete, self-contained HTML files
            - Include CSS styling using a <style> tag for an attractive, educational interface
            - Add basic JS using a <script> tag for interactivity where appropriate
            - Focus on educational best practices (clear instructions, feedback, etc.)
            - Make interfaces responsive and accessible
            - Use semantic HTML
            - Provide no other information beyond the code itself

            {context_text}
            """
        },
        {
            "role": "user", 
            "content": f"Create a complete HTML interface for: {description}"
        }
    ]
    
    print(prompt)
    return prompt

def record_interface_data(response):
    """Record interface generation data to CSV."""
    interface_csv = './data/interface_data.csv'
    
    if not os.path.exists(interface_csv):
        df = pd.DataFrame(columns=['model', 'description', 'interface_type', 'response', 'time_elapsed'])
    else:
        df = pd.read_csv(interface_csv)

    new_data = {
        'model': response['model'],
        'description': response.get('description', ''),
        'interface_type': response.get('interface_type', 'unknown'),
        'response': response['response'],
        'time_elapsed': response.get('time_elapsed', None)
    }
    
    df.loc[len(df)] = new_data
    df.to_csv(interface_csv, index=False)


    return render_template('interface.html')


if __name__ == '__main__':
    app.run(debug=True)
