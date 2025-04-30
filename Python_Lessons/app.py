from flask import Flask, request, jsonify, render_template
from runner import run_python_code

app = Flask(__name__, static_folder='static', template_folder='templates')


# 🔹 דף הבית – שער ל־TCM ACADEMY (academy.html)
@app.route('/')
def home():
    return render_template('academy.html')


# 🔹 דף הקורס האינטראקטיבי – קבצי קורס Python
@app.route('/python')
def python_course():
    return render_template('index.html')


# 🔹 API להרצת קוד Python
@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code', '')
    output = run_python_code(code)
    return jsonify({'output': output})


if __name__ == '__main__':
    app.run(debug=True)
