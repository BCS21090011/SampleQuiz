function PlayBtn_OnClick(e) {
    window.location = "./LevelSelection.html";
}

function SettingsBtn_OnClick(e) {
    alert("You just clicked settings, unfortunately it's still under development.");
}

function HelpBtn_OnClick(e) {
    window.location = "about:blank?page=Help";
}

function ExitBtn_OnClick(e) {
    const confirmClose = confirm("Confirm to exit?");

    if (confirmClose == true) {
        window.close();
    }
}