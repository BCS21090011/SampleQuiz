async function FetchJSON(uri, headers, body, method="GET") {
    let response = null;
    let error = null;
    let json = null;

    try {
        response = await fetch(
            uri,
            {
                "method": method,
                "headers": headers,
                "body": body
            }
        )
            .catch((reason) => {
                error = reason;
                return null;
            });

        if (response.ok) {
            json = await response.json();
        }
    }
    catch(err) {
        error = err;
    }

    return {
        "Response": response,
        "Error": error,
        "JSON": json
    }
}

function GetURLParams() {
    const concatParamStr = window.location.search.substring(1);
    const paramStrs = concatParamStr.split("&");

    const paramMap = {};

    if (concatParamStr.length > 0) {
        paramStrs.forEach((paramStr) => {
            const [key, val] = paramStr.split("=");
            paramMap[decodeURI(key)] = decodeURI(val);
        });
    }

    return paramMap;
}

export { FetchJSON, GetURLParams };