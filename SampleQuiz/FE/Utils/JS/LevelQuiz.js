import { FetchJSON, GetURLParams } from "./URIUtils.js";

const popupLayer = document.querySelector("#PopupLayer");
const popupDiv = document.querySelector("#PopupLayer > div#PopupDiv");

let popupTimeoutID = null;

function ShowPopupLayer () {
    UnHideElement(popupLayer);
}

function HidePopupLayer () {
    HideElement(popupLayer);
}

function PopupCorrect (content="A passionate text here...") {
    popupDiv.innerHTML = "";

    const h1 = document.createElement("h1");
    h1.innerText = "Congratulation";
    popupDiv.appendChild(h1);

    const p = document.createElement("p");
    p.innerText = content;
    popupDiv.appendChild(p);

    ShowPopupLayer();

    popupTimeoutID = setTimeout(() => {
        popupDiv.innerHTML = "";
        HidePopupLayer();
        popupTimeoutID = null;
    }, 3500);
}

function PopupIncorrect (content="Text about wrong answer here...") {
    popupDiv.innerHTML = "";

    const h1 = document.createElement("h1");
    h1.innerText = "Oh no...";
    popupDiv.appendChild(h1);

    const p = document.createElement("p");
    p.innerText = content;
    popupDiv.appendChild(p);

    ShowPopupLayer();

    popupTimeoutID = setTimeout(() => {
        popupDiv.innerHTML = "";
        HidePopupLayer();
        popupTimeoutID = null;
    }, 3500);
}

popupLayer.onclick = (e) => {
    HidePopupLayer();
    
    if (popupTimeoutID != null) {
        clearTimeout(popupTimeoutID);
    }
}

const questionDiv = document.querySelector("div#QuestionDiv");
const questionNum = document.querySelector("#QuestionNum");
const actualQstDiv = document.querySelector("#ActualQuestionDiv");
const quizMarkP = document.querySelector("#QuizMark");
const answerDiv = document.querySelector("div#AnswerDiv");
const prevBtn = document.querySelector("div#PageActionDiv > button#PrevBtn");
const nextBtn = document.querySelector("div#PageActionDiv > button#NextBtn");

let quizUserAnswers = [];
let answerBtns = [];
let quizMark = 0;
let totalQuizMark = 0;

function StylingAnswerBtn (btn, correctAns=true) {
    btn.classList.add("Selected");

    if (correctAns == true) {
        btn.classList.add("Correct");
    }
}

function QuizMarkHandler (mark=0) {
    quizMark += mark;
    quizMarkP.innerText = `${quizMark}/${totalQuizMark}`;
}

function MarkdownToHTML (markdown) {
    const converter = new showdown.Converter({ strikethrough: true });
    return converter.makeHtml(markdown);
}

function CreateLvlQuiz (index, quizInfo) {
    answerBtns = [];

    const question = quizInfo["Question"];
    const answers = quizInfo["Answers"];
    const correctAnswerIndex = quizInfo["CorrectAnswerIndex"];
    const answerExplanation = quizInfo["AnswerExplanation"];

    questionNum.innerText = `Question ${index + 1}:`;

    actualQstDiv.innerHTML = MarkdownToHTML(question);

    answerDiv.innerHTML = "";
    answers.forEach((answer, ansIndex) => {
        const btn = document.createElement("button");
        btn.classList.add("AnswerBtn");
        btn.innerText = answer;
        btn.onclick = (e) => {
            if (quizUserAnswers[index]["UserAnswer"] == null) {
                quizUserAnswers[index]["UserAnswer"] = ansIndex;

                if (ansIndex == correctAnswerIndex) {
                    QuizMarkHandler(1);
                    StylingAnswerBtn(btn, true);
                    PopupCorrect(answerExplanation);
                }
                else {
                    StylingAnswerBtn(btn, false);
                    StylingAnswerBtn(answerBtns[correctAnswerIndex], true);
                    PopupIncorrect(answerExplanation);
                }
            }
        };

        if (quizUserAnswers[index]["UserAnswer"] != null) {
            if (ansIndex == correctAnswerIndex) {
                StylingAnswerBtn(btn, true);
            }
            else if (ansIndex == quizUserAnswers[index]["UserAnswer"]) {    // It's not the correct answer, but the answer use choose:
                StylingAnswerBtn(btn, false);
            }
        }

        answerBtns.push(btn);
        answerDiv.appendChild(btn);
    });
}

function HandleActionBtn (indexAfterAction, totalLength) {
    // If it's first item:
    if (indexAfterAction == 0) {
        HideElement(prevBtn);
    }
    else {
        UnHideElement(prevBtn);
    }

    // If it's last item:
    if (indexAfterAction == totalLength - 1) {
        HideElement(nextBtn);
    }
    else {
        UnHideElement(nextBtn);
    }
}

const urlParams = GetURLParams();
const questionTitleCard = document.querySelector("#QuestionTitleCard");
const backBtn = document.querySelector("button#BackBtn.ActionBtn");
const submitBtn = document.querySelector("button#SubmitBtn.ActionBtn");

backBtn.onclick = (e) => {
    window.location = "./LevelSelection.html";
}

submitBtn.onclick = (e) => {
    window.location = "./Login.html";
}

const lvl = urlParams["lvl"];

async function GetAndProcessQuiz (lvl) {
    const lvlQuizInfo = await FetchJSON(`../DummyData/QuizLevel${lvl}.json`)
        .catch((reason) => {
            alert(`Error encountered:\n${reason}`);
        });
    
    if (lvlQuizInfo["Error"]) {
        alert(lvlQuizInfo["Error"]);
        return;
    }

    let quizIndex = 0;  // Always start with first question.
    const lvlQuizJSON = lvlQuizInfo["JSON"];
    quizUserAnswers = lvlQuizJSON.map((qst) => {
        return {
            ...qst,
            "UserAnswer": null
        }
    });
    const questionCount = lvlQuizJSON.length;
    totalQuizMark = questionCount;  // Separated with question count, in case they aren't the same.

    if (questionCount > 0) {
        CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]);
    }

    if (questionCount == 1) {
        // Hide both action buttons as they are not needed:
        HideElement(prevBtn);
        HideElement(nextBtn);

        prevBtn.onclick = (e) => { };
        nextBtn.onclick = (e) => { };
    }
    else if (questionCount > 1) {
        // Since it'll always starts with first question, prevBtn is not needed first.
        HideElement(prevBtn);
        UnHideElement(nextBtn);

        prevBtn.onclick = (e) => {
            // If it'll not be the first item:
            if (quizIndex > 0) {
                quizIndex -= 1;
                CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]);
                HandleActionBtn(quizIndex, questionCount);
            }
        }

        nextBtn.onclick = (e) => {
            // If it'll not be the last item:
            if (quizIndex < questionCount - 1) {
                quizIndex += 1;
                CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]);
                HandleActionBtn(quizIndex, questionCount);
            }
        }
    }
    else {
        alert("There are no question fetched.");
    }
    
    QuizMarkHandler();
}

if (lvl != undefined) {
    GetAndProcessQuiz(lvl);
    questionTitleCard.innerText = `QUIZ LEVEL ${lvl}`;
}
else {
    const userInputLvl = prompt("lvl needed!");
    GetAndProcessQuiz(userInputLvl);
}