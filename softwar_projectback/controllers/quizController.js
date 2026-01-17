const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');

// AI Quiz Generation using OpenAI or Gemini
const generateQuizQuestions = async (slideContent, subjectType, chapterTitle, numQuestions = 20) => {
  const shuffleArray = (items) => {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const shuffleOptionsWithCorrect = (options, correctIndex) => {
    const optionObjects = options.map((text, index) => ({
      text,
      isCorrect: index === correctIndex
    }));
    const shuffled = shuffleArray(optionObjects);
    return {
      options: shuffled.map(item => item.text),
      correctAnswer: shuffled.findIndex(item => item.isCorrect)
    };
  };

  const normalizeAndShuffleQuestions = (questions) => {
    if (!Array.isArray(questions)) return [];

    return questions
      .filter(q => q && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.correctAnswer))
      .map(q => {
        const { options, correctAnswer } = shuffleOptionsWithCorrect(q.options, q.correctAnswer);
        return {
          ...q,
          options,
          correctAnswer
        };
      });
  };
  // Try to use OpenAI API if available
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Fallback: Generate sample questions based on content keywords
    console.log('No AI API key found, using fallback question generation');
    return generateFallbackQuestions(slideContent, subjectType, chapterTitle, numQuestions);
  }
  
  const isGemini = process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY;
  
  const prompt = `You are an expert educational quiz creator. Generate exactly ${numQuestions} multiple-choice questions based on the core topics and key concepts in the following educational content from a ${subjectType} course, chapter titled "${chapterTitle}".

CONTENT:
${slideContent.substring(0, 8000)} 

REQUIREMENTS:
1. Create exactly ${numQuestions} questions
2. Each question should have exactly 4 options (A, B, C, D)
3. Only one option should be correct
4. Questions should test understanding of the core topics, not just memorization
5. Include a mix of easy (30%), medium (50%), and hard (20%) questions
6. Questions should be clear and unambiguous
7. Distribute the correct answer across options; avoid always using the same option

Return the questions in this exact JSON format (no markdown, just pure JSON):
{
  "questions": [
    {
      "question": "The question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation why this is correct",
      "difficulty": "medium"
    }
  ]
}

The correctAnswer should be the index (0-3) of the correct option.`;

  try {
    if (isGemini) {
      // Use Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        })
      });
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return normalizeAndShuffleQuestions(parsed.questions || []);
      }
    } else {
      // Use OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert educational quiz creator. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return normalizeAndShuffleQuestions(parsed.questions || []);
      }
    }
  } catch (err) {
    console.error('AI API error:', err);
  }
  
  // Fallback if AI fails
  return generateFallbackQuestions(slideContent, subjectType, chapterTitle, numQuestions);
};

