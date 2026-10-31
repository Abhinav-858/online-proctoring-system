/**
 * Examination Question Bank & Presets
 * Contains default MCQ questions covering core domains (Computer Science, Data Science & AI, Web Technologies).
 * Proctors can customize, add, edit, remove, and toggle their desired questions for active examinations.
 */

const QUESTIONS_STORAGE_KEY = 'safeexam_question_bank';

// Preset Question Banks categorized by subject domain
export const PRESET_QUESTION_BANKS = {
  computer_science: [
    {
      id: 1,
      category: "Object-Oriented Programming",
      question: "Which Object-Oriented Programming (OOP) principle describes the ability of different classes to provide different implementations for the same interface or method signature?",
      options: [
        "Encapsulation",
        "Polymorphism",
        "Inheritance",
        "Abstraction"
      ],
      answer: 1,
      included: true
    },
    {
      id: 2,
      category: "Data Structures",
      question: "What is the worst-case and average-case time complexity of searching for an element in a balanced Binary Search Tree (such as an AVL or Red-Black Tree)?",
      options: [
        "O(1)",
        "O(log n)",
        "O(n)",
        "O(n log n)"
      ],
      answer: 1,
      included: true
    },
    {
      id: 3,
      category: "Algorithms",
      question: "Which sorting algorithm employs the divide-and-conquer paradigm and guarantees an O(n log n) time complexity in the worst-case scenario?",
      options: [
        "Quick Sort",
        "Merge Sort",
        "Bubble Sort",
        "Insertion Sort"
      ],
      answer: 1,
      included: true
    },
    {
      id: 4,
      category: "Database Systems",
      question: "In relational database management systems (RDBMS), which ACID property ensures that all operations within a transaction either execute completely or none are applied?",
      options: [
        "Atomicity",
        "Consistency",
        "Isolation",
        "Durability"
      ],
      answer: 0,
      included: true
    },
    {
      id: 5,
      category: "Computer Networks",
      question: "Which layer of the OSI model is responsible for end-to-end communication, error recovery, flow control, and port-to-port multiplexing (e.g., TCP/UDP)?",
      options: [
        "Network Layer",
        "Transport Layer",
        "Data Link Layer",
        "Session Layer"
      ],
      answer: 1,
      included: true
    },
    {
      id: 6,
      category: "Operating Systems",
      question: "Which of the following is NOT one of Coffman's four necessary conditions for a deadlock to occur in an operating system?",
      options: [
        "Mutual Exclusion",
        "Hold and Wait",
        "Preemption Allowed",
        "Circular Wait"
      ],
      answer: 2,
      included: true
    },
    {
      id: 7,
      category: "Web & HTTP",
      question: "What does the HTTP 403 status code specifically indicate?",
      options: [
        "Resource Not Found",
        "Unauthorized (Authentication is missing or invalid)",
        "Forbidden (Server understood the request but refuses to authorize it)",
        "Internal Server Error"
      ],
      answer: 2,
      included: true
    },
    {
      id: 8,
      category: "Software Design",
      question: "Which design pattern restricts the instantiation of a class to a single object and provides a global access point to that instance?",
      options: [
        "Factory Pattern",
        "Singleton Pattern",
        "Observer Pattern",
        "Adapter Pattern"
      ],
      answer: 1,
      included: true
    },
    {
      id: 9,
      category: "Computer Architecture",
      question: "In CPU microarchitecture, what is the primary benefit of instruction pipelining?",
      options: [
        "Increases overall instruction execution throughput",
        "Decreases the latency of individual instructions",
        "Reduces CPU cache miss rate",
        "Eliminates data hazards automatically"
      ],
      answer: 0,
      included: true
    },
    {
      id: 10,
      category: "Data Structures",
      question: "Which data structure is primarily utilized to implement Breadth-First Search (BFS) graph traversal?",
      options: [
        "Stack",
        "Queue",
        "Priority Queue",
        "Hash Table"
      ],
      answer: 1,
      included: true
    }
  ],
  data_science: [
    {
      id: 1,
      category: "Machine Learning",
      question: "What phenomenon occurs when a machine learning model learns training data noise and fine details rather than the underlying pattern, resulting in poor generalizability?",
      options: [
        "Underfitting",
        "Overfitting",
        "High Bias",
        "Data Leakage"
      ],
      answer: 1,
      included: true
    },
    {
      id: 2,
      category: "Optimization",
      question: "Which gradient descent optimization algorithm computes adaptive learning rates for each parameter using exponentially decaying averages of squared gradients (momentum + RMSprop)?",
      options: [
        "Stochastic Gradient Descent (SGD)",
        "Adam Optimizer",
        "Adagrad",
        "Nesterov Accelerated Gradient"
      ],
      answer: 1,
      included: true
    },
    {
      id: 3,
      category: "Model Evaluation",
      question: "When evaluating a classification model on an imbalanced medical diagnosis dataset where false negatives are critical, which metric should be prioritized?",
      options: [
        "Overall Accuracy",
        "Recall (Sensitivity)",
        "Precision",
        "Specificity"
      ],
      answer: 1,
      included: true
    },
    {
      id: 4,
      category: "Dimensionality Reduction",
      question: "Principal Component Analysis (PCA) identifies orthogonal directions that maximize what property of the projected data?",
      options: [
        "Variance",
        "Entropy",
        "Kurtosis",
        "Mean Absolute Deviation"
      ],
      answer: 0,
      included: true
    },
    {
      id: 5,
      category: "Deep Learning",
      question: "Which activation function is most susceptible to the vanishing gradient problem in deep neural network backpropagation when inputs have large positive or negative values?",
      options: [
        "ReLU (Rectified Linear Unit)",
        "Sigmoid",
        "Leaky ReLU",
        "GELU"
      ],
      answer: 1,
      included: true
    },
    {
      id: 6,
      category: "Supervised Learning",
      question: "In Random Forest and Ensemble learning, what does the technique of Bootstrap Aggregating (Bagging) primarily reduce?",
      options: [
        "Model Bias",
        "Model Variance",
        "Computational Complexity",
        "Feature Dimensionality"
      ],
      answer: 1,
      included: true
    },
    {
      id: 7,
      category: "Deep Learning",
      question: "What architectural mechanism in the Transformer model replaces traditional recurrent layers to process input tokens in parallel?",
      options: [
        "Self-Attention Mechanism",
        "Max Pooling",
        "Convolutional Stride",
        "Gated Recurrent Unit"
      ],
      answer: 0,
      included: true
    },
    {
      id: 8,
      category: "Statistics & Probability",
      question: "Which statistical theorem states that the distribution of sample means approximates a normal distribution as sample size increases, regardless of population distribution?",
      options: [
        "Bayes' Theorem",
        "Central Limit Theorem",
        "Law of Large Numbers",
        "Chebyshev's Inequality"
      ],
      answer: 1,
      included: true
    }
  ],
  web_and_cloud: [
    {
      id: 1,
      category: "Web Security",
      question: "Which security header prevents Cross-Site Scripting (XSS) and data injection attacks by restricting the origins of executable scripts and stylesheets?",
      options: [
        "Access-Control-Allow-Origin",
        "Content-Security-Policy (CSP)",
        "X-Frame-Options",
        "Strict-Transport-Security"
      ],
      answer: 1,
      included: true
    },
    {
      id: 2,
      category: "API Architecture",
      question: "Which HTTP request method is defined as idempotent according to the official RFC 7231 specification?",
      options: [
        "POST",
        "PUT",
        "CONNECT",
        "PATCH"
      ],
      answer: 1,
      included: true
    },
    {
      id: 3,
      category: "Cloud & Distributed Systems",
      question: "In distributed computing (CAP theorem), if a system guarantees consistency and partition tolerance, what must it sacrifice during a network partition?",
      options: [
        "Availability",
        "Durability",
        "Atomicity",
        "Scalability"
      ],
      answer: 0,
      included: true
    },
    {
      id: 4,
      category: "Web Architecture",
      question: "What protocol allows full-duplex, bidirectional persistent communication over a single TCP connection between a browser client and a server?",
      options: [
        "HTTP/1.1 Long Polling",
        "WebSocket",
        "Server-Sent Events (SSE)",
        "gRPC-Web"
      ],
      answer: 1,
      included: true
    }
  ]
};

// Default question set (Core CS)
export const DEFAULT_QUESTIONS = PRESET_QUESTION_BANKS.computer_science;

/**
 * Load all questions from storage (including both kept/active and excluded ones).
 * Returns array of question objects.
 */
export function loadAllQuestions() {
  try {
    const saved = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q, idx) => ({
          ...q,
          id: q.id || idx + 1,
          category: q.category || 'General CS',
          included: q.included !== undefined ? q.included : true,
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to load questions from storage, using defaults', e);
  }
  return DEFAULT_QUESTIONS.map(q => ({
    ...q,
    included: q.included !== undefined ? q.included : true,
  }));
}

/**
 * Load the active question bank for the exam.
 * Returns only the questions that proctors have decided to KEEP for the exam (included !== false).
 * If all questions are excluded, falls back to all questions so an exam never has 0 questions.
 */
export function loadQuestionBank() {
  const all = loadAllQuestions();
  const kept = all.filter(q => q.included !== false);
  return kept.length > 0 ? kept : all;
}

/**
 * Save a question bank to localStorage.
 * @param {Array} questions - Array of question objects
 */
export function saveQuestionBank(questions) {
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
}

/**
 * Reset the question bank to factory defaults.
 */
export function resetQuestionBank() {
  localStorage.removeItem(QUESTIONS_STORAGE_KEY);
}

/**
 * Check if the question bank has been customized by a proctor.
 */
export function isQuestionBankCustomized() {
  return localStorage.getItem(QUESTIONS_STORAGE_KEY) !== null;
}

// Active question set for static references
export const QUESTIONS = loadQuestionBank();
export const POINTS_PER_QUESTION = QUESTIONS.length > 0 ? Math.floor(100 / QUESTIONS.length) : 10;

