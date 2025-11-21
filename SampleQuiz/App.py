from flask import Flask, send_from_directory
import os
from BE.API import api_blueprint
from BE.Auth import required_page_auth
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

# Serve the frontend:

@app.route("/")
def Root():
    return send_from_directory(fePageDir, "MainPage.html")

@app.route("/<string:page>")
def ServePage(page):
    return send_from_directory(fePageDir, page)

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
    app.run(port=5000, debug=True)