// Fallback question generation when AI is not available
const generateFallbackQuestions = (slideContent, subjectType, chapterTitle, numQuestions) => {
  const questions = [];
  
  const normalizeWord = (word) => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const stopWords = new Set([
    'the', 'and', 'that', 'with', 'this', 'from', 'into', 'your', 'have', 'has', 'was', 'were',
    'will', 'shall', 'should', 'could', 'would', 'can', 'may', 'might', 'about', 'when', 'where',
    'what', 'which', 'while', 'their', 'there', 'then', 'than', 'them', 'these', 'those', 'over',
    'under', 'between', 'within', 'without', 'also', 'because', 'since', 'such', 'more', 'most',
    'least', 'some', 'many', 'much', 'very', 'into', 'onto', 'each', 'every', 'another', 'other'
  ]);

  const shuffleArray = (items) => {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const distributeCorrectAnswer = (question) => {
    const correctOption = question.options[question.correctAnswer];
    const shuffledOptions = shuffleArray(question.options);
    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: shuffledOptions.indexOf(correctOption)
    };
  };

  // Extract key terms and concepts from content
  const sentences = slideContent.split(/[.!?]/).filter(s => s.trim().length > 20);
  const wordCounts = new Map();
  slideContent.split(/\s+/).forEach(raw => {
    const word = normalizeWord(raw);
    if (!word || word.length < 4 || stopWords.has(word)) return;
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  const topKeywords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);

  const keywordDistractors = shuffleArray(topKeywords).slice(0, 6);

  const buildKeywordQuestion = (keyword, sentence) => {
    const correctOption = sentence
      ? sentence.substring(0, 70).trim() + (sentence.length > 70 ? '...' : '')
      : `A concept that explains ${keyword}`;
    const distractors = shuffleArray([
      `A topic unrelated to ${keyword}`,
      `A minor detail not central to the chapter`,
      `A definition from a different subject`,
      `An example that does not match ${keyword}`,
      ...keywordDistractors.map(k => `A concept focused on ${k}`)
    ]).slice(0, 3);

    return {
      question: `Which statement best reflects the core idea of "${keyword}" in this chapter?`,
      options: [correctOption, ...distractors],
      correctAnswer: 0,
      difficulty: 'medium',
      explanation: 'This question is based on a key topic from the slides.'
    };
  };
  
  // Generate questions based on content patterns
  const questionTemplates = [
    {
      pattern: /(\w+) is (?:a|an|the) (\w+)/gi,
      template: (match, term, definition) => ({
        question: `What is ${term}?`,
        options: [
          `A ${definition}`,
          `A process of learning`,
          `A type of measurement`,
          `None of the above`
        ],
        correctAnswer: 0
      })
    },
    {
      pattern: /the (\w+) of (\w+)/gi,
      template: (match, property, subject) => ({
        question: `What describes the ${property} of ${subject}?`,
        options: [
          `The ${property} characteristic`,
          `The speed of change`,
          `The overall structure`,
          `The external factors`
        ],
        correctAnswer: 0
      })
    }
  ];
  
  // Subject-specific fallback questions
  const subjectQuestions = {
    mathematics: [
      { question: 'What is the result of solving a quadratic equation?', options: ['One or two solutions', 'Always one solution', 'No solution possible', 'Infinite solutions'], correctAnswer: 0 },
      { question: 'In algebra, what does a variable represent?', options: ['An unknown value', 'A constant', 'An operation', 'A formula'], correctAnswer: 0 },
      { question: 'What is the purpose of factoring in mathematics?', options: ['To simplify expressions', 'To add numbers', 'To create graphs', 'To measure angles'], correctAnswer: 0 }
    ],
    science: [
      { question: 'What is the scientific method primarily used for?', options: ['Testing hypotheses', 'Memorizing facts', 'Creating theories only', 'None of the above'], correctAnswer: 0 },
      { question: 'What role does observation play in science?', options: ['Gathering data about phenomena', 'Creating laws', 'Defining terms', 'Making assumptions'], correctAnswer: 0 }
    ],
    physics: [
      { question: 'What is Newton\'s First Law about?', options: ['Objects at rest stay at rest', 'Force equals mass times acceleration', 'Every action has a reaction', 'Energy is conserved'], correctAnswer: 0 },
      { question: 'What is the unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correctAnswer: 0 }
    ],
    chemistry: [
      { question: 'What is an atom?', options: ['The smallest unit of matter', 'A type of molecule', 'A chemical reaction', 'An energy source'], correctAnswer: 0 },
      { question: 'What does the periodic table organize?', options: ['Chemical elements', 'Chemical reactions', 'Molecular structures', 'Physical states'], correctAnswer: 0 }
    ],
    biology: [
      { question: 'What is the basic unit of life?', options: ['Cell', 'Atom', 'Molecule', 'Organ'], correctAnswer: 0 },
      { question: 'What is DNA responsible for?', options: ['Storing genetic information', 'Producing energy', 'Breaking down food', 'Transporting oxygen'], correctAnswer: 0 }
    ],
    default: [
      { question: `Based on the chapter "${chapterTitle}", what is the main concept?`, options: ['The primary topic discussed', 'An unrelated subject', 'A mathematical formula', 'A historical event'], correctAnswer: 0 },
      { question: 'What is the purpose of studying this topic?', options: ['To understand the subject better', 'For entertainment', 'To memorize dates', 'No purpose'], correctAnswer: 0 }
    ]
  };
  
  // Get subject-specific questions or default
  const baseQuestions = subjectQuestions[subjectType] || subjectQuestions.default;
  
  // Add base questions
  questions.push(...baseQuestions.map((q, i) => ({
    ...q,
    difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
    explanation: 'This is a fundamental concept from the chapter content.'
  })));

  // Add core-topic keyword questions
  topKeywords.forEach((keyword, i) => {
    if (questions.length >= numQuestions) return;
    const sentence = sentences.find(s => s.toLowerCase().includes(keyword))?.trim();
    questions.push({
      ...buildKeywordQuestion(keyword, sentence),
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard'
    });
  });
  
  // Generate more questions from content patterns
  for (let i = 0; i < sentences.length && questions.length < numQuestions; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length < 30) continue;
    
    for (const template of questionTemplates) {
      const match = template.pattern.exec(sentence);
      if (match) {
        questions.push({
          ...template.template(...match),
          difficulty: questions.length % 3 === 0 ? 'easy' : questions.length % 3 === 1 ? 'medium' : 'hard',
          explanation: 'This information is directly from the chapter slides.'
        });
        break;
      }
    }
    
    if (questions.length >= numQuestions) break;
  }
  
  // Fill remaining with generic questions
  while (questions.length < numQuestions) {
    questions.push({
      question: `Question ${questions.length + 1} about ${chapterTitle}: What have you learned?`,
      options: [
        'The main concepts and principles',
        'Only definitions',
        'Just the introduction',
        'Nothing important'
      ],
      correctAnswer: 0,
      difficulty: 'easy',
      explanation: 'This tests general understanding of the chapter.'
    });
  }
  
  return questions.slice(0, numQuestions).map(distributeCorrectAnswer);
};

// Generate quiz for a chapter (teacher action)
exports.generateQuiz = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { passingScore = 60, maxAttempts = 0, timeLimit = 0 } = req.body;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can generate quizzes' });
    }
    
    // Check if there's slide content to generate questions from
    if (!chapter.slideContent || chapter.slideContent.trim().length < 100) {
      return res.status(400).json({ 
        message: 'Please add slide content to the chapter before generating a quiz. Upload slides and their text content first.'
      });
    }
    
    // Generate questions using AI
    const questions = await generateQuizQuestions(
      chapter.slideContent,
      chapter.course.subjectType || 'other',
      chapter.title,
      20
    );
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: 'Failed to generate quiz questions. Please try again.' });
    }
    
    // Update chapter with quiz
    chapter.quiz = {
      isGenerated: true,
      generatedAt: new Date(),
      questions: questions,
      passingScore,
      maxAttempts,
      timeLimit
    };
    
    await chapter.save();
    
    res.json({
      message: 'Quiz generated successfully',
      questionsCount: questions.length,
      passingScore,
      maxAttempts: maxAttempts || 'Unlimited',
      timeLimit: timeLimit || 'No limit'
    });
  } catch (err) {
    next(err);
  }
};

