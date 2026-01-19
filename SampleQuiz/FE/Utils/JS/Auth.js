function GetCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') { // Remove leading spaces
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) { // Check if the cookie name matches
            // Decode the cookie value before returning
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null; // Return null if the cookie is not found
}

async function JWTValid() {
    const validResult = {
        "Valid": false,
        "Status": 500,
        "ErrorMsg": null
    };

    try {
        const response = await fetch("/API/ValidateJWT", {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                token: GetCookie("JWT")
            })
        });

        if (response.ok) {
            validResult["Valid"] = true;
            validResult["Status"] = response.status;
            validResult["ErrorMsg"] = null;
        }
        else {
            const data = await response.json();

            validResult["Valid"] = false;
            validResult["Status"] = response.status;
            validResult["ErrorMsg"] = data["message"];
        }
    }
    catch (error) {
        validResult["Valid"] = false;
        validResult["Status"] = 500;
        validResult["ErrorMsg"] = error.message;
    }

    return validResult;
}

function JWT_Invalid_RedirectLogin(status, errorMsg) {
    alert(`Authentication failed (${status}):\n${errorMsg}`);

    let destParams = window.location.search.substring(1);

    if (destParams.length > 0) {
        destParams = `&${destParams}`;
    }

    window.location = `./Login?dest=${encodeURI(window.location.pathname)}${destParams}`;
}

async function HandleJWT(onInvalidCallback = null) {
    const jwtStatus = await JWTValid();

    if (jwtStatus["Valid"] == false) {
        if (onInvalidCallback == null) {
            // Will redirect to login by default:
            onInvalidCallback = JWT_Invalid_RedirectLogin;
        }

        onInvalidCallback(jwtStatus["Status"], jwtStatus["ErrorMsg"]);
    }

    return jwtStatus["Valid"];
}

export default HandleJWT;
export { GetCookie, JWTValid, HandleJWT, JWT_Invalid_RedirectLogin };