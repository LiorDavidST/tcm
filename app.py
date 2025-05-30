from flask import Flask, request, jsonify, render_template
app = Flask(__name__, static_folder='static', template_folder='templates')
from runner import run_python_code
import smtplib
from email.message import EmailMessage
import os
from ask_model import ask_python_question  # הוסף בתחילת הקובץ

# 🔹 API לשיחה עם מודל שפה
@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.get_json()
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "Question is empty"}), 400

        current_topic = data.get("current_lesson_topic", None)
        answer = ask_python_question(question, current_lesson_topic=current_topic)
        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

# 🔹 API לשליחת מייל
@app.route("/send_mail", methods=["POST"])
def send_mail():
    try:
        name = request.form.get("name", "")
        email = request.form.get("email", "")
        phone = request.form.get("phone", "")
        message = request.form.get("message", "")

        # משתני סביבה
        smtp_host = os.environ.get("SMTP_HOST", "")
        smtp_user = os.environ.get("SMTP_USER", "")
        smtp_pass = os.environ.get("SMTP_PASS", "")
        smtp_port = int(os.environ.get("SMTP_PORT", 465))
        smtp_secure = os.environ.get("SMTP_SECURE", "ssl")

        # בניית גוף ההודעה
        email_message = EmailMessage()
        email_message["Subject"] = "New Contact Form Submission"
        email_message["From"] = smtp_user
        email_message["To"] = smtp_user
        if email:
            email_message["Reply-To"] = f"{name} <{email}>"

        html_body = f"""
        <h3>New message from your website</h3>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Phone:</strong> {phone}</p>
        <p><strong>Message:</strong><br>{message}</p>
        """
        email_message.set_content(html_body, subtype="html")

        # שליחה
        if smtp_secure == "ssl":
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()

        server.login(smtp_user, smtp_pass)
        server.send_message(email_message)
        server.quit()

        return "success"

    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return f"error: {str(e)}", 500

# ✅ חשוב! הפעלת האפליקציה באופן ש-Render יוכל לזהות
if __name__ == '__main__':
    # רק לשימוש מקומי – לא רץ בדוקר
    app.run(host='0.0.0.0', port=5000)
