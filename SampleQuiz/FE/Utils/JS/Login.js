const loginForm = document.querySelector("#LoginForm");

loginForm.onsubmit = function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    window.location = "./MainPage.html"
};