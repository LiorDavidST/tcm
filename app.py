from flask import Flask, request, jsonify, render_template
from runner import run_python_code

app = Flask(__name__, static_folder='static', template_folder='templates')

# 🔹 דף הבית – index.html
@app.route('/')
def home():
    return render_template('index.html')

# 🔹 דף שער לקורס – academy.html
@app.route('/academy')
def academy():
    return render_template('academy.html')

# 🔹 דף מערכת הקורס – index_lessons.html
@app.route('/lessons')
def lessons():
    return render_template('index_lessons.html')

# 🔹 API להרצת קוד Python
@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code', '')
    output = run_python_code(code)
    return jsonify({'output': output})

if __name__ == '__main__':
    app.run(debug=True)
