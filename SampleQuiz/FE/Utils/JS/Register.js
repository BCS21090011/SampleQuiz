const registrationForm = document.querySelector("#RegistrationForm");
registrationForm.onsubmit = function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const password = formData.get("PasswordInput");
    const confirmPassword = formData.get("ConfirmPasswordInput");

    if (password !== confirmPassword) {
        alert("Password missmatch, please retry.");
    }
};