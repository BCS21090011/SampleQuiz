import { FetchJSON, GetURLParams } from "./URIUtils.js";
import Card from "./Card.js";
import MarkdownToHTMLString from "./MarkDownUtils.js"

const flashCardContainer = document.querySelector("div#FlashCardContainer");
const prevBtn = document.querySelector("div#PageActionDiv > button#PrevBtn");
const nextBtn = document.querySelector("div#PageActionDiv > button#NextBtn");

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
    front.innerHTML = MarkdownToHTMLString(question);
    cardDiv.appendChild(front);

    const back = document.createElement("div");
    back.classList.add("Card-face", "Back");
    back.innerHTML = MarkdownToHTMLString(answerExplanation);
    cardDiv.appendChild(back);

    const cardObj = new Card(cardContainer);

    cardContainer.onclick = (e) => {
        cardObj.Flip();
    };

    return cardObj;
}

function LoadFlashCard (cardContainer) {
    flashCardContainer.innerHTML = "";
    flashCardContainer.appendChild(cardContainer);
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

async function GetAndProcessFlashCard (lvl) {
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
    const processedFlashCards = flashCardJSON.map((fc) => {
        return CreateFlashCard(fc);
    });

    if (flashCardCount > 0) {
        LoadFlashCard(processedFlashCards[flashCardIndex].Parent);
    }

    if (flashCardCount == 1) {
        HideElement(prevBtn);
        HideElement(nextBtn);

        prevBtn.onclick = (e) => { };
        nextBtn.onclick = (e) => { };
    }
    else if (flashCardCount > 1) {
        HideElement(prevBtn);
        UnHideElement(nextBtn);

        prevBtn.onclick = (e) => {
            if (flashCardIndex > 0) {
                flashCardIndex -= 1;
                LoadFlashCard(processedFlashCards[flashCardIndex].Parent);
                HandleActionBtn(flashCardIndex, flashCardCount);
            }
        }

        nextBtn.onclick = (e) => {
            if (flashCardIndex < flashCardCount - 1) {
                flashCardIndex += 1;
                LoadFlashCard(processedFlashCards[flashCardIndex].Parent);
                HandleActionBtn(flashCardIndex, flashCardCount);
            }
        }
    }
    else {
        alert("There are no flash card fetched.");
    }
}

const urlParams = GetURLParams();
const lvl = urlParams["lvl"];

if (lvl != undefined) {
    GetAndProcessFlashCard(lvl);
}
else {
    const userInputLvl = prompt("lvl needed!");
    GetAndProcessFlashCard(userInputLvl);
}