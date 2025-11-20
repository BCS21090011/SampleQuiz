import { FetchJSON, GetURLParams } from "./URIUtils.js";

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

const registrationForm = document.querySelector("#RegistrationForm");
const alreadyHaveAccountA = document.querySelector("a#AlreadyHaveAccountA");

alreadyHaveAccountA.href = lvl != undefined ? `./Login.html?lvl=${lvl}` : "./Login.html";

async function RegisterUser (username, password) {
    const result = await FetchJSON(
        "http://127.0.0.1:5000/API/Register",
        undefined,
        {
            "Content-Type": "application/json"
        },
        JSON.stringify({
            "username": username,
            "password": password
        }),
        "POST"
    );

    const resultJSON = result["JSON"];

    if (result["Error"] == null) {
        if (resultJSON["success"] === true) {
            return true;
        }
        else {
            alert(`Registration Failed: ${resultJSON["message"]}`);
            return false;
        }
    }
    else {
        const message = resultJSON == null ? result["Error"] : resultJSON["message"];

        alert(`Error: ${message}`);
        return false;
    }
}

registrationForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const username = formData.get("UserNameInput");
    const password = formData.get("PasswordInput");
    const confirmPassword = formData.get("ConfirmPasswordInput");

    if (password !== confirmPassword) {
        alert("Password missmatch, please retry.");
    }
    else {
        const registrationSuccess = await RegisterUser(username, password);

        if (registrationSuccess == true) {
            window.location = lvl != undefined ? `./Login.html?lvl=${lvl}` : "./Login.html";
        }
    }
};