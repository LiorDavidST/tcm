# 🐍 דימוי בסיס
FROM python:3.11-slim

# תיקיית עבודה
WORKDIR /app

# העתקת קבצים
COPY . .

# התקנת ספריות
RUN pip install --no-cache-dir -r requirements.txt

# הפעלת Gunicorn (לא Flask ישירות)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
