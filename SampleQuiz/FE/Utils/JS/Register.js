import { GetURLParams } from "./URIUtils.js";

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

const registrationForm = document.querySelector("#RegistrationForm");
const alreadyHaveAccountA = document.querySelector("a#AlreadyHaveAccountA");

alreadyHaveAccountA.href = lvl != undefined ? `./Login.html?lvl=${lvl}` : "./Login.html";

registrationForm.onsubmit = function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const password = formData.get("PasswordInput");
    const confirmPassword = formData.get("ConfirmPasswordInput");

    if (password !== confirmPassword) {
        alert("Password missmatch, please retry.");
    }
    else {
        window.location = lvl != undefined ? `./Login.html?lvl=${lvl}` : "./Login.html";
    }
};