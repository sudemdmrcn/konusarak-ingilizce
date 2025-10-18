import whisper

# Modeli yükle (küçük boyutlu model örnek)
model = whisper.load_model("base")

def transcribe_audio(audio_path):
    """
    Verilen ses dosyasını yazıya çevirir.
    
    audio_path: Ses dosyasının yolu (örn. "audio.mp3")
    return: Çıktı metin (string)
    """
    result = model.transcribe(audio_path)
    return result["text"]
