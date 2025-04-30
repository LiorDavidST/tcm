from flask import Flask, request, jsonify, render_template
from runner import run_python_code

app = Flask(__name__)

# טוען את index.html מתוך תיקיית templates
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    code = data.get('code', '')
    output = run_python_code(code)
    return jsonify({'output': output})

if __name__ == '__main__':
    app.run(debug=True)
