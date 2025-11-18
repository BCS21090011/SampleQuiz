import { FetchJSON, GetURLParams } from "./URIUtils.js";

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

const loginForm = document.querySelector("#LoginForm");
const createAccountA = document.querySelector("a#CreateAccountA");

createAccountA.href = lvl != undefined ? `./Register.html?lvl=${lvl}` : "./Register.html";

loginForm.onsubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const result = await FetchJSON(
        "http://127.0.0.1:5000/api/login",
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

    console.log(result);

    if (result["Error"] == null) {
        const resultJSON = result["JSON"];
        
        alert(JSON.stringify(resultJSON));
    }
    else {
        alert(`Error: ${result["Error"]}`);
    }

    if (lvl != undefined) {
        //window.location = `./LevelQuizResult.html?lvl=${lvl}`;
    }
    else {
        //window.location = "./MainPage.html";
    }
};