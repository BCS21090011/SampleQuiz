import { IsColorDark } from "./ColorUtils.js";

const levelSelectionContainerDiv = document.querySelector("div#LevelSelectionContainer");

const colorPattern = [
    "#32CD32", // Lime Green
    "#FFB300", // Bright Amber/Yellow
    "#FF5C8D", // Pink Coral
    "#00C2FF", // Sky Blue
    "#A020F0", // Vivid Purple
    "#FF6F00" // Orange
];

function CreateLevelCard(levelInfo, index) {
    const color = colorPattern[index % colorPattern.length];
    const txtColor = IsColorDark(color) == true ? "white" : "black";

    const levelCard = document.createElement("div");
    levelCard.classList.add("levelCard", "centerItems");

    const levelNum = document.createElement("p");
    levelNum.classList.add("LevelNum");
    levelNum.innerText = `LEVEL ${index + 1}`;
    levelNum.style.backgroundColor = color;
    levelNum.style.color = txtColor;
    levelCard.appendChild(levelNum);

    if (levelInfo["LevelImg"] != null) {
        const levelImg = document.createElement("img");
        levelImg.classList.add("LevelImg");
        const imgSrc = levelInfo["LevelImg"];
        levelImg.src = imgSrc;
        levelImg.alt = imgSrc;
        levelCard.appendChild(levelImg);
    }

    const levelName = document.createElement("h1");
    levelName.innerText = levelInfo["LevelName"];
    levelCard.appendChild(levelName);

    if (levelInfo["LevelDescription"] != null) {
        const levelDescription = document.createElement("p");
        levelDescription.innerText = levelInfo["LevelDescription"];
        levelCard.appendChild(levelDescription);
    }

    const levelPlayBtn = document.createElement("button");
    levelPlayBtn.classList.add("LevelPlayBtn");
    levelPlayBtn.innerText = "PLAY";
    levelPlayBtn.style.backgroundColor = color;
    levelPlayBtn.style.color = txtColor;
    levelPlayBtn.onclick = (e) => {
        window.location = levelInfo["LevelURL"];
    }
    levelCard.appendChild(levelPlayBtn);

    levelSelectionContainerDiv.appendChild(levelCard);

    return levelCard;
}

const levelInfo_promise = fetch("../DummyData/LevelInfo.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Unable to get level info.");
        }
        return response.json();
    });

levelInfo_promise.then(levelInfo => {
    console.log(levelInfo);
    levelInfo.forEach((levelInfo, index) => {
        CreateLevelCard(levelInfo, index);
    });
});