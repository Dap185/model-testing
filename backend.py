from flask import Flask, request
import os
import pandas as pd

app = Flask(__name__)
CSV_FILE = 'data.csv'

@app.route('/record', methods=['POST'])
def record():
    data = request.get_json(force=True)
    df = pd.DataFrame([data])
    if not os.path.isfile(CSV_FILE):
        df.to_csv(CSV_FILE, index=False)
    else:
        df.to_csv(CSV_FILE, mode='a', header=False, index=False)
    return {'status': 'success'}, 200

if __name__ == '__main__':
    app.run(debug=True)
