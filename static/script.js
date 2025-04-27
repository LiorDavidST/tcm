<script>
  document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // מונע רענון דף

    const form = event.target;
    const formData = new FormData(form);
    const messageElement = document.getElementById('form-message');

    // מנקה הודעות ישנות
    messageElement.textContent = '';
    messageElement.style.color = '';

    fetch('send_mail.php', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(result => {
      if (result.trim() === 'success') {
        messageElement.style.color = 'green';
        messageElement.textContent = '✅ Thank you! Your message has been sent successfully.';

        // מנקה את הטופס
        form.reset();

        // מנע שימוש בטופס (נעל אותו)
        Array.from(form.elements).forEach(function(element) {
          element.disabled = true;
        });

        // מעלים את הודעת ההצלחה אחרי 5 שניות
        setTimeout(() => {
          messageElement.textContent = '';
        }, 5000);

      } else {
        messageElement.style.color = 'red';
        messageElement.textContent = '❌ Sorry, there was an error sending your message. Please try again.';

        // מעלים את הודעת השגיאה אחרי 5 שניות
        setTimeout(() => {
          messageElement.textContent = '';
        }, 5000);
      }
    })
    .catch(error => {
      messageElement.style.color = 'red';
      messageElement.textContent = '❌ Sorry, something went wrong. Please try again later.';

      // מעלים את הודעת השגיאה אחרי 5 שניות
      setTimeout(() => {
        messageElement.textContent = '';
      }, 5000);
    });
  });
</script>
