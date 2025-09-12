# LLM Model Testing

This repository is dedicated to testing the speed and performance of various Large Language Models (LLMs) for socratic tutoring. The goal is to benchmark different models, compare their performance, and document the results for future reference.

## Running the App

1. Clone this repository:
    ```bash
    git clone https://github.com/Dap185/model-testing
    cd model-testing
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Run the program:
    ```bash
    python app.py
    ```

4. Open "http://127.0.0.1:5000" to interact

## Keys
You need to make a .env file in the root of the project with `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `ANTHROPIC_API_KEY`.


## Getting the data
It will make a file in the project called data.csv

## Site Directory
1. http://127.0.0.1:5000/custom lets you test whatever prompts you want
2. http://127.0.0.1:5000/adding lets you test the adding prompts as they exist in DP
3. http://127.0.0.1:5000/numberline lets you test the numberline prompts as they exist in Decimal Point
4. http://127.0.0.1:5000/socraticPromptRequirements provides an interface for testing based on the requirements for socratic dialogue that Dr. McLaren laid out in September 2025. (See below)

## Socratic Dialogue Prompt Requirements
[Link to Bruce's work on prompting](https://docs.google.com/document/d/188tmspawsaUifEHmj2Lyi82yMnl3q_l3nsOZiMUy-Uo/edit?usp=sharing)

## TODO

1. Draw up interfaces for other decimal point level types (3 others)

2. Add tokens analytics (for cost analysis)

3. Deploy online for anyone to use
