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

export default GetURLParams;
export { GetURLParams };