function LoadToSessionStorage (key, data) {
    const jsonString = JSON.stringify(data);
    window.sessionStorage.setItem(key, jsonString);
}

function UnloadFromSessionStorage (key) {
    const jsonString = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);

    const jsonData = JSON.parse(jsonString);

    return jsonData;
}

const sessionStorageQuizResultBaseKey = "QuizResultData";

function GetQuizResultSessionStorageKeyOfLvl (lvl) {
    return `${sessionStorageQuizResultBaseKey}_${lvl}`;
}

function LoadAnswersToSessionStorage (lvl, quizMark, totalQuizMark, startDT=null, completionDT=null, quizUserAnswers=[]) {
    const jsonData = {
        "Lvl": lvl,
        "QuizMark": quizMark,
        "TotalQuizMark": totalQuizMark,
        "StartDatetime": startDT != null ? startDT.getTime() : null,
        "CompletionDatetime": completionDT != null ? completionDT.getTime() : null,
        "QuizInfo": quizUserAnswers
    };

    const key = GetQuizResultSessionStorageKeyOfLvl(lvl);

    LoadToSessionStorage(key, jsonData);
}

function UnloadAnswersFromSessionStorage (lvl) {
    const key = GetQuizResultSessionStorageKeyOfLvl(lvl);
    return UnloadFromSessionStorage(key);
}

export { LoadToSessionStorage, UnloadFromSessionStorage, LoadAnswersToSessionStorage, UnloadAnswersFromSessionStorage };