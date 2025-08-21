# LLM Model Testing

This repository is dedicated to testing the speed and performance of various Large Language Models (LLMs) for socratic tutoring. The goal is to benchmark different models, compare their performance, and document the results for future reference.

## Running the Tests

1. Clone this repository:
    ```bash
    git clone <repository-url>
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

## Features
http://127.0.0.1:5000/custom lets you test whatever prompts you want
http://127.0.0.1:5000/adding lets you test the adding prompts as they exist in DP
http://127.0.0.1:5000/numberline lets you test the numberline prompts as they exist in DP


## TODO

1. Add a few more models

2. Draw up interfaces for other decimal point level types (3 others)

3. Add tokens analytics (for cost analysis)
