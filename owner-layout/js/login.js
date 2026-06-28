import {handleLogin} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        // event.stopPropagation();
        form.classList.add('was-validated');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const result = await handleLogin(email.value.trim(), password.value);

        if (result.success) {
            alert('Login successful!');
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message || 'Login failed. Please check your credentials and try again.');
            email.value="";
            password.value="";
        }
    });
});

    document.getElementById('togglePass').addEventListener('click', function () {
      const pass = document.getElementById('password');
      pass.type = pass.type === 'password' ? 'text' : 'password';
    });