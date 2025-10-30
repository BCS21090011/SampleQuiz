import { FetchJSON, GetURLParams } from "./URIUtils.js";

const questionDiv = document.querySelector("div#QuestionDiv");
const answerDiv = document.querySelector("div#AnswerDiv");
const prevBtn = document.querySelector("div#ActionDiv > button#PrevBtn");
const nextBtn = document.querySelector("div#ActionDiv > button#NextBtn");

let quizUserAnswers = [];

function StylingAnswerBtn(btn, index, correctAnswerIndex) {
    btn.classList.add("Selected");

    if (index == correctAnswerIndex) {
        btn.classList.add("Correct");
    }
}

function CreateLvlQuiz (index, quizInfo) {
    const question = quizInfo["Question"];
    const answers = quizInfo["Answers"];
    const correctAnswerIndex = quizInfo["CorrectAnswerIndex"]

    questionDiv.innerHTML = "";
    const questionNum = document.createElement("p");
    questionNum.classList.add("QuestionNum");
    questionNum.innerText = `Question ${index + 1}:`;
    questionDiv.appendChild(questionNum);

    const questionP = document.createElement("p");
    questionP.innerText = question;
    questionDiv.appendChild(questionP);

    answerDiv.innerHTML = "";
    answers.forEach((answer, ansIndex) => {
        const btn = document.createElement("button");
        btn.classList.add("AnswerBtn");
        btn.innerText = answer;
        btn.onclick = (e) => {
            if (quizUserAnswers[index]["UserAnswer"] == null) {
                quizUserAnswers[index]["UserAnswer"] = ansIndex;
                StylingAnswerBtn(btn, ansIndex, correctAnswerIndex);
            }
        };

        if (ansIndex == quizUserAnswers[index]["UserAnswer"]) {
            StylingAnswerBtn(btn, ansIndex, correctAnswerIndex);
        }

        answerDiv.appendChild(btn);
    });
}

function HideElement(elem) {
    elem.classList.add("Hidden");
}

function UnHideElement(elem) {
    elem.classList.remove("Hidden");
}

function HandleActionBtn(indexAfterAction, totalLength) {
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

const lvl = urlParams["lvl"];

async function GetAndProcessQuiz(lvl) {
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
}

if (lvl != undefined) {
    GetAndProcessQuiz(lvl);
}
else {
    const userInputLvl = prompt("lvl needed!");
    GetAndProcessQuiz(userInputLvl);
}