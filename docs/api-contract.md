# API Contract - AI Speaking Tutor

## POST /api/grammar/correct
Request JSON:
{
  "text": "string"
}
Response JSON:
{
  "original": "string",
  "corrected": "string",
  "edits": [{"from":"...","to":"...","type":"grammar|spelling|style"}],
  "explanation": "string"
}

## WebSocket /api/stt/{session_id}
- Client: gönderir audio chunk (binary)
- Server: gönderir partial transcript event ve final transcript even