// Start a quiz attempt (student action)
exports.startQuiz = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const studentId = req.body.studentId || req.userId;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Check if quiz exists
    if (!chapter.quiz?.isGenerated) {
      return res.status(400).json({ message: 'Quiz has not been generated for this chapter yet.' });
    }

    const shuffleArray = (items) => {
      const array = [...items];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const shuffleOptionsWithCorrect = (options, correctIndex) => {
      const optionObjects = options.map((text, index) => ({
        text,
        isCorrect: index === correctIndex
      }));
      const shuffled = shuffleArray(optionObjects);
      return {
        options: shuffled.map(item => item.text),
        correctAnswer: shuffled.findIndex(item => item.isCorrect)
      };
    };

    const shouldRepairQuiz = Array.isArray(chapter.quiz.questions)
      && chapter.quiz.questions.length > 0
      && chapter.quiz.questions.every(q => Array.isArray(q.options) && q.options.length === 4)
      && chapter.quiz.questions.every(q => q.correctAnswer === 0);

    if (shouldRepairQuiz) {
      chapter.quiz.questions = chapter.quiz.questions.map(q => {
        const { options, correctAnswer } = shuffleOptionsWithCorrect(q.options, q.correctAnswer);
        return {
          ...q,
          options,
          correctAnswer
        };
      });
      await chapter.save();
    }
    
    // Check if student has access to this chapter
    const course = chapter.course;
    const courseStatus = course.getStudentChapterStatus(studentId);
    const isUnlocked = chapter.chapterNumber === 1 || 
      courseStatus.chaptersCompleted?.includes(chapter.chapterNumber - 1);
    
    if (!isUnlocked) {
      return res.status(403).json({ 
        message: 'Chapter is locked. Complete the previous chapter quiz first.',
        isLocked: true
      });
    }
    
    // Check if all lectures are completed
    const studentProgress = chapter.studentProgress?.find(
      p => p.student.toString() === studentId.toString()
    );
    
    const totalLectures = chapter.lectures?.length || 0;
    const watchedLectures = studentProgress?.lecturesWatched?.length || 0;
    const allLecturesWatched = totalLectures === 0 || watchedLectures >= totalLectures || studentProgress?.allLecturesCompleted;
    
    // Also check if slides were viewed (if there are slides)
    const hasSlides = (chapter.slides?.length > 0) || chapter.slideContent;
    const slidesViewed = !hasSlides || studentProgress?.slidesViewed;
    
    if (!allLecturesWatched) {
      return res.status(403).json({
        message: `Please watch all lectures before taking the quiz. You have watched ${watchedLectures} out of ${totalLectures} lectures.`,
        lecturesRequired: true,
        totalLectures,
        watchedLectures
      });
    }
    
    if (!slidesViewed && hasSlides) {
      return res.status(403).json({
        message: 'Please view the slides before taking the quiz.',
        slidesRequired: true
      });
    }
    
    // Check max attempts
    const existingAttempts = await QuizAttempt.countDocuments({
      student: studentId,
      chapter: chapterId,
      status: 'completed'
    });
    
    if (chapter.quiz.maxAttempts > 0 && existingAttempts >= chapter.quiz.maxAttempts) {
      return res.status(400).json({ 
        message: `Maximum attempts (${chapter.quiz.maxAttempts}) reached for this quiz.`,
        attemptsUsed: existingAttempts,
        maxAttempts: chapter.quiz.maxAttempts
      });
    }
    
    // Check for existing in-progress attempt
    let attempt = await QuizAttempt.findOne({
      student: studentId,
      chapter: chapterId,
      status: 'in-progress'
    });
    
    if (attempt && !attempt.isExpired) {
      const hasAnswers = attempt.questions.some(q => q.selectedAnswer !== -1);
      const allCorrectAtA = attempt.questions.every(q => q.correctAnswer === 0);

      if (!hasAnswers && allCorrectAtA) {
        attempt.questions = attempt.questions.map(q => {
          return {
            ...q,
            ...shuffleOptionsWithCorrect(q.options, q.correctAnswer)
          };
        });
        await attempt.save();
      }

      // Return existing in-progress attempt
      return res.json({
        attemptId: attempt._id,
        attemptNumber: attempt.attemptNumber,
        questions: attempt.questions.map(q => ({
          questionText: q.questionText,
          options: q.options,
          selectedAnswer: q.selectedAnswer
        })),
        startedAt: attempt.startedAt,
        timeLimit: chapter.quiz.timeLimit,
        isResuming: true
      });
    }
    
    // Create new attempt
    const shuffleArray = (items) => {
      const array = [...items];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const shuffleOptionsWithCorrect = (options, correctIndex) => {
      const optionObjects = options.map((text, index) => ({
        text,
        isCorrect: index === correctIndex
      }));
      const shuffled = shuffleArray(optionObjects);
      return {
        options: shuffled.map(item => item.text),
        correctAnswer: shuffled.findIndex(item => item.isCorrect)
      };
    };

    const questions = chapter.quiz.questions.map(q => {
      const options = Array.isArray(q.options) ? [...q.options] : [];
      const { options: shuffledOptions, correctAnswer } = shuffleOptionsWithCorrect(options, q.correctAnswer);
      return {
        questionText: q.question,
        options: shuffledOptions,
        correctAnswer,
        explanation: q.explanation
      };
    });
    
    // Shuffle questions for variety
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    
    attempt = new QuizAttempt({
      student: studentId,
      chapter: chapterId,
      attemptNumber: existingAttempts + 1,
      questions: shuffledQuestions,
      totalQuestions: shuffledQuestions.length,
      passingScore: chapter.quiz.passingScore,
      status: 'in-progress'
    });
    
    await attempt.save();
    
    res.json({
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      questions: attempt.questions.map(q => ({
        questionText: q.questionText,
        options: q.options
      })),
      startedAt: attempt.startedAt,
      timeLimit: chapter.quiz.timeLimit,
      totalQuestions: attempt.totalQuestions,
      passingScore: chapter.quiz.passingScore
    });
  } catch (err) {
    next(err);
  }
};

