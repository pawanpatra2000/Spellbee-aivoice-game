# Backend Engineering Assignment

## Spell Bee Voice Bot using Pipecat

### Objective
Build a voice-based Spell Bee bot using the Pipecat framework. The bot should conduct a spell bee game with a user over a voice call — it speaks a word, the user spells it out, and the bot evaluates the response.

### What You Need to Build
- **Voice Bot Backend:** A Pipecat-based pipeline that picks a word, speaks it to the user, listens to the user spell it, and validates the spelling. Handle turn-taking and interruptions gracefully.
- **Frontend:** A minimal web UI to start/join the spell bee session and display game state (current score, word count, etc.). Can be as simple as a single page.

### Technical Requirements
- Use Pipecat as the core framework for the voice pipeline.
- Implement proper turn-taking — the bot should wait for the user to finish spelling before evaluating.
- Handle interruptions — if the user interrupts mid-speech, the bot should handle it cleanly.
- Use custom frame processors where needed (e.g., for spelling validation logic).
- The word list can be hardcoded.
- Develop understanding of how pipecat works, how turn taking happens, and how interruptions are handled.

### Deliverables

#### 1. Code Repository
- Share a GitHub/GitLab repo (or zip) with complete, runnable code.
- Include a README with setup instructions.

#### 2. Video Walkthrough (10–15 minutes)
Record a screen-share video covering:
- **Demo:** Show the bot working end-to-end. Start a session, play a round, show it handling correct/incorrect spellings.
- **Code Walkthrough:** Walk through the key parts of your code — pipeline setup, frame processors, frontend-backend communication.

Kindly send the above deliverables to the emails jai@cure.link, manasvi@cure.link and cc hr@cure.link , the subject of the mail should be “Spell Bee Assignment Submission - {YOUR_NAME}”

### Notes
- You can use Deepgram for both speech-to-text and text-to-speech. They give a decent amount of free credits.
- For LLM providers you can use Groq or Gemini; both have generous free tiers.