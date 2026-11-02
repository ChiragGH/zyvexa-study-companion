# Zyvexa

An AI-assisted study companion with concept building, practice, revision, session history, and progress views.

## Run locally

From `server/`, run `npm ci` and `npm start`. Set your own `DEEPSEEK_API_KEY` and `GROQ_API_KEY` in the server environment for the features that use them, then open the local address served by the app.

The frontend keeps study history in browser storage. The AI endpoints require external provider keys and send study prompts to those providers when used. No key, private study history, or source Git history is included in this release.
