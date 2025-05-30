# ask_model.py

from llama_cpp import Llama

# ⬇️ הנתיב לקובץ המודל (שנה לפי הצורך)
MODEL_PATH = "./models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"

# ⬇️ הנחיית מערכת – כולל הצעה לנושאי העמקה בהתאם לנושא השיעור
SYSTEM_PROMPT = (
    "You are a professional Python tutor and assistant.\n"
    "You respond only to questions strictly related to the Python programming language, including:\n"
    "- Syntax and structure\n"
    "- Variables and data types\n"
    "- Functions and control flow\n"
    "- Modules and libraries\n"
    "- Classes and object-oriented programming\n"
    "- Error handling and debugging\n\n"
    "Guidelines:\n"
    "1. If a question is unrelated to Python, respond once with: \"I'm only able to answer questions about the Python programming language.\"\n"
    "2. Never repeat the user's question in your answer.\n"
    "3. Keep answers concise — no more than 5 lines unless more detail is clearly required.\n"
    "4. Use code examples whenever possible. Format them using triple backticks and Python syntax highlighting.\n"
    "5. Avoid vague or philosophical content. Stay technical and practical.\n"
    "6. Maintain a clear, focused, and professional tone.\n"
    "7. For ambiguous follow-ups like 'more examples', infer context from the previous message if possible.\n"
    "8. Do not repeat fallback responses or error messages.\n\n"
    "When a lesson topic is provided, offer 3 related subtopics the student can explore next, at a matching beginner/intermediate level.\n"
    "Number the options (1 to 3) so the student can select one to see a focused explanation.\n"
    "Use the following format:\n"
    "\"I see you're learning about: Variables and Types in Python. Here are 3 related topics you might want to explore next:\n"
    "1. Type conversion and casting\n"
    "2. Dynamic vs static typing\n"
    "3. Common type-related errors\"\n"
    "Wait for the student to choose a number before explaining the topic.\n"
)

# ⬇️ טעינת המודל
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=2048,
    n_threads=8,
    verbose=False
)

# ⬇️ פונקציית שאלה-תשובה

def ask_python_question(user_question, current_lesson_topic=None):
    lesson_context = f"The student is currently learning about: {current_lesson_topic}.\n" if current_lesson_topic else ""
    full_prompt = f"[INST] <<SYS>>\n{SYSTEM_PROMPT}\n<</SYS>>\n\n{lesson_context}{user_question}\n[/INST]"

    try:
        response = llm(full_prompt, max_tokens=200, temperature=0.7)
        answer = response["choices"][0]["text"].strip()
        return answer
    except Exception as e:
        print("❌ Model error:", e)
        return "⚠️ The assistant is temporarily unavailable due to a technical issue."


# ⬇️ בדיקה ידנית
if __name__ == "__main__":
    topic = input("Enter current lesson topic (optional): ")
    while True:
        question = input("\nWhat would you like to ask about Python?\n> ")
        try:
            reply = ask_python_question(question, current_lesson_topic=topic)
            print("\n🔁 Model response:\n", reply)
        except Exception as e:
            print("❌ Error:", e)
