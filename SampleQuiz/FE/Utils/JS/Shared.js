function HideElement (elem) {
    elem.classList.add("Hidden");
}

function UnHideElement (elem) {
    elem.classList.remove("Hidden");
}

function DownloadJSON (jsonData, filename) {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