// Submit quiz answers (student action)
exports.submitQuiz = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const studentId = req.body.studentId || req.userId;
    
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }
    
    // Verify this is the student's attempt
    if (attempt.student.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'This is not your quiz attempt' });
    }
    
    if (attempt.status === 'completed') {
      return res.status(400).json({ 
        message: 'This quiz has already been submitted',
        result: {
          score: attempt.score,
          passed: attempt.passed,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions
        }
      });
    }
    
    // Submit answers and calculate score
    const result = attempt.submitAnswers(answers);
    await attempt.save();
    
    // Update chapter progress
    const chapter = await Chapter.findById(attempt.chapter);
    if (chapter) {
      let progress = chapter.studentProgress.find(
        p => p.student.toString() === studentId.toString()
      );
      
      if (!progress) {
        progress = {
          student: studentId,
          quizAttempts: []
        };
        chapter.studentProgress.push(progress);
      }
      
      // Add this attempt to chapter progress
      progress.quizAttempts = progress.quizAttempts || [];
      progress.quizAttempts.push({
        attemptNumber: attempt.attemptNumber,
        score: result.score,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        passed: result.passed,
        attemptedAt: new Date()
      });
      
      // Update quiz passed status
      if (result.passed && !progress.quizPassed) {
        progress.quizPassed = true;
        progress.quizPassedAt = new Date();
        progress.chapterCompleted = true;
        progress.chapterCompletedAt = new Date();
        
        // Update course progress
        const course = await Course.findById(chapter.course);
        if (course) {
          course.updateStudentProgress(studentId, chapter.chapterNumber);
          await course.save();
        }
      }
      
      await chapter.save();
    }
    
    // Prepare response with detailed results
    const detailedResults = attempt.questions.map((q, i) => ({
      questionNumber: i + 1,
      question: q.questionText,
      options: q.options,
      selectedAnswer: q.selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: q.isCorrect,
      explanation: q.explanation
    }));
    
    res.json({
      success: true,
      result: {
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent,
        passingScore: attempt.passingScore
      },
      detailedResults,
      message: result.passed 
        ? 'Congratulations! You passed the quiz and can proceed to the next chapter.' 
        : `You scored ${result.score}%. You need ${attempt.passingScore}% to pass. Please try again.`,
      canProceed: result.passed
    });
  } catch (err) {
    next(err);
  }
};

