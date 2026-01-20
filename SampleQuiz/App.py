from flask import Flask, send_from_directory, render_template
import os
import json
from BE.API import api_blueprint
from BE.Auth import DecodeAuthHeader
from dotenv import load_dotenv

load_dotenv()

app: Flask = Flask(__name__)
app.register_blueprint(api_blueprint, url_prefix="/API")

feDir: str = os.path.join(app.root_path, "FE")
fePageDir: str = os.path.join(feDir, "Pages")
feUtilsDir: str = os.path.join(feDir, "Utils")
feAssetsDir: str = os.path.join(feDir, "Assets")
feDummyDataDir: str = os.path.join(feDir, "DummyData")

beDir: str = os.path.join(app.root_path, "BE")

app.template_folder = fePageDir

# Serve the frontend:

def GetUserCred() -> dict:
    result: dict = {
        "userID_flask": None,
        "userRole_flask": None,
        "isAuthed_flask": False,
        "authError_flask": None
    }

    payload, error = DecodeAuthHeader()

    result["authError_flask"] = error
    
    if error or payload is None:
        return result
    
    result["userID_flask"] = payload.get("user_id", None)
    result["userRole_flask"] = payload.get("user_role", None)
    result["isAuthed_flask"] = True
    
    return result

@app.route("/")
def Root():
    return render_template("MainPage.html.jinja", **GetUserCred())

@app.route("/<string:page>")
def ServePage(page):
    # Handles user cred here and pass it to the template
    return render_template(page + ".html.jinja", **GetUserCred())

@app.route("/Utils/<path:path>")
def ServeUtils(path):
    return send_from_directory(feUtilsDir, path)

@app.route("/Assets/<path:path>")
def ServeAssets(path):
    return send_from_directory(feAssetsDir, path)

@app.route("/DummyData/<path:path>")
def ServeDummyData(path):
    return send_from_directory(feDummyDataDir, path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
