
# tts.py
def text_to_speech(text, filename="output.mp3"):
    """
    Basit örnek: verilen metni kaydeder.
    Gerçek uygulamada gTTS veya pyttsx3 kullanılabilir.
    """
    with open(filename, "w", encoding="utf-8") as f:
        f.write(text)
    return filename
