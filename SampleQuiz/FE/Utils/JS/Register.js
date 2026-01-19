import { FetchJSON, GetURLParams } from "./URIUtils.js";
import { DateInputValueToMySQLDate } from "./DatetimeUtils.js";

const urlParam = window.location.search;

const registrationForm = document.querySelector("#RegistrationForm");
const alreadyHaveAccountA = document.querySelector("a#AlreadyHaveAccountA");

alreadyHaveAccountA.href = `./Login${urlParam}`;

async function RegisterUser(username, password, useremail, userbirthdate, usergender) {
    const result = await FetchJSON(
        "/API/Register",
        undefined,
        {
            "Content-Type": "application/json"
        },
        JSON.stringify({
            "username": username,
            "password": password,
            "useremail": useremail,
            "userbirthdate": userbirthdate,
            "usergender": usergender
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

registrationForm.onsubmit = async function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    const username = formData.get("UserNameInput");
    const password = formData.get("PasswordInput");
    const confirmPassword = formData.get("ConfirmPasswordInput");
    let useremail = formData.get("UserEmailInput");
    const userbirthdateData = DateInputValueToMySQLDate(formData.get("UserBirthDateInput"));
    const userbirthdate = userbirthdateData == null ? null : userbirthdateData["date"];
    let usergender = formData.get("UserGenderInput");

    if (useremail == "") {
        useremail = null;
    }

    if (usergender == "") {
        usergender = null;
    }

    if (password !== confirmPassword) {
        alert("Password missmatch, please retry.");
    }
    else {
        const registrationSuccess = await RegisterUser(username, password, useremail, userbirthdate, usergender);

        if (registrationSuccess == true) {
            window.location = `./Login${urlParam}`;
        }
    }
};