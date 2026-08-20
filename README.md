# SEBI Grade A IT Officer Mock Test Engine

A browser-based mock test platform for **SEBI Grade A IT Officer** preparation.  
It lets users upload JSON question papers, attempt them in a timed exam-like interface, and review results with scoring, negative marking, explanations, streak tracking, and performance stats.

This project is designed for aspirants who want to practice:

- SEBI Grade A IT Phase 1 Paper 1
- SEBI Grade A IT Phase 1 Paper 2
- SEBI Grade A IT Phase 2 Paper 2
- Topic-wise IT practice sets
- Coding dry-run questions
- SQL/DBMS/OS/Networks/DSA/Cybersecurity MCQs

---

## Features

- Upload custom `.json` question papers
- Timed mock test mode
- Auto-submit when timer ends
- Negative marking support
- Question palette
- Mark for review
- Clear response
- Previous / Next navigation
- Score calculation
- Accuracy calculation
- Correct, wrong, and unattempted count
- Detailed post-test review
- Explanations after submission
- Daily streak counter using browser `localStorage`
- Modern exam-style UI
- Circular score ring
- Time-used and pace analysis
- Works fully offline after loading the HTML file

---

## Project Structure

A simple version of the project can look like this:

```text
sebi-mock-test/
│
├── sebi-mock.html
├── README.md
│
├── question-packs/
│   ├── SEBI_P2_IT_SET_01.json
│   ├── SEBI_P2_IT_SET_02.json
│   ├── SEBI_P1_IT_SET_01.json
│   └── sample.json
│
└── docs/
    └── JSON_FORMAT.md



JSON Question File Format
The app accepts mock tests in JSON format.
Every question paper must have this structure:

{
  "meta": {
    "exam_name": "SEBI Grade A IT Officer - Practice Set",
    "paper": "Phase 2 Paper 2 - Information Technology",
    "set_id": "SEBI_P2_IT_SET_01",
    "generated_on": "2026-08-15",
    "duration_minutes": 90,
    "negative_marking": 0.25,
    "official_pace_seconds": 216,
    "full_paper_note": "Full paper: 100 marks · 180 min"
  },
  "questions": [
    {
      "id": "Q1",
      "type": "mcq",
      "subject": "Python",
      "topic": "Loop Dry Run",
      "difficulty": "medium",
      "marks": 2,
      "question": "What is the output of the following code?",
      "code": "x = 0\nfor i in range(3):\n    x += i\nprint(x)",
      "code_language": "python",
      "options": [
        {
          "id": "A",
          "text": "0"
        },
        {
          "id": "B",
          "text": "3"
        },
        {
          "id": "C",
          "text": "6"
        },
        {
          "id": "D",
          "text": "Error"
        }
      ],
      "correct_option_id": "B",
      "explanation": "The loop adds 0 + 1 + 2, so x becomes 3."
    }
  ]
}



