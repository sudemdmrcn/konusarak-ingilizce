from flask import Flask, request, jsonify
from whisper_local import transcribe_audio
from grammar_check import correct_grammar
from tts import text_to_speech
import os

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return "Konuşarak İngilizce API aktif!"

@app.route("/upload", methods=["POST"])
def upload_audio():
    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)

    original_text = transcribe_audio(path)
    corrected_text = correct_grammar(original_text)
    audio_base64 = text_to_speech(corrected_text)

    return jsonify({
        "original": original_text,
        "corrected": corrected_text,
        "corrected_audio": audio_base64
    })

if __name__ == "__main__":

    app.run(debug=True)