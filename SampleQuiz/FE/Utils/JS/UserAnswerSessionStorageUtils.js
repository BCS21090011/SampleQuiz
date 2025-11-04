const sessionStorageBaseKey = "QuizResultData";

function GetSessionStorageKeyOfLvl (lvl) {
    return `${sessionStorageBaseKey}_${lvl}`;
}

function LoadAnswersToSessionStorage (lvl, quizMark, startDT=null, completionDT=null, quizUserAnswers=[]) {
    const jsonData = {
        "Lvl": lvl,
        "QuizMark": quizMark,
        "StartDatetime": startDT != null ? startDT.getTime() : null,
        "CompletionDatetime": completionDT != null ? completionDT.getTime() : null,
        "QuizInfo": quizUserAnswers
    };

    const jsonString = JSON.stringify(jsonData);

    window.sessionStorage.setItem(GetSessionStorageKeyOfLvl(lvl), jsonString);
}

function UnloadAnswersFromSessionStorage (lvl) {
    const jsonString = window.sessionStorage.getItem(GetSessionStorageKeyOfLvl(lvl));
    window.sessionStorage.removeItem(GetSessionStorageKeyOfLvl(lvl));
    
    const jsonData = JSON.parse(jsonString);

    return jsonData;
}

export { LoadAnswersToSessionStorage, UnloadAnswersFromSessionStorage };