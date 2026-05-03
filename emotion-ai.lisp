;;;; Emotion Detection AI System
;;;; Classic AI implementation in Common Lisp:
;;;; knowledge base, forward chaining, backward chaining, and perceptron scoring.

(defparameter *emotions* '(:joy :sadness :anger :fear :surprise :neutral))

(defparameter *knowledge-base*
  '((:joy
     :words ("happy" "excited" "great" "love" "awesome" "wonderful" "proud" "smile" "success" "enjoy")
     :patterns ("!" "thank" "celebrate")
     :weights ((:positive-words . 2.4) (:exclamation . 0.7) (:gratitude . 1.2) (:negative-words . -1.2)))
    (:sadness
     :words ("sad" "upset" "cry" "lonely" "hurt" "lost" "tired" "depressed" "miss" "broken")
     :patterns ("not okay" "feel low" "gave up")
     :weights ((:sadness-words . 2.5) (:negative-words . 0.9) (:slow-tone . 0.7) (:positive-words . -1.1)))
    (:anger
     :words ("angry" "mad" "hate" "furious" "annoyed" "irritated" "rage" "unfair" "fight" "stupid")
     :patterns ("never again" "shut" "fed up")
     :weights ((:anger-words . 2.7) (:exclamation . 0.6) (:all-caps . 0.8) (:positive-words . -1.3)))
    (:fear
     :words ("scared" "afraid" "fear" "nervous" "worried" "anxious" "panic" "danger" "risk" "terrified")
     :patterns ("what if" "cannot handle" "too risky")
     :weights ((:fear-words . 2.7) (:question . 0.5) (:uncertainty . 0.8) (:positive-words . -0.8)))
    (:surprise
     :words ("wow" "amazing" "suddenly" "unexpected" "shocked" "surprised" "unbelievable" "really" "what")
     :patterns ("no way" "out of nowhere" "did not expect")
     :weights ((:surprise-words . 2.4) (:exclamation . 0.8) (:question . 0.5) (:positive-words . 0.3)))
    (:neutral
     :words ("okay" "fine" "normal" "regular" "average" "plain" "noted" "today" "meeting" "work")
     :patterns ("the report" "it is" "there is")
     :weights ((:neutral-words . 1.7) (:positive-words . -0.4) (:negative-words . -0.4) (:exclamation . -0.5)))))

