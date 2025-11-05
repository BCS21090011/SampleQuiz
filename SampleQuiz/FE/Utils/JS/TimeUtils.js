const ConversionToMSTable = {
    "day": 24 * 60 * 60 * 1000,
    "hour": 60 * 60 * 1000,
    "minute": 60 * 1000,
    "second": 1000,
    "millisecond": 1
}

const TimePluralTable = {
    "century": "centuries",
    "decade": "decades",
    "year": "years",
    "season": "seasons",
    "month": "months",
    "week": "weeks",
    "day": "days",
    "hour": "hours",
    "quarter": "quarters",
    "minute": "minutes",
    "second": "seconds",
    "millisecond": "milliseconds"
}

function ConversionHelper (map, key, convConst, val, skipIfHaveVal=true) {
    const convVal = Math.floor(val / convConst);
    val %= convConst;

    if (Math.abs(convVal) > 0) {
        map[key] = convVal;
    }
    else if (skipIfHaveVal == false) {
        map[key] = convVal;
    }

    return val;
}

function MSConvert (ms, skipIfHaveVal=true) {
    const converted = {};

    for (const key in ConversionToMSTable) {
        const convConst = ConversionToMSTable[key];
        ms = ConversionHelper(
            converted,
            key,
            convConst,
            ms,
            skipIfHaveVal
        );
    }

    return converted;
}

function MSToStr (ms) {
    const converted = MSConvert(ms, true);
    const convertedStrs = [];

    for (const key in converted) {
        const val = converted[key];

        const unit = val == 1 ? key : TimePluralTable[key];

        convertedStrs.push(`${val} ${unit}`);
    }

    return convertedStrs.join(" ");
}

export {
    ConversionHelper,
    MSConvert,
    MSToStr
};