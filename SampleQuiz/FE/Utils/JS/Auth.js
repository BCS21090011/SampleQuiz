async function JWTValid () {
    const validResult = {
        "Valid": false,
        "Status": 500,
        "ErrorMsg": null
    };

    const jwt = sessionStorage.getItem("JWT");

    if (jwt == null) {
        validResult["Valid"] = false;
        validResult["Status"] = 401;
        validResult["ErrorMsg"] = "Login required!";
    }
    else {
        try {
            const response = await fetch("/API/ValidateJWT", {
                headers: {
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    token: jwt.slice(1, -1)
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
    }

    return validResult;
}

function JWT_Invalid_RedirectLogin (status, errorMsg) {
    alert(`Authentication failed (${status}):\n${errorMsg}`);

    let destParams = window.location.search.substring(1);

    if (destParams.length > 0) {
        destParams = `&${destParams}`;
    }

    window.location = `./Login.html?dest=${encodeURI(window.location.pathname)}${destParams}`;
}

async function HandleJWT (onInvalidCallback=null) {
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
export { JWTValid, HandleJWT, JWT_Invalid_RedirectLogin };