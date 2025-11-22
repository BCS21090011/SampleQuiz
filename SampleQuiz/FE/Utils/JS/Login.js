import { FetchJSON, GetURLParams, FormURLParams } from "./URIUtils.js";
import { LoadToSessionStorage } from "./SessionStorageUtils.js";

const urlParams = GetURLParams();
let dest = decodeURI(urlParams["dest"]) ?? "./MainPage.html";
let completeURLParam = window.location.search;

const loginForm = document.querySelector("#LoginForm");
const createAccountA = document.querySelector("a#CreateAccountA");

createAccountA.href = `./Register.html${completeURLParam}`;

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
            LoadToSessionStorage("JWT", resultJSON["token"]);
            loginSuccess = true;
            alert("Login successful!");
        }
        else {
            alert(`Login Failed: ${resultJSON["message"]}`);
        }
    }
    else {
        const message = resultJSON == null ? result["Error"] : resultJSON["message"];

        alert(`Error: ${message}`);
    }

    if (loginSuccess == true) {
        const {["dest"]: _, ...restParams} = urlParams;
        const restParamStr = FormURLParams(restParams);

        if (restParamStr.length > 0) {
            dest += `?${restParamStr}`;
        }

        window.location = `${dest}`;
    }
};