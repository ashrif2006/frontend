import { handleRegister } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("storeName");

    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");

    const slugInput = document.getElementById("slug");

    const spinner = document.getElementById("spinner")

    const btnText = document.getElementById("btnText")



    if (!nameInput || !emailInput || !passwordInput || !slugInput) {
      alert("برجهء ملء الداتا ");
      return;
    }

    const ownerData = {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      slug: slugInput.value,
    };
    btnText.innerHTML="";
    spinner.classList.remove('d-none')

    const result = await handleRegister(ownerData);
    
    
    btnText.innerHTML="انشاء متجر";
    spinner.classList.add('d-none')
    console.log(result)
    if(result.success){
        alert("تم تسجيل الدخول بنجاح ");
        // window.location.href = 'dashboard.html';
    }
    else{
        alert(result.message)
    }
  });
});


