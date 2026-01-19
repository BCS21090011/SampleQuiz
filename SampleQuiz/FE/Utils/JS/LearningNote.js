import { FetchJSON, GetURLParams } from "./URIUtils.js";
import MarkdownToHTMLString from "./MarkDownUtils.js";

const noteContainer = document.querySelector("#NoteContainer");
const mainPageBtn = document.querySelector("div#ActionDiv > button#MainPageBtn");
const lvlSelectionBtn = document.querySelector("div#ActionDiv > button#LvlSelectionBtn");
const learningFCBtn = document.querySelector("div#ActionDiv > button#LearningFCBtn");
const playBtn = document.querySelector("div#ActionDiv > button#PlayBtn.ActionBtn");

async function GetAndProcessNote(lvl) {
    const noteInfo = await FetchJSON(`../DummyData/LevelNotes.json`)
        .catch((reason) => {
            alert(`Error encountered:\n${reason}`);
        });

    if (noteInfo["Error"]) {
        alert(noteInfo["Error"]);
        return;
    }

    const noteJSON = noteInfo["JSON"];
    const note = noteJSON[lvl];

    if (note == null) {
        alert(`Note not found: ${lvl}`);
        return;
    }

    const noteHTMLString = MarkdownToHTMLString(note);
    noteContainer.innerHTML = noteHTMLString;
}

const urlParams = GetURLParams();
let lvl = urlParams["lvl"];

if (lvl != undefined) {
    GetAndProcessNote(lvl);
}
else {
    lvl = prompt("lvl needed!");
    GetAndProcessNote(lvl);
}

mainPageBtn.onclick = (e) => {
    window.location = "./MainPage";
}

lvlSelectionBtn.onclick = (e) => {
    window.location = "./LevelSelection";
}

learningFCBtn.onclick = (e) => {
    window.location = `./LearningFlashCard?lvl=${lvl}`;
}

playBtn.onclick = (e) => {
    window.location = `./LevelQuiz?lvl=${lvl}`;
}