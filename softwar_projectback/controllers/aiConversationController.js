const AIConversation = require('../models/AIConversation');
const { resolveUserId, isValidObjectId } = require('../utils/userIdResolver');

// Helper to get resolved userId
const getResolvedUserId = async (reqUserId) => {
  if (!reqUserId) return null;
  if (!isValidObjectId(reqUserId)) {
    return await resolveUserId(reqUserId);
  }
  return reqUserId;
};

// Enhanced AI Response Generator - Direct Answers
const generateAIResponse = (originalText, lowerText) => {
  // Greeting responses
  if (lowerText.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
    return "👋 Hello! I'm your AI tutor and I'm ready to help you learn. What would you like to know?";
  }

  // Science topics
  if (lowerText.includes('photosynthesis')) {
    return "🌱 Photosynthesis is the process where plants convert light energy into chemical energy (glucose).\n\nEquation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nIt occurs in two stages:\n1. Light-dependent reactions (in thylakoids): Uses light energy to split water and produce ATP\n2. Light-independent reactions/Calvin cycle (in stroma): Uses ATP to convert CO₂ into glucose\n\nThis is how plants make food and produce oxygen for life on Earth!";
  }

  if (lowerText.match(/\b(chlorophyll|glucose|oxygen|carbon dioxide)\b/) && !lowerText.includes('photosynthesis')) {
    return "🌿 These are key components of photosynthesis:\n• Chlorophyll: Green pigment that captures light energy\n• Carbon Dioxide (CO₂): Gas plants absorb from air\n• Glucose (C₆H₁₂O₆): Sugar produced as food\n• Oxygen (O₂): Gas released as byproduct\n\nTogether they enable plants to convert sunlight into usable energy!";
  }

  // Math topics
  if (lowerText.includes('quadratic') || (lowerText.includes('equation') && lowerText.match(/\b(quadratic|ax|bx)\b/))) {
    return "📐 **Quadratic Equations** (ax² + bx + c = 0)\n\n**Main Solution Methods:**\n\n1. **Quadratic Formula**: x = (-b ± √(b²-4ac)) / 2a\n   → Works for ALL quadratic equations\n   → Most reliable method\n\n2. **Factoring**: (x + p)(x + q) = 0\n   → Faster if numbers factor nicely\n   → Find p and q where pq = c and p+q = b\n\n3. **Completing the Square**: Rewrite as (x + p)² = q\n   → Good for understanding the concept\n\n4. **Graphing**: Plot and find x-intercepts\n   → Visual approach\n\nThe discriminant (b²-4ac) tells you:\n• > 0: Two real solutions\n• = 0: One real solution\n• < 0: No real solutions";
  }

  if (lowerText.match(/\b(algebra|solve|equation)\b/) && !lowerText.includes('quadratic')) {
    return "📊 **Algebra** is about solving equations and working with variables.\n\n**Key Rules:**\n• Whatever you do to one side, do to the other\n• Goal: Isolate the variable (usually x)\n• Use inverse operations:\n  - Addition ↔ Subtraction\n  - Multiplication ↔ Division\n  - Powers ↔ Roots\n\n**Example**: 2x + 5 = 13\n• Subtract 5: 2x = 8\n• Divide by 2: x = 4\n\nCheck: 2(4) + 5 = 13 ✓";
  }

  if (lowerText.match(/\b(calculus|derivative|integral|limit)\b/)) {
    return "📈 **Calculus** studies rates of change and accumulation.\n\n**Key Concepts:**\n\n1. **Limits**: What value a function approaches\n2. **Derivatives**: Rate of change (slope of curve)\n   → Used for velocity, acceleration, optimization\n3. **Integrals**: Accumulation (area under curve)\n   → Opposite of derivatives\n   → Used for total distance, area, volume\n\n**Basic Rules:**\n• Power Rule: d/dx(x^n) = nx^(n-1)\n• Sum Rule: Derivative of sum = sum of derivatives\n• Chain Rule: For composite functions\n\nCalculus has countless real-world applications in physics, engineering, and economics!";
  }

  if (lowerText.match(/\b(geometry|triangle|circle|angle|area|perimeter|volume|sphere|polygon)\b/)) {
    return "📏 **Geometry** studies shapes, sizes, and spatial relationships.\n\n**Key Formulas:**\n• Triangle Area: A = ½ × base × height\n• Circle: Area = πr², Circumference = 2πr\n• Pythagorean Theorem: a² + b² = c²\n• Volume Sphere: V = ⁴⁄₃πr³\n• Volume Cube: V = side³\n\n**Angles:**\n• Right angle: 90°\n• Straight line: 180°\n• Triangle total: 180°\n• Circle total: 360°\n\n**Properties of Shapes:**\n• Square: All sides equal, all angles 90°\n• Rectangle: Opposite sides equal, all angles 90°\n• Equilateral Triangle: All sides and angles equal";
  }

  if (lowerText.match(/\b(statistics|probability|mean|median|mode|average|distribution|deviation)\b/)) {
    return "📊 **Statistics & Probability**:\n\n**Measures of Center:**\n• Mean: Sum ÷ Count (average)\n• Median: Middle value when sorted\n• Mode: Most frequently occurring value\n• Range: Highest - Lowest\n\n**Probability Basics:**\n• Probability = Favorable outcomes ÷ Total possible outcomes\n• Ranges from 0 (impossible) to 1 (certain)\n• Independent events: P(A and B) = P(A) × P(B)\n• Dependent events: Probability changes based on previous outcome\n\n**Distributions:**\n• Normal Distribution: Bell curve, most data near center\n• Standard Deviation: Measures how spread out data is\n• 68-95-99.7 Rule: Where data falls in normal distribution";
  }

  if (lowerText.match(/\b(wave|light|sound|frequency|wavelength|echo|refraction|reflection|optics)\b/)) {
    return "🌊 **Waves, Light & Sound**:\n\n**Wave Properties:**\n• Frequency: How many waves per second (Hz)\n• Wavelength: Distance between consecutive peaks\n• Speed = Frequency × Wavelength\n• Amplitude: Height of the wave\n\n**Light:**\n• Visible spectrum: Red → Orange → Yellow → Green → Blue → Indigo → Violet\n• Speed: 300,000 km/s (fastest thing known)\n• Reflection: Bounces off surfaces at equal angles\n• Refraction: Bends through different materials\n• Diffraction: Bends around obstacles\n\n**Sound:**\n• Travels slower than light (~343 m/s in air)\n• Needs a medium (air, water, solids)\n• Cannot travel through vacuum\n• Echo: Sound reflecting back to you";
  }

  if (lowerText.match(/\b(heat|temperature|thermal|conduction|convection|radiation|energy)\b/)) {
    return "🔥 **Thermal Energy & Heat**:\n\n**Temperature vs Heat:**\n• Temperature: Measure of how fast particles move (°C or °F)\n• Heat: Energy transfer from hot to cold\n• Thermal energy: Total energy of moving particles\n\n**Three Methods of Heat Transfer:**\n1. **Conduction**: Direct contact between materials (touching hot stove)\n2. **Convection**: Movement through fluids (boiling water, air currents)\n3. **Radiation**: Through electromagnetic waves (sunlight, heat lamps)\n\n**Laws:**\n• Heat flows from hot → cold (naturally)\n• Specific heat: Energy needed to raise 1kg by 1°C\n• First Law: Energy conserved, can't be created/destroyed\n• Second Law: Heat flow increases disorder";
  }

  if (lowerText.match(/\b(electron|proton|neutron|nucleus|orbital|valence|isotope|ion)\b/)) {
    return "⚛️ **Atomic Structure & Particles**:\n\n**Subatomic Particles:**\n• **Proton** (+): Located in nucleus, positive charge, mass = 1 amu\n• **Neutron** (0): Located in nucleus, no charge, mass = 1 amu\n• **Electron** (-): Orbit nucleus, negative charge, mass = 1/1836 amu\n\n**Nucleus**: Contains all protons and neutrons (99.9% of atom's mass)\n\n**Electron Configuration:**\n• Electrons orbit in shells (energy levels)\n• Valence electrons: Outermost shell (determine bonding)\n• Follows Aufbau principle and Pauli exclusion\n\n**Isotopes**: Same element (same protons), different neutrons → different atomic mass\n**Ions**: Atoms with unequal electrons and protons (charged)\n• Cation: Lost electron (positive)\n• Anion: Gained electron (negative)";
  }

  if (lowerText.match(/\b(plant|animal|body system|organ|tissue|anatomy|digestion|circulation|respiration|nervous|immune)\b/)) {
    return "🫀 **Body Systems & Anatomy**:\n\n**Major Organ Systems:**\n• **Digestive**: Break down food, absorb nutrients\n• **Circulatory**: Heart pumps blood, delivers oxygen\n• **Respiratory**: Lungs exchange gases (O₂ in, CO₂ out)\n• **Nervous**: Brain controls all systems\n• **Muscular**: Enables movement\n• **Skeletal**: Support and protection\n• **Immune**: Defense against disease and pathogens\n• **Endocrine**: Hormone regulation\n\n**Levels of Organization:**\nCell → Tissue → Organ → System → Organism\n\n**Plant Parts & Functions:**\n• **Roots**: Absorb water and nutrients from soil\n• **Stems**: Transport water and nutrients, provide support\n• **Leaves**: Photosynthesis (main site)\n• **Flowers**: Reproduction\n• **Fruits**: Seed dispersal";
  }

  if (lowerText.match(/\b(genetics|inheritance|trait|dominant|recessive|mutation|protein|enzyme|mitosis|meiosis)\b/)) {
    return "🧪 **Genetics & Heredity**:\n\n**Inheritance of Traits:**\n• Alleles: Different versions of a gene\n• Dominant: Appears even with one copy\n• Recessive: Needs two copies to appear\n• Punnett square: Predicts offspring traits\n• Ratio in offspring: 3:1 (dominant:recessive) for heterozygous cross\n\n**DNA to Protein Translation:**\n1. DNA codon (3 bases = 1 code)\n2. mRNA carries instructions from DNA\n3. tRNA brings matching amino acids\n4. Amino acids link to form protein\n5. Protein folds into 3D shape\n\n**Mutations**: Changes in DNA sequence\n• Can be beneficial (useful), harmful (disease), or neutral (no effect)\n• Silent, missense, nonsense types\n• Drive evolution and genetic variation\n\n**Cell Division:**\n• **Mitosis**: Makes identical copies (growth, repair)\n• **Meiosis**: Makes sex cells (gametes) with half DNA";
  }

  if (lowerText.match(/\b(history|ancient|medieval|renaissance|industrial|modern|revolution|war|civilization|empire|culture)\b/)) {
    return "📚 **History Overview**:\n\n**Ancient Era** (3000-500 BCE):\n• Rise of civilizations: Egypt, Mesopotamia, Greece, Rome\n• Development of writing, philosophy, mathematics\n• Major religions founded\n\n**Medieval Era** (500-1500 CE):\n• Feudalism dominates Europe\n• Islamic Golden Age advances science, math, medicine\n• Great inventions: compass, gunpowder, printing press\n\n**Renaissance** (1300-1600):\n• Rebirth of classical learning and art\n• Humanism emphasizes human potential\n• Scientific method develops\n• Age of Exploration begins\n\n**Industrial Revolution** (1700s-1800s):\n• Machines replace manual labor\n• Factory system develops\n• Railroads and steam power transform society\n• Rapid urbanization\n\n**Modern Era** (1900s-present):\n• Two World Wars reshape global politics\n• Technology explosion (electricity, computers, internet)\n• Globalization connects world economy\n\nHistory shows cause and effect across centuries!";
  }

  if (lowerText.match(/\b(science|discovery|invention|scientist|experiment|method|observation|hypothesis)\b/)) {
    return "🔬 **Scientific Method & Famous Discoveries**:\n\n**The Scientific Method (7 Steps):**\n1. **Question**: What do I want to know?\n2. **Research**: Gather existing information\n3. **Hypothesis**: Make an educated guess based on research\n4. **Experiment**: Design and conduct controlled test\n5. **Analyze**: Look at results, calculate statistics\n6. **Conclude**: Did results support hypothesis?\n7. **Report**: Share findings with others for peer review\n\n**Famous Scientists & Discoveries:**\n• **Newton**: Laws of motion and gravity\n• **Einstein**: Relativity (E=mc²)\n• **Darwin**: Theory of evolution\n• **Curie**: Radioactivity and polonium/radium\n• **Pasteur**: Germ theory\n• **Fleming**: Penicillin (first antibiotic)\n\n**Key Terms:**\n• Control group: For comparison\n• Variable: Something that can change\n• Bias: Tendency to favor one result";
  }

  if (lowerText.match(/\b(grammar|vocabulary|writing|essay|literature|syntax|punctuation|verb|noun|adjective|adverb|pronoun)\b/)) {
    return "✍️ **Grammar & Writing Fundamentals**:\n\n**Parts of Speech:**\n• **Noun**: Person, place, thing, idea (cat, Paris, freedom)\n• **Verb**: Action or state (run, is, think)\n• **Adjective**: Describes noun (beautiful, blue, tall)\n• **Adverb**: Describes verb/adjective (quickly, very, well)\n• **Preposition**: Shows relationship (in, on, between, during)\n• **Pronoun**: Replaces noun (he, she, it, they, who)\n• **Conjunction**: Connects ideas (and, but, because, although)\n\n**Sentence Types:**\n• Simple: One independent clause\n• Compound: Two independent clauses joined by conjunction\n• Complex: Independent + dependent clause\n• Compound-complex: Multiple of each\n\n**Essay Structure:**\n1. **Introduction**: Hook reader + thesis statement\n2. **Body**: 3-4 paragraphs, each with topic sentence + evidence\n3. **Conclusion**: Restate thesis + summarize main points\n\n**Writing Tips:**\n• Show, don't tell (use vivid details)\n• Vary sentence length and structure\n• Use active voice (subject performs action)\n• Proofread carefully";
  }

  if (lowerText.match(/\b(geography|continent|country|capital|map|landform|climate|biome|mountain|ocean|river|desert|forest)\b/)) {
    return "🌍 **Geography & World**:\n\n**Continents** (7):\nAfrica, Antarctica, Asia, Europe, North America, South America, Australia/Oceania\n\n**Landforms:**\n• **Mountains**: High elevations, formed by plate tectonics\n• **Valleys**: Low areas between mountains\n• **Plains**: Flat, fertile land (great for farming)\n• **Deserts**: Very dry (less than 250mm rain/year)\n• **Forests**: Dense vegetation (tropical, temperate, boreal)\n• **Plateaus**: High flat areas\n• **Canyons**: Deep valleys with steep sides\n\n**Climate Zones:**\n• **Tropical**: Hot, wet year-round\n• **Temperate**: Moderate, four seasons\n• **Polar**: Very cold, snow and ice\n• **Arid**: Very dry, little rainfall\n• **Mediterranean**: Mild, seasonal rainfall\n\n**Major Water Bodies:**\n• **Oceans**: Saltwater (cover 71% of Earth)\n• **Rivers**: Freshwater flowing to ocean\n• **Lakes**: Freshwater bodies (landlocked)";
  }

  if (lowerText.match(/\b(economics|supply|demand|market|trade|currency|profit|investment|business|commerce)\b/)) {
    return "💰 **Economics & Business Basics**:\n\n**Supply & Demand:**\n• **Supply**: How much of product is available\n• **Demand**: How much people want to buy\n• **Equilibrium**: Supply = Demand (sets price)\n• Price relationship: High demand + Low supply = High price\n\n**Markets:**\n• Where buyers and sellers meet\n• Free market: Supply and demand set price\n• Competition: Drives quality and lowers prices\n\n**Money & Trade:**\n• **Currency**: Medium of exchange (money)\n• **Import**: Buy goods from another country\n• **Export**: Sell goods to another country\n• **Trade balance**: Imports vs exports\n\n**Business Economics:**\n• **Profit** = Revenue - Costs\n• **Break-even**: Revenue = Costs\n• **Loss**: Revenue < Costs\n• **Investment**: Money for future gain (stocks, business)\n• **ROI (Return on Investment)**: Profit from investment";
  }

  if (lowerText.match(/\b(technology|computer|programming|code|software|algorithm|data|internet|digital|binary|network|ai)\b/)) {
    return "💻 **Technology & Computing Basics**:\n\n**Computer Fundamentals:**\n• **Binary**: 0s and 1s (on/off, true/false)\n• **Bit**: Single 0 or 1\n• **Byte**: 8 bits\n• **Algorithm**: Step-by-step procedure to solve problem\n\n**Computer Components:**\n• **CPU**: Central Processing Unit (brain)\n• **RAM**: Quick-access memory (volatile, lost when off)\n• **Storage**: Hard drive/SSD (permanent)\n• **GPU**: Graphics Processing Unit\n• **Motherboard**: Connects all components\n\n**Internet & Networking:**\n• **IP Address**: Unique identifier (like home address)\n• **Website**: Pages hosted on servers\n• **Cloud**: Remote storage (Google Drive, Dropbox)\n• **Bandwidth**: Speed of data transfer\n\n**Programming Basics:**\n• **Variable**: Container for data\n• **Loop**: Repeat action multiple times\n• **Function**: Reusable block of code\n• **Conditional**: If/else decision making\n\n**Popular Languages**: Python, JavaScript, Java, C++";
  }

  if (lowerText.match(/\b(psychology|behavior|emotion|learning|memory|brain|mind|stress|confidence|motivation)\b/)) {
    return "🧠 **Psychology & Learning Science**:\n\n**Memory Types:**\n• **Sensory**: Very brief (milliseconds)\n• **Short-term**: Limited capacity (~7 items), ~30 seconds\n• **Long-term**: Large capacity, years to lifetime\n• **Working memory**: Active processing\n\n**Learning Styles:**\n• **Visual**: Learn through seeing (diagrams, videos)\n• **Auditory**: Learn through hearing (lectures, discussions)\n• **Kinesthetic**: Learn through doing (hands-on, movement)\n• **Reading/Writing**: Learn through text\n\n**Study & Learning Techniques:**\n• **Active Recall**: Test yourself without notes\n• **Spaced Repetition**: Review at increasing intervals\n• **Teach Others**: Explain concepts aloud\n• **Mind Maps**: Visual connections between ideas\n• **Chunking**: Break information into meaningful parts\n• **Interleaving**: Mix up different topics while studying\n\n**Emotions:**\n• Basic emotions: Happy, sad, angry, scared, surprised, disgusted\n• Affect behavior and decision-making\n• Controlled by brain chemistry (dopamine, serotonin)\n\n**Motivation**: Drive to achieve goals (intrinsic vs extrinsic)";
  }

  // Comprehensive study tips
  if (lowerText.match(/\b(study|test|exam|learn|homework|assignment|revision|preparation|focus|concentration|test prep)\b/)) {
    return "📚 **Comprehensive Study & Learning Guide**:\n\n**Effective Study Techniques:**\n✅ **Active Recall**: Test yourself without looking at notes\n✅ **Spaced Repetition**: Review material on day 1, 3, 7, 14, 30\n✅ **Teach Others**: Explain concepts aloud to someone (or yourself)\n✅ **Mind Maps**: Draw connections between topics\n✅ **Practice Problems**: Apply knowledge to new situations\n✅ **Pomodoro Technique**: Study 25 min, break 5 min\n✅ **Sleep**: Get 7-9 hours (memory consolidation)\n✅ **Chunking**: Break information into small, manageable pieces\n✅ **Interleaving**: Mix topics instead of blocking\n✅ **Elaboration**: Connect new info to what you know\n\n**Test Preparation:**\n• Start studying 2-3 weeks before\n• Review notes within 24 hours\n• Do past exams/practice tests\n• Focus on weak areas\n• Get good sleep before exam\n• Eat nutritious breakfast\n\n**During Tests:**\n• Read all questions carefully\n• Manage time (easier questions first)\n• Show your work\n• Review if time permits";
  }

  // Comprehensive capabilities
  if (lowerText.match(/\b(can you|what can|abilities|help with|capable)\b/)) {
    return "🤖 **I Can Help With:**\n\n📚 **Subjects**:\n• Math: Algebra, Geometry, Calculus, Statistics, Trigonometry\n• Science: Physics, Chemistry, Biology, Astronomy\n• Social Studies: History, Geography, Economics\n• Language: Grammar, Writing, Literature, Vocabulary\n\n🧠 **Learning Support**:\n• Explain concepts step-by-step\n• Answer homework questions\n• Provide study strategies\n• Prepare for exams\n• Understand difficult topics\n\n💡 **Problem-Solving**:\n• Walk through complex problems\n• Multiple solution methods\n• Real-world applications\n• Critical thinking guidance\n\nWhat subject or topic would you like help with?";
  }

  // Generic educational response - direct and helpful
  if (lowerText.match(/\b(what|how|why|explain|tell|teach|question)\b/)) {
    return "📖 **I'm ready to help!** Ask me about any topic:\n\n📚 School subjects (Math, Science, History, etc.)\n🔬 How things work or why they happen\n✍️ Writing, grammar, and language\n🧮 Problem-solving and calculations\n🎯 Concepts and theories\n💡 Study tips and learning strategies\n\nJust ask your question and I'll explain it clearly with examples!";
  }

  // Thanks/gratitude
  if (lowerText.match(/\b(thanks|thank you|appreciate|grateful|awesome|great)\b/)) {
    return "😊 You're welcome! I'm happy to help. Keep learning and ask me anything else!";
  }

  // Confusion support
  if (lowerText.match(/\b(don't understand|not understand|confused|stuck|difficult|hard|challenge|help)\b/)) {
    return "💪 **No problem! Learning takes time and practice.**\n\nTell me:\n1. What topic or subject?\n2. What part is confusing?\n3. What have you tried so far?\n\nI'll break it down step-by-step until it makes sense!";
  }

  // Default response - welcoming and direct
  return "✨ **I'm your AI tutor! I can help with:**\n\n📚 Any school subject\n🔬 Science, math, history, writing\n🧠 Study techniques and tips\n💡 Explain difficult concepts\n❓ Answer any educational question\n\n**What would you like to learn?**";
};

// Get all conversations for the authenticated user
exports.getConversations = async (req, res, next) => {
  try {
    let userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversations = await AIConversation.find({ 
      user: userId, 
      isDeleted: false 
    })
      .select('title preview messageCount createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json(conversations);
  } catch (err) {
    console.error('Error getting AI conversations:', err);
    next(err);
  }
};

// Get a single conversation with all messages
exports.getConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversation = await AIConversation.findOne({ 
      _id: id, 
      user: userId,
      isDeleted: false 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error getting AI conversation:', err);
    next(err);
  }
};

// Create a new conversation
exports.createConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { title, preview, messages } = req.body;

    const conversation = await AIConversation.create({
      user: userId,
      title: title || 'New Conversation',
      preview: preview || '',
      messages: messages || [],
      messageCount: messages ? messages.length : 0
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error('Error creating AI conversation:', err);
    next(err);
  }
};

// Update a conversation (add messages)
exports.updateConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { title, preview, messages, messageCount } = req.body;

    const conversation = await AIConversation.findOne({ 
      _id: id, 
      user: userId,
      isDeleted: false 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Update fields
    if (title) conversation.title = title;
    if (preview) conversation.preview = preview;
    if (messages) conversation.messages = messages;
    if (messageCount !== undefined) conversation.messageCount = messageCount;

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error('Error updating AI conversation:', err);
    next(err);
  }
};

// Delete a conversation (soft delete)
exports.deleteConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: id, user: userId },
      { isDeleted: true },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting AI conversation:', err);
    next(err);
  }
};

