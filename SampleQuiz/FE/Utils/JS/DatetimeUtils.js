function JSDateToMySQLDate(jsDate) {
    const isoString = jsDate.toISOString();

    const mysqlDatetimeString = isoString.slice(0, 19).replace('T', ' ');
    const mysqlDateString = isoString.slice(0, 10);

    return {
        "datetime": mysqlDatetimeString,
        "date": mysqlDateString
    };
}

function DateInputValueToMySQLDate(dateInputValue) {
    if (dateInputValue == "") {
        return null;
    }

    const jsDate = new Date(dateInputValue);
    return JSDateToMySQLDate(jsDate);
}

function DateInputToMySQLDate(dateInput) {
    const dateInputValue = dateInput.value;
    return DateInputValueToMySQLDate(dateInputValue);
}

export default JSDateToMySQLDate;
export { JSDateToMySQLDate, DateInputToMySQLDate, DateInputValueToMySQLDate };