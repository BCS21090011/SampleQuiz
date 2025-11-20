import { FetchJSON, GetURLParams } from "./URIUtils.js";
import { LoadToSessionStorage } from "./SessionStorageUtils.js";

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

const loginForm = document.querySelector("#LoginForm");
const createAccountA = document.querySelector("a#CreateAccountA");

createAccountA.href = lvl != undefined ? `./Register.html?lvl=${lvl}` : "./Register.html";

loginForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const result = await FetchJSON(
        "http://127.0.0.1:5000/API/Login",
        undefined,
        {
            "Content-Type": "application/json"
        },
        JSON.stringify({
            "username": formData.get("UserNameInput"),
            "password": formData.get("PasswordInput")
        }),
        "POST"
    );

    const resultJSON = result["JSON"];
    let loginSuccess = false;

    if (result["Error"] == null) {
        if (resultJSON["success"] === true) {
            LoadToSessionStorage("UserID", resultJSON["userId"]);
            loginSuccess = true;
            alert("Login successful!");
        }
        else {
            alert(`Login failed: ${resultJSON["message"]}`);
        }
    }
    else {
        const message = resultJSON == null ? result["Error"] : resultJSON["message"];

        alert(`Error: ${message}`);
    }

    if (loginSuccess == true) {
        if (lvl != undefined) {
            window.location = `./LevelQuizResult.html?lvl=${lvl}`;
        }
        else {
            window.location = "./MainPage.html";
        }
    }
};