// Add a message to an existing conversation
// exports.addMessage = async (req, res, next) => {
//   try {
//     let userId = req.userId;
//     const { id } = req.params;
//     const { type, text } = req.body;

//     if (!userId) {
//       return res.status(401).json({ message: 'Not authenticated' });
//     }

//     // Resolve 'admin' to real ObjectId
//     userId = await getResolvedUserId(userId);
//     if (!userId) {
//       return res.status(401).json({ message: 'User not found' });
//     }

//     if (!type || !text) {
//       return res.status(400).json({ message: 'Message type and text are required' });
//     }

//     const conversation = await AIConversation.findOne({ 
//       _id: id, 
//       user: userId,
//       isDeleted: false 
//     });

//     if (!conversation) {
//       return res.status(404).json({ message: 'Conversation not found' });
//     }

//     conversation.messages.push({ type, text });
//     conversation.messageCount = conversation.messages.length;
    
//     // Update preview with latest user message
//     if (type === 'user') {
//       conversation.preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
//     }

//     await conversation.save();

//     res.json(conversation);
//   } catch (err) {
//     console.error('Error adding message to AI conversation:', err);
//     next(err);
//   }
// };


// Add a message to an existing conversation + generate AI reply




// exports.addMessage = async (req, res, next) => {
//   try {
//     let userId = req.userId;
//     const { id } = req.params;
//     const { type, text } = req.body;

