async function FetchJSON(uri, param, headers, body, method="GET") {
    let response = null;
    let error = null;
    let json = null;

    try {
        if (param != null) {
            if (Object.keys(param).length > 0) {
                const params = [];

                for(const key in param) {
                    const val = param[key];
                    params.push(`${encodeURI(key)}=${encodeURI(val)}`);
                }

                uri += "?" + params.join("&");
            }
        }

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

        if (response != null) {
            json = await response.json();
            
            if (!response.ok) {
                error = response.statusText;
            }
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

function FormURLParams(paramMap) {
    const paramStrs = [];

    for (const key in paramMap) {
        const val = paramMap[key];
        paramStrs.push(`${encodeURI(key)}=${encodeURI(val)}`);
    }

    return paramStrs.join("&");
}

export { FetchJSON, GetURLParams, FormURLParams };