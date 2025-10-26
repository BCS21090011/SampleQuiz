function RGBhexParser(rgbHex) {
    // Ensure is in hex form, with '#' prefix:
    if (rgbHex.startsWith("#")) {
        rgbHex = rgbHex.slice(1);
    }

    // Convert shorthand (#RGB) to full form (#RRGGBB):
    if (rgbHex.length == 3) {
        rgbHex = rgbHex.split("").map(c => c + c).join("");
    }

    const r = parseInt(rgbHex.substr(0, 2), 16);
    const g = parseInt(rgbHex.substr(2, 2), 16);
    const b = parseInt(rgbHex.substr(4, 2), 16);

    return {
        "r": r,
        "g": g,
        "b": b
    };
}

function GetColorBrightness(rgb) {
    rgb = typeof rgb == "string" ? RGBhexParser(rgb) : rgb;
    
    const { r = 0, g = 0, b = 0 } = rgb;

    return (r * 299 + g * 587 + b * 114) / 1000;
}

function IsColorDark(rgb) {
    const brightness = GetColorBrightness(rgb);

    return brightness < 128;
}

export {
    RGBhexParser,
    GetColorBrightness,
    IsColorDark
}