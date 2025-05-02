  document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // מונע רענון דף

    const form = event.target;
    const formData = new FormData(form);
    const messageElement = document.getElementById('form-message');

    // מנקה הודעות ישנות
    messageElement.textContent = '';
    messageElement.classList.remove('success', 'error');

    fetch('send_mail', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(result => {
      if (result.trim() === 'success') {
        messageElement.classList.remove('error');
        messageElement.classList.add('success');
        messageElement.textContent = '✅ Thank you! Your message has been sent successfully.';

        // מנקה את הטופס
        form.reset();

        // מעלים את ההודעה אחרי 5 שניות
        setTimeout(() => {
          messageElement.textContent = '';
          messageElement.classList.remove('success');
        }, 5000);

      } else {
        messageElement.classList.remove('success');
        messageElement.classList.add('error');
        messageElement.textContent = '❌ Sorry, there was an error sending your message. Please try again.';

        // לא מנקה את הטופס – מאפשר שליחה חוזרת
        setTimeout(() => {
          messageElement.textContent = '';
          messageElement.classList.remove('error');
        }, 7000);
      }
    })
    .catch(error => {
      messageElement.classList.remove('success');
      messageElement.classList.add('error');
      messageElement.textContent = '❌ Sorry, something went wrong. Please try again later.';

      // לא מנקה את הטופס – מאפשר שליחה חוזרת
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.classList.remove('error');
      }, 7000);
    });
  });