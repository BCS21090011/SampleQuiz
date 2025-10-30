import { FetchJSON, GetURLParams } from "./URIUtils.js";

const questionDiv = document.querySelector("div#QuestionDiv");
const answerDiv = document.querySelector("div#AnswerDiv");
const prevBtn = document.querySelector("div#ActionDiv > button#PrevBtn");
const nextBtn = document.querySelector("div#ActionDiv > button#NextBtn");

function CreateLvlQuiz (index, question, answers, correctAnswerIndex) {
    questionDiv.innerHTML = "";
    const questionNum = document.createElement("p");
    questionNum.classList.add("QuestionNum");
    questionNum.innerText = `Question ${index + 1}:`;
    questionDiv.appendChild(questionNum);

    const questionP = document.createElement("p");
    questionP.innerText = question;
    questionDiv.appendChild(questionP);

    answerDiv.innerHTML = "";
    answers.forEach((answer, index) => {
        const btn = document.createElement("button");
        btn.classList.add("AnswerBtn");
        btn.innerText = answer;
        btn.onclick = (e) => {
            if (index == correctAnswerIndex) {
                alert("Correct answer");
            }
        };
        answerDiv.appendChild(btn);
    });
}

const urlParams = GetURLParams();

const lvl = urlParams["lvl"];
let quizIndex = 0;

if (lvl != null) {
    FetchJSON(`../DummyData/QuizLevel${lvl}.json`)
        .then((lvlQuizInfo) => {
            const lvlQuizJSON = lvlQuizInfo["JSON"];

            if (lvlQuizJSON.length > 0) {
                CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]["Question"], lvlQuizJSON[quizIndex]["Answers"], lvlQuizJSON[quizIndex]["CorrectAnswerIndex"]);

                if (lvlQuizJSON.length > 1) {
                    nextBtn.classList.remove("Hidden");

                    nextBtn.onclick = (e) => {
                        if (quizIndex < lvlQuizJSON.length - 1) {
                            quizIndex += 1;
                            CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]["Question"], lvlQuizJSON[quizIndex]["Answers"], lvlQuizJSON[quizIndex]["CorrectAnswerIndex"]);

                            if (quizIndex == 0) {
                                prevBtn.classList.add("Hidden");
                            }
                            else {
                                prevBtn.classList.remove("Hidden");
                            }

                            if (quizIndex == lvlQuizJSON.length - 1) {
                                nextBtn.classList.add("Hidden");
                            }
                            else {
                                nextBtn.classList.remove("Hidden");
                            }
                        }
                    }

                    prevBtn.onclick = (e) => {
                        if (quizIndex > 0) {
                            quizIndex -= 1;
                            CreateLvlQuiz(quizIndex, lvlQuizJSON[quizIndex]["Question"], lvlQuizJSON[quizIndex]["Answers"], lvlQuizJSON[quizIndex]["CorrectAnswerIndex"]);

                            if (quizIndex == 0) {
                                prevBtn.classList.add("Hidden");
                            }
                            else {
                                prevBtn.classList.remove("Hidden");
                            }

                            if (quizIndex == lvlQuizJSON.length - 1) {
                                nextBtn.classList.add("Hidden");
                            }
                            else {
                                nextBtn.classList.remove("Hidden");
                            }
                        }
                    }
                }
            }
        });
}