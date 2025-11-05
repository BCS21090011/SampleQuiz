import MarkdownToHTMLString from "./MarkDownUtils.js";
import { UnloadAnswersFromSessionStorage } from "./UserAnswerSessionStorageUtils.js";
import { GetURLParams } from "./URIUtils.js";

const contentCard = document.querySelector("#ContentCard");

function GetResultMarkComment (markPerc) {

    if (markPerc == 100) {
        return "YOU ARE A GENIUS!!!";
    }
    else if (markPerc >= 80) {
        return "GREAT JOB";
    }
    else if (markPerc >= 50) {
        return "MARKS DOESN'T DEFINE YOU, THAT'S OK";
    }
    else if (markPerc >= 20) {
        return "MAYBE IT'S BETTER FOR YOU TO STAY AWAY FROM THE ROAD";
    }
    else if (markPerc >= 10) {
        return "JUST TO CLARIFY, PLEASE ANSWER THE QUESTIONS CORRECTLY";
    }
    else if (markPerc == 0) {
        return "Wow, this is actually an achievement.";
    }
    else {
        return "This is odd, is it you or my issue?";
    }
}

function CreateResultContent (result) {
    const quizMark = result["QuizMark"];
    const totalQuizMark = result["TotalQuizMark"];
    const markPerc = (quizMark / totalQuizMark) * 100;

    contentCard.innerHTML = "";

    const h2 = document.createElement("h2");
    h2.innerText = "Your mark is:";
    h2.classList.add("ResultText");
    contentCard.appendChild(h2);

    const h1 = document.createElement("h1");
    h1.innerText = `${markPerc.toFixed(2)}%`;
    h1.classList.add("ResultMark");
    contentCard.appendChild(h1);

    const h3 = document.createElement("h3");
    h3.innerText = GetResultMarkComment(markPerc);
    h3.classList.add("ResultComment");
    contentCard.appendChild(h3);
}

function HandleResultContent (lvl) {
    const result = UnloadAnswersFromSessionStorage(lvl);

    if (result != undefined) {
        CreateResultContent(result);
    }
    else {
        alert("Result not found!");
    }
}

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

if (lvl != undefined) {
    HandleResultContent(lvl);
}
else {
    lvl = prompt("lvl needed!");
    HandleResultContent(lvl);
}