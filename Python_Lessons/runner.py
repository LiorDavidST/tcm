import subprocess
import tempfile

def run_python_code(code):
    try:
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp:
            temp.write(code)
            temp.flush()

            result = subprocess.run(
                ['python', temp.name],
                capture_output=True,
                text=True,
                timeout=5
            )
            output = result.stdout + result.stderr
            return output
    except Exception as e:
        return str(e)