(defparameter *positive-words*
  '("happy" "excited" "great" "love" "awesome" "wonderful" "proud" "success" "enjoy" "amazing"))

(defparameter *negative-words*
  '("sad" "upset" "cry" "lonely" "hurt" "lost" "angry" "hate" "scared" "worried" "panic"))

(defun lowercase (text)
  (string-downcase text))

(defun contains-p (needle haystack)
  (not (null (search (lowercase needle) (lowercase haystack) :test #'char=))))

(defun word-char-p (char)
  (or (alpha-char-p char) (char= char #\')))

(defun tokenize (text)
  (let ((tokens '())
        (current ""))
    (loop for char across (lowercase text) do
      (if (word-char-p char)
          (setf current (concatenate 'string current (string char)))
          (when (> (length current) 0)
            (push current tokens)
            (setf current ""))))
    (when (> (length current) 0)
      (push current tokens))
    (nreverse tokens)))

(defun count-token-matches (tokens words)
  (count-if (lambda (token) (member token words :test #'string=)) tokens))

(defun count-char (char text)
  (count char text :test #'char=))

(defun uppercase-word-p (word)
  (and (>= (length word) 3)
       (every (lambda (char) (or (not (alpha-char-p char)) (upper-case-p char))) word)
       (some #'upper-case-p word)))

(defun emotion-data (emotion property)
  (getf (cdr (assoc emotion *knowledge-base*)) property))

(defun feature (features key)
  (or (cdr (assoc key features)) 0))

(defun extract-features (text)
  (let* ((tokens (tokenize text))
         (raw-words (loop for word in (split-simple text) collect word)))
    `((:tokens . ,tokens)
      (:positive-words . ,(count-token-matches tokens *positive-words*))
      (:negative-words . ,(count-token-matches tokens *negative-words*))
      (:joy-words . ,(count-token-matches tokens (emotion-data :joy :words)))
      (:sadness-words . ,(count-token-matches tokens (emotion-data :sadness :words)))
      (:anger-words . ,(count-token-matches tokens (emotion-data :anger :words)))
      (:fear-words . ,(count-token-matches tokens (emotion-data :fear :words)))
      (:surprise-words . ,(count-token-matches tokens (emotion-data :surprise :words)))
      (:neutral-words . ,(count-token-matches tokens (emotion-data :neutral :words)))
      (:exclamation . ,(count-char #\! text))
      (:question . ,(count-char #\? text))
      (:gratitude . ,(if (contains-p "thank" text) 1 0))
      (:uncertainty . ,(if (or (contains-p "maybe" text) (contains-p "what if" text) (contains-p "not sure" text)) 1 0))
      (:slow-tone . ,(if (or (contains-p "tired" text) (contains-p "low" text) (contains-p "miss" text)) 1 0))
      (:all-caps . ,(count-if #'uppercase-word-p raw-words)))))

(defun split-simple (text)
  (let ((parts '())
        (current ""))
    (loop for char across text do
      (if (find char " ,.;:!?()[]{}" :test #'char=)
          (when (> (length current) 0)
            (push current parts)
            (setf current ""))
          (setf current (concatenate 'string current (string char)))))
    (when (> (length current) 0)
      (push current parts))
    (nreverse parts)))

(defun run-forward-chaining (text features)
  (let ((facts '())
        (tokens (cdr (assoc :tokens features))))
    (dolist (emotion *emotions*)
      (let* ((words (emotion-data emotion :words))
             (patterns (emotion-data emotion :patterns))
             (matches (count-token-matches tokens words)))
        (when (> matches 0)
          (push (format nil "~a rule fired: ~d emotion keyword~:p found." emotion matches) facts))
        (dolist (pattern patterns)
          (when (contains-p pattern text)
            (push (format nil "~a pattern rule fired: \"~a\" was detected." emotion pattern) facts)))))
    (when (> (feature features :exclamation) 0)
      (push "Intensity rule fired: exclamation marks increase emotional strength." facts))
    (when (> (feature features :question) 0)
      (push "Question rule fired: questions can support fear or surprise." facts))
    (when (> (feature features :all-caps) 0)
      (push "Emphasis rule fired: uppercase words add intensity." facts))
    (or (nreverse facts)
        '("No strong symbolic fact fired, so the system keeps the neutral hypothesis active."))))

(defun perceptron-scores (features)
  (let ((raw '()))
    (dolist (emotion *emotions*)
      (let ((score (if (eq emotion :neutral) 0.6 0.2)))
        (dolist (weight (emotion-data emotion :weights))
          (incf score (* (feature features (car weight)) (cdr weight))))
        (push (cons emotion (max 0 score)) raw)))
    (let ((total (reduce #'+ raw :key #'cdr :initial-value 0)))
      (mapcar (lambda (pair)
                (cons (car pair) (/ (cdr pair) (if (> total 0) total 1.0))))
              (nreverse raw)))))

(defun choose-emotion (scores)
  (car (sort (copy-list scores) #'> :key #'cdr)))

(defun prove-emotion (emotion text features score)
  (let* ((tokens (cdr (assoc :tokens features)))
         (words (emotion-data emotion :words))
         (patterns (emotion-data emotion :patterns))
         (keyword-matches (remove-if-not (lambda (token) (member token words :test #'string=)) tokens))
         (pattern-matches (remove-if-not (lambda (pattern) (contains-p pattern text)) patterns)))
    (append
     (list (format nil "Goal: prove the emotion is ~a." emotion))
     (if keyword-matches
         (list (format nil "Check knowledge base: matched words ~{~a~^, ~}." keyword-matches))
         (list (format nil "Check knowledge base: no direct ~a keyword found." emotion)))
     (when pattern-matches
       (list (format nil "Check rule patterns: matched ~{~a~^, ~}." pattern-matches)))
     (list (format nil "Check perceptron result: ~d% score for ~a." (round (* score 100)) emotion)
           (if (or (>= score 0.34) keyword-matches pattern-matches)
               "Conclusion: goal is supported."
               "Conclusion: weak support, neutral result preferred.")))))

(defun analyze-emotion (text)
  (let* ((features (extract-features text))
         (facts (run-forward-chaining text features))
         (scores (perceptron-scores features))
         (winner (choose-emotion scores))
         (proof (prove-emotion (car winner) text features (cdr winner))))
    (list :emotion (car winner)
          :confidence (cdr winner)
          :scores scores
          :forward-chaining facts
          :backward-chaining proof)))

(defun print-analysis (text)
  (let ((analysis (analyze-emotion text)))
    (format t "~%Detected Emotion: ~a~%" (getf analysis :emotion))
    (format t "Confidence: ~d%~%" (round (* 100 (getf analysis :confidence))))
    (format t "~%Perceptron Scores:~%")
    (dolist (score (getf analysis :scores))
      (format t "  ~a: ~d%~%" (car score) (round (* 100 (cdr score)))))
    (format t "~%Forward Chaining:~%")
    (dolist (fact (getf analysis :forward-chaining))
      (format t "  - ~a~%" fact))
    (format t "~%Backward Chaining:~%")
    (dolist (proof (getf analysis :backward-chaining))
      (format t "  - ~a~%" proof))))

#+sbcl
(when (> (length sb-ext:*posix-argv*) 1)
  (print-analysis (second sb-ext:*posix-argv*)))