//     if (!userId) return res.status(401).json({ message: 'Not authenticated' });

//     userId = await getResolvedUserId(userId);
//     if (!userId) return res.status(401).json({ message: 'User not found' });

//     if (!type || !text) {
//       return res.status(400).json({ message: 'Message type and text are required' });
//     }

//     const conversation = await AIConversation.findOne({
//       _id: id,
//       user: userId,
//       isDeleted: false
//     });

//     if (!conversation) {
//       return res.status(404).json({ message: 'Conversation not found' });
//     }

//     // 1) Save user message
//     conversation.messages.push({ type, text });
//     conversation.messageCount = conversation.messages.length;

//     if (type === 'user') {
//       conversation.preview = text.length > 50 ? text.substring(0, 50) + '...' : text;

//       // 2) Generate AI reply (TEMP: local rule-based reply)
//       const lower = text.toLowerCase();

//       let aiReply =
//         "I can help ✅\nTell me:\n1) Subject\n2) Grade\n3) Your exact question\nAnd I’ll explain step-by-step.";

//       if (lower.includes('hi') || lower.includes('hello')) {
//         aiReply = "Hi! 👋 Tell me what subject you’re studying and your question.";
//       } else if (lower.includes('photosynthesis')) {
//         aiReply =
//           "Photosynthesis is how plants make food using sunlight 🌱\n\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂";
//       } else if (lower.includes('quadratic') || lower.includes('equation')) {
//         aiReply =
//           "For quadratic equations ax²+bx+c=0 you can use:\n\nx = (-b ± √(b²-4ac)) / 2a\n\nSend me a sample and I’ll solve it.";
//       }

//       // 3) Save AI message
//       conversation.messages.push({ type: 'ai', text: aiReply });
//       conversation.messageCount = conversation.messages.length;
//     }

//     await conversation.save();

//     // 4) Return last AI message directly
//     const lastMessage = conversation.messages[conversation.messages.length - 1];
//     return res.json({
//       conversationId: conversation._id,
//       message: lastMessage, // this should be AI message if user sent a message
//       conversation,
//     });
//   } catch (err) {
//     console.error('Error adding message to AI conversation:', err);
//     next(err);
//   }
// };


// Add a message to an existing conversation + generate AI reply

exports.addMessage = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;
    const { type, text } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    userId = await getResolvedUserId(userId);
    if (!userId) return res.status(401).json({ message: 'User not found' });

    if (!text) return res.status(400).json({ message: 'Text is required' });

    const conversation = await AIConversation.findOne({
      _id: id,
      user: userId,
      isDeleted: false,
    });

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // ✅ 1) Save user message
    conversation.messages.push({ role: 'user', text });
    conversation.preview = text.length > 50 ? text.substring(0, 50) + '...' : text;

    // ✅ 2) Generate AI reply with enhanced logic
    const lower = text.toLowerCase();
    let aiReply = generateAIResponse(text, lower);

    // ✅ 3) Save AI message
    conversation.messages.push({ role: 'ai', text: aiReply });

    conversation.messageCount = conversation.messages.length;
    await conversation.save();

    // ✅ 4) Return the saved AI message (from DB, not from variable)
    const last = conversation.messages[conversation.messages.length - 1];

    return res.json({
      conversationId: conversation._id,
      message: last,          // { role:'ai', text:'...' }
      messages: conversation.messages, // optional
    });
  } catch (err) {
    console.error('Error adding message:', err);
    next(err);
  }
};
