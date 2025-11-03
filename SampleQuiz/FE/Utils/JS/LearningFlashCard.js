import { FetchJSON, GetURLParams } from "./URIUtils.js";
import Card from "./Card.js";

const urlParams = GetURLParams();
const lvl = urlParams["lvl"];

const flashCardContainer = document.querySelector("div#FlashCardContainer");
const prevBtn = document.querySelector("div#PageActionDiv > button#PrevBtn");
const nextBtn = document.querySelector("div#PageActionDiv > button#NextBtn");

function MarkdownToHTML (markdown) {
    const converter = new showdown.Converter({ strikethrough: true });
    return converter.makeHtml(markdown);
}

function CreateFlashCard (flashCardInfo) {
    const question = flashCardInfo["Question"];
    const answerExplanation = flashCardInfo["AnswerExplanation"];

    const cardContainer = document.createElement("div");
    cardContainer.classList.add("CardContainer");

    const cardDiv = document.createElement("div");
    cardDiv.classList.add("Card");
    cardContainer.appendChild(cardDiv);

    const front = document.createElement("div");
    front.classList.add("Card-face", "Front");
    front.innerHTML = MarkdownToHTML(question);
    cardDiv.appendChild(front);

    const back = document.createElement("div");
    back.classList.add("Card-face", "Back");
    back.innerHTML = MarkdownToHTML(answerExplanation);
    cardDiv.appendChild(back);

    const cardObj = new Card(cardContainer);

    return cardObj;
}

async function GetAndProcessFlashCard () {
    const flashCardInfo = await FetchJSON(`../DummyData/QuizLevel${lvl}.json`)
        .catch((reason) => {
            alert(`Error encountered:\n${reason}`);
        });

    if (flashCardInfo["Error"]) {
        alert(flashCardInfo["Error"]);
        return;
    }

    let flashCardIndex = 0;
    const flashCardJSON = flashCardInfo["JSON"];
    const flashCardCount = flashCardJSON.length;
}