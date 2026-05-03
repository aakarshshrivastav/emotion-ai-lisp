# Emotion Detection AI System

This is a Lisp-based AI project for detecting emotions from typed text or speech input. It does not use external machine learning libraries. The core AI behavior is implemented with classic AI ideas in `emotion-ai.lisp`, and the browser frontend mirrors the same rules for live demo use.

## Features

- Text emotion detection
- Speech-to-text input using the browser Speech Recognition API
- Knowledge base of emotion words and patterns
- Forward chaining to infer facts from the input
- Backward chaining to prove the selected emotion hypothesis
- Simple perceptron-style weighted scoring
- Explainable output showing how the final emotion was selected
- Common Lisp source file for project submission

## AI Concepts Used

- Knowledge Base: emotion keywords, phrase patterns, and weights are stored in `emotion-ai.lisp`
- Inference Engine: Lisp functions apply rules and scores to the input
- Forward Chaining: the system starts from input facts and fires matching rules
- Backward Chaining: the system starts from the predicted emotion and checks evidence for it
- Perceptron Scoring: each emotion has weights for extracted features such as positive words, fear words, exclamation marks, and questions

## Files

- `emotion-ai.lisp`: Common Lisp AI engine
- `index.html`: frontend structure
- `styles.css`: responsive interface design
- `app.js`: browser demo mirror of the Lisp logic and speech interaction

## Run

### Browser Demo

Open `index.html` directly in a browser, or run a local server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

### Lisp Engine

With SBCL installed, run:

```bash
sbcl --script emotion-ai.lisp "I am excited but nervous about the presentation!"
```
