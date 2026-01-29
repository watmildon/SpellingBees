(function () {
    "use strict";

    // --- DOM refs ---
    const emojiDisplay = document.getElementById("emoji-display");
    const wordArea = document.getElementById("word-area");
    const guessInput = document.getElementById("guess-input");
    const submitBtn = document.getElementById("submit-btn");
    const feedback = document.getElementById("feedback");
    const congrats = document.getElementById("congrats");
    const congratsText = document.getElementById("congrats-text");
    const nextBtn = document.getElementById("next-btn");
    const scoreEl = document.getElementById("score");
    const highScoreEl = document.getElementById("high-score");

    // --- Game state ---
    let currentWord = "";
    let revealedLetters = []; // boolean per letter position
    let wordIndex = 0;
    let shuffledList = [];
    let attempts = 0;
    let score = 0;
    let highScore = parseInt(localStorage.getItem("spellingBees_highScore")) || 0;

    // --- Shuffle helper (Fisher-Yates) ---
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // --- Build the letter slots with bee overlays ---
    function buildWordArea(word) {
        wordArea.innerHTML = "";
        for (let i = 0; i < word.length; i++) {
            const slot = document.createElement("div");
            slot.className = "letter-slot";

            const letterEl = document.createElement("span");
            letterEl.className = "letter-char";
            letterEl.textContent = word[i];

            const beeEl = document.createElement("div");
            beeEl.className = "bee";

            slot.appendChild(letterEl);
            slot.appendChild(beeEl);
            wordArea.appendChild(slot);
        }
    }

    // --- Reveal letters by flying bees away ---
    // Returns the number of newly revealed letters this turn.
    function revealMatching(guess) {
        let newReveals = 0;

        // Find the longest prefix of the answer that matches the guess,
        // considering already-revealed positions.
        // Strategy: walk through positions left-to-right. For each position
        // that is not yet revealed, check if the guess (consumed in order)
        // matches.
        //
        // We match contiguously from the start: reveal letters from the
        // beginning of the word as long as the guess characters match.

        const slots = wordArea.querySelectorAll(".letter-slot");
        const guessLower = guess.toLowerCase();
        const wordLower = currentWord.toLowerCase();

        // Determine how many letters from the start are correctly matched.
        // We compare character by character. If a position is already revealed
        // it still needs to match (the guess should include it).
        let matchCount = 0;
        const limit = Math.min(guessLower.length, wordLower.length);
        for (let i = 0; i < limit; i++) {
            if (guessLower[i] === wordLower[i]) {
                matchCount++;
            } else {
                break;
            }
        }

        // Reveal up to matchCount
        for (let i = 0; i < matchCount; i++) {
            if (!revealedLetters[i]) {
                revealedLetters[i] = true;
                newReveals++;

                const slot = slots[i];
                const bee = slot.querySelector(".bee");

                // Randomize fly direction
                const flyX = (Math.random() - 0.5) * 200;
                const flyY = -(100 + Math.random() * 200);
                const flyRot = (Math.random() - 0.5) * 120;
                bee.style.setProperty("--fly-x", flyX + "px");
                bee.style.setProperty("--fly-y", flyY + "px");
                bee.style.setProperty("--fly-rot", flyRot + "deg");

                // Stagger slightly
                bee.style.animationDelay = (i * 0.07) + "s";
                bee.classList.add("fly-away");

                // After animation, mark slot revealed
                slot.classList.add("revealed");
            }
        }

        return newReveals;
    }

    function allRevealed() {
        return revealedLetters.every(Boolean);
    }

    function updateScoreDisplay() {
        scoreEl.textContent = score;
        highScoreEl.textContent = highScore;
    }

    // --- Load a round ---
    function loadRound() {
        if (wordIndex >= shuffledList.length) {
            // Reshuffle and start over
            shuffledList = shuffle(WORD_LIST);
            wordIndex = 0;
        }

        const [emoji, word] = shuffledList[wordIndex];
        currentWord = word;
        revealedLetters = new Array(word.length).fill(false);
        attempts = 0;

        emojiDisplay.textContent = emoji;
        buildWordArea(word);
        feedback.textContent = "";
        feedback.className = "feedback";
        guessInput.value = "";
        guessInput.focus();

    }

    // --- Submit guess ---
    function handleSubmit() {
        const guess = guessInput.value.trim();
        if (!guess) return;

        attempts++;
        const newReveals = revealMatching(guess);

        if (allRevealed()) {
            // Full success — increment streak
            score++;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("spellingBees_highScore", highScore);
            }
            updateScoreDisplay();

            feedback.textContent = "";
            feedback.className = "feedback success";
            guessInput.value = "";
            guessInput.disabled = true;
            submitBtn.disabled = true;

            // Show congrats after bee animations finish
            const delay = currentWord.length * 70 + 800;
            setTimeout(() => {
                showCongrats();
            }, delay);
        } else if (newReveals > 0) {
            // Partial match
            const remaining = revealedLetters.filter((r) => !r).length;
            feedback.textContent = `Nice! ${remaining} letter${remaining !== 1 ? "s" : ""} left. Try again!`;
            feedback.className = "feedback try-again";
            guessInput.value = "";
            guessInput.focus();
        } else {
            // No new reveals
            feedback.textContent = "Not quite — try again!";
            feedback.className = "feedback try-again";
            guessInput.value = "";
            guessInput.focus();
        }
    }

    // --- Congrats ---
    function showCongrats() {
        const messages = [
            "Great spelling! 🌟",
            "You did it! 🎉",
            "Wonderful! ⭐",
            "Amazing work! 🏆",
            "Bee-utiful! 🐝",
            "Super speller! 💪",
        ];
        congratsText.textContent = messages[Math.floor(Math.random() * messages.length)];
        congrats.classList.add("visible");
        nextBtn.focus();
    }

    function hideCongrats() {
        congrats.classList.remove("visible");
    }

    function nextRound() {
        hideCongrats();
        wordIndex++;
        guessInput.disabled = false;
        submitBtn.disabled = false;
        loadRound();
    }

    // --- Event listeners ---
    submitBtn.addEventListener("click", handleSubmit);

    guessInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    });

    nextBtn.addEventListener("click", nextRound);

    // --- Init ---
    updateScoreDisplay();
    shuffledList = shuffle(WORD_LIST);
    loadRound();
})();
