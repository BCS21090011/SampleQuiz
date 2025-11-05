import { GetURLParams } from "./URIUtils.js";

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

const loginForm = document.querySelector("#LoginForm");
const createAccountA = document.querySelector("a#CreateAccountA");

createAccountA.href = lvl != undefined ? `./Register.html?lvl=${lvl}` : "./Register.html";

loginForm.onsubmit = function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    if (lvl != undefined) {
        window.location = `./LevelQuizResult.html?lvl=${lvl}`;
    }
    else {
        window.location = "./MainPage.html";
    }
};