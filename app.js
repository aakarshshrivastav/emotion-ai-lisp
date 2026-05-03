const emotionInput = document.querySelector("#emotionInput");
const analyzeButton = document.querySelector("#analyzeButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const micButton = document.querySelector("#micButton");
const aiStatus = document.querySelector("#aiStatus");
const emotionDisplay = document.querySelector("#emotionDisplay");
const confidenceText = document.querySelector("#confidenceText");
const confidenceBar = document.querySelector("#confidenceBar");
const resultNote = document.querySelector("#resultNote");
const scoreList = document.querySelector("#scoreList");
const forwardFacts = document.querySelector("#forwardFacts");
const backwardProof = document.querySelector("#backwardProof");

const emotions = ["Joy", "Sadness", "Anger", "Fear", "Surprise", "Neutral"];

const knowledgeBase = {
  Joy: {
    words: ["happy", "excited", "great", "love", "awesome", "wonderful", "proud", "smile", "success", "enjoy"],
    patterns: ["!", "thank", "celebrate"],
    weights: { positiveWords: 2.4, exclamation: 0.7, gratitude: 1.2, negativeWords: -1.2 }
  },
  Sadness: {
    words: ["sad", "upset", "cry", "lonely", "hurt", "lost", "tired", "depressed", "miss", "broken"],
    patterns: ["not okay", "feel low", "gave up"],
    weights: { sadnessWords: 2.5, negativeWords: 0.9, slowTone: 0.7, positiveWords: -1.1 }
  },
  Anger: {
    words: ["angry", "mad", "hate", "furious", "annoyed", "irritated", "rage", "unfair", "fight", "stupid"],
    patterns: ["never again", "shut", "fed up"],
    weights: { angerWords: 2.7, exclamation: 0.6, allCaps: 0.8, positiveWords: -1.3 }
  },
  Fear: {
    words: ["scared", "afraid", "fear", "nervous", "worried", "anxious", "panic", "danger", "risk", "terrified"],
    patterns: ["what if", "cannot handle", "too risky"],
    weights: { fearWords: 2.7, question: 0.5, uncertainty: 0.8, positiveWords: -0.8 }
  },
  Surprise: {
    words: ["wow", "amazing", "suddenly", "unexpected", "shocked", "surprised", "unbelievable", "really", "what"],
    patterns: ["no way", "out of nowhere", "did not expect"],
    weights: { surpriseWords: 2.4, exclamation: 0.8, question: 0.5, positiveWords: 0.3 }
  },
  Neutral: {
    words: ["okay", "fine", "normal", "regular", "average", "plain", "noted", "today", "meeting", "work"],
    patterns: ["the report", "it is", "there is"],
    weights: { neutralWords: 1.7, positiveWords: -0.4, negativeWords: -0.4, exclamation: -0.5 }
  }
};

const positiveWords = new Set(["happy", "excited", "great", "love", "awesome", "wonderful", "proud", "success", "enjoy", "amazing"]);
const negativeWords = new Set(["sad", "upset", "cry", "lonely", "hurt", "lost", "angry", "hate", "scared", "worried", "panic"]);

function tokenize(text) {
  return text.toLowerCase().match(/[a-z']+/g) || [];
}

function countMatches(tokens, words) {
  const wordSet = new Set(words);
  return tokens.filter((token) => wordSet.has(token)).length;
}

function extractFeatures(text) {
  const tokens = tokenize(text);
  const lowerText = text.toLowerCase();
  const allCapsWords = text.match(/\b[A-Z]{3,}\b/g) || [];

  return {
    tokens,
    positiveWords: tokens.filter((token) => positiveWords.has(token)).length,
    negativeWords: tokens.filter((token) => negativeWords.has(token)).length,
    joyWords: countMatches(tokens, knowledgeBase.Joy.words),
    sadnessWords: countMatches(tokens, knowledgeBase.Sadness.words),
    angerWords: countMatches(tokens, knowledgeBase.Anger.words),
    fearWords: countMatches(tokens, knowledgeBase.Fear.words),
    surpriseWords: countMatches(tokens, knowledgeBase.Surprise.words),
    neutralWords: countMatches(tokens, knowledgeBase.Neutral.words),
    exclamation: (text.match(/!/g) || []).length,
    question: (text.match(/\?/g) || []).length,
    gratitude: lowerText.includes("thank") ? 1 : 0,
    uncertainty: lowerText.includes("maybe") || lowerText.includes("what if") || lowerText.includes("not sure") ? 1 : 0,
    slowTone: lowerText.includes("tired") || lowerText.includes("low") || lowerText.includes("miss") ? 1 : 0,
    allCaps: allCapsWords.length
  };
}

function runForwardChaining(text, features) {
  const facts = [];
  const lowerText = text.toLowerCase();

  emotions.forEach((emotion) => {
    const matches = countMatches(features.tokens, knowledgeBase[emotion].words);
    const patternMatches = knowledgeBase[emotion].patterns.filter((pattern) => lowerText.includes(pattern));

    if (matches > 0) {
      facts.push(`${emotion} rule fired: ${matches} emotion keyword${matches > 1 ? "s" : ""} found.`);
    }

    patternMatches.forEach((pattern) => {
      facts.push(`${emotion} pattern rule fired: "${pattern}" was detected.`);
    });
  });

  if (features.exclamation > 0) facts.push("Intensity rule fired: exclamation marks increase emotional strength.");
  if (features.question > 0) facts.push("Question rule fired: questions can support fear or surprise.");
  if (features.allCaps > 0) facts.push("Emphasis rule fired: uppercase words add intensity.");

  return facts.length ? facts : ["No strong symbolic fact fired, so the system keeps the neutral hypothesis active."];
}

function perceptronScores(features) {
  const rawScores = {};

  emotions.forEach((emotion) => {
    const weights = knowledgeBase[emotion].weights;
    let score = emotion === "Neutral" ? 0.6 : 0.2;

    Object.entries(weights).forEach(([feature, weight]) => {
      score += (features[feature] || 0) * weight;
    });

    rawScores[emotion] = Math.max(0, score);
  });

  const total = Object.values(rawScores).reduce((sum, score) => sum + score, 0) || 1;
  return Object.fromEntries(Object.entries(rawScores).map(([emotion, score]) => [emotion, score / total]));
}

function proveEmotion(emotion, text, features, score) {
  const rules = knowledgeBase[emotion];
  const lowerText = text.toLowerCase();
  const keywordMatches = features.tokens.filter((token) => rules.words.includes(token));
  const patternMatches = rules.patterns.filter((pattern) => lowerText.includes(pattern));
  const proof = [`Goal: prove the emotion is ${emotion}.`];

  if (keywordMatches.length) {
    proof.push(`Check knowledge base: matched ${emotion.toLowerCase()} words ${keywordMatches.join(", ")}.`);
  } else {
    proof.push(`Check knowledge base: no direct ${emotion.toLowerCase()} keyword found.`);
  }

  if (patternMatches.length) {
    proof.push(`Check rule patterns: matched ${patternMatches.join(", ")}.`);
  }

  proof.push(`Check perceptron result: ${Math.round(score * 100)}% score for ${emotion}.`);
  proof.push(score >= 0.34 || keywordMatches.length || patternMatches.length ? "Conclusion: goal is supported." : "Conclusion: weak support, neutral result preferred.");

  return proof;
}

function chooseEmotion(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
}

function renderScores(scores) {
  scoreList.innerHTML = "";
  Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([emotion, score]) => {
      const row = document.createElement("div");
      row.className = "score-row";
      row.innerHTML = `
        <strong>${emotion}</strong>
        <div class="score-track"><div class="score-fill" style="width: ${Math.round(score * 100)}%"></div></div>
        <span>${Math.round(score * 100)}%</span>
      `;
      scoreList.appendChild(row);
    });
}

function renderList(node, items) {
  node.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    node.appendChild(li);
  });
}