// Get quiz results for a student
exports.getQuizResults = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const studentId = req.query.studentId || req.userId;
    
    const attempts = await QuizAttempt.find({
      student: studentId,
      chapter: chapterId
    }).sort({ attemptNumber: -1 });
    
    if (attempts.length === 0) {
      return res.json({ 
        message: 'No quiz attempts found',
        attempts: [],
        hasPassed: false
      });
    }
    
    const hasPassed = attempts.some(a => a.passed);
    const bestAttempt = attempts.reduce((best, current) => 
      current.score > (best?.score || 0) ? current : best, null);
    
    res.json({
      attempts: attempts.map(a => ({
        attemptNumber: a.attemptNumber,
        score: a.score,
        passed: a.passed,
        correctAnswers: a.correctAnswers,
        totalQuestions: a.totalQuestions,
        timeSpent: a.timeSpent,
        completedAt: a.completedAt
      })),
      hasPassed,
      bestScore: bestAttempt?.score || 0,
      totalAttempts: attempts.length
    });
  } catch (err) {
    next(err);
  }
};

// Regenerate quiz (teacher action - creates new questions)
exports.regenerateQuiz = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    
    const chapter = await Chapter.findById(chapterId).populate('course');
    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }
    
    // Verify the user is the course teacher
    if (chapter.course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the course teacher can regenerate quizzes' });
    }
    
    // Keep existing settings
    const { passingScore, maxAttempts, timeLimit } = chapter.quiz || {};
    
    // Generate new questions
    const questions = await generateQuizQuestions(
      chapter.slideContent,
      chapter.course.subjectType || 'other',
      chapter.title,
      20
    );
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: 'Failed to regenerate quiz questions.' });
    }
    
    // Update quiz with new questions
    chapter.quiz = {
      isGenerated: true,
      generatedAt: new Date(),
      questions,
      passingScore: passingScore || 60,
      maxAttempts: maxAttempts || 0,
      timeLimit: timeLimit || 0
    };
    
    await chapter.save();
    
    res.json({
      message: 'Quiz regenerated successfully with new questions',
      questionsCount: questions.length
    });
  } catch (err) {
    next(err);
  }
};