function analyzeEmotion() {
  const text = emotionInput.value.trim();

  if (!text) {
    aiStatus.textContent = "Waiting for input";
    emotionDisplay.textContent = "Neutral";
    confidenceText.textContent = "Confidence: 0%";
    confidenceBar.style.width = "0%";
    resultNote.textContent = "Type or speak a sentence before running the AI engine.";
    scoreList.innerHTML = "";
    renderList(forwardFacts, ["Input memory is empty."]);
    renderList(backwardProof, ["No goal can be proven without input facts."]);
    return;
  }

  const features = extractFeatures(text);
  const facts = runForwardChaining(text, features);
  const scores = perceptronScores(features);
  const [emotion, confidence] = chooseEmotion(scores);
  const proof = proveEmotion(emotion, text, features, confidence);

  aiStatus.textContent = "Analysis complete";
  emotionDisplay.textContent = emotion;
  confidenceText.textContent = `Confidence: ${Math.round(confidence * 100)}%`;
  confidenceBar.style.width = `${Math.round(confidence * 100)}%`;
  resultNote.textContent = "The result combines symbolic inference with a simple perceptron-style weighted scorer.";

  renderScores(scores);
  renderList(forwardFacts, facts);
  renderList(backwardProof, proof);
}

function startSpeechInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    aiStatus.textContent = "Speech not supported";
    resultNote.textContent = "Your browser does not support speech recognition. You can still type text.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.addEventListener("start", () => {
    aiStatus.textContent = "Listening...";
  });

  recognition.addEventListener("result", (event) => {
    emotionInput.value = event.results[0][0].transcript;
    analyzeEmotion();
  });

  recognition.addEventListener("end", () => {
    if (aiStatus.textContent === "Listening...") aiStatus.textContent = "AI ready";
  });

  recognition.start();
}

analyzeButton.addEventListener("click", analyzeEmotion);
sampleButton.addEventListener("click", () => {
  emotionInput.value = "I am really excited about our AI project, but I am also nervous about presenting it!";
  analyzeEmotion();
});
clearButton.addEventListener("click", () => {
  emotionInput.value = "";
  analyzeEmotion();
});
micButton.addEventListener("click", startSpeechInput);

renderScores(Object.fromEntries(emotions.map((emotion) => [emotion, emotion === "Neutral" ? 1 : 0])));
renderList(forwardFacts, ["Ready to infer facts from user input."]);
renderList(backwardProof, ["Ready to prove the best emotion hypothesis."]);
