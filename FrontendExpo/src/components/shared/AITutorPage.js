import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiAPI } from '../../services/api';

const suggestedQuestions = [
  'Explain photosynthesis',
  'How do I solve quadratic equations?',
  'What is Newton\'s first law?',
  'Help me understand fractions',
  'Explain the water cycle',
];

export default function AITutorPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your AI tutor. How can I help you with your studies today? 📚',
      sender: 'ai',
      time: 'Now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      time: 'Now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Check if user is still logged in before making API call
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // User logged out, use local response
        const aiResponse = {
          id: Date.now() + 1,
          text: getAIResponse(text),
          sender: 'ai',
          time: 'Now',
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
        return;
      }

      // Try to call the AI API
      const response = await aiAPI.sendMessage(text, conversationId);
      
      // Backend returns { conversationId, message: {role, text}, messages: [...] }
      let aiText = getAIResponse(text); // fallback
      
      if (response?.message?.text) {
        aiText = response.message.text;
      } else if (response?.message) {
        aiText = response.message;
      } else if (response?.data?.message?.text) {
        aiText = response.data.message.text;
      } else if (response?.data?.message) {
        aiText = response.data.message;
      }
      
      if (response?.conversationId) {
        setConversationId(response.conversationId);
      } else if (response?.data?.conversationId) {
        setConversationId(response.data.conversationId);
      }

      const aiResponse = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      // Only log if not a 401 (user logged out)
      if (error.response?.status !== 401) {
        console.error('AI API Error:', error);
      }
      // Fall back to local responses
      const aiResponse = {
        id: Date.now() + 1,
        text: getAIResponse(text),
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = (question) => {
    const lower = question.toLowerCase();

    // Greetings
    if (lower.match(/\b(hi|hello|hey|greetings)\b/)) {
      return "👋 Hello! I'm here to help. What would you like to learn?";
    }

    // Chemistry - Direct answers (check atomic before general questions)
    if (lower.match(/\b(chemistry|atom|atomic|element|compound|reaction|bond|oxidation|acid|base)\b/)) {
      return "⚗️ Chemistry Basics:\n\n**Atoms**: Tiny particles with Protons + Neutrons + Electrons\n**Atomic Structure**: Nucleus (protons/neutrons) + Electrons orbiting\n\n**Elements**: Pure substances (Gold, Oxygen, Carbon)\n**Compounds**: Atoms bonded together (Water H₂O, Salt NaCl)\n**Reactions**: Atoms rearrange\n  H₂ + O₂ → H₂O (hydrogen + oxygen = water)\n\n**Bonding Types**:\n• Ionic: Atoms exchange electrons (NaCl - salty)\n• Covalent: Atoms share electrons (H₂O - water)\n\n**Oxidation**: Loss of electrons\n**Acid/Base**: pH scale (0-14), acids sour, bases bitter";
    }

    // Science - Direct answers
    if (lower.includes('photosynthesis')) {
      return "🌱 Photosynthesis: Plants convert light energy into chemical energy (glucose).\n\nEquation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nTwo stages:\n1. Light reactions (thylakoids): Split water, produce ATP\n2. Calvin cycle (stroma): Use ATP to convert CO₂ to glucose\n\nResult: Food for plant + oxygen for life!";
    }

    // Math - Direct answers
    if (lower.includes('quadratic') || (lower.includes('equation') && lower.match(/\b(ax|bx|polynomial)\b/))) {
      return "📐 Quadratic Equations (ax² + bx + c = 0):\n\nQuick solution methods:\n1. **Quadratic Formula**: x = (-b ± √(b²-4ac)) / 2a (always works)\n2. **Factoring**: (x+p)(x+q)=0 (fast if it factors nicely)\n3. **Completing square**: (x+p)²=q (useful for understanding)\n\nExample: x² + 5x + 6 = 0\nFactors to: (x+2)(x+3) = 0\nSolutions: x = -2 or x = -3";
    }

    if (lower.match(/\b(algebra|solve|variable|expression)\b/)) {
      return "📊 Algebra: Solving for unknown variables using inverse operations.\n\n**Key: Do the same operation to both sides**\n\nExample: 3x + 7 = 16\n• Subtract 7: 3x = 9\n• Divide by 3: x = 3\n\nVerify: 3(3) + 7 = 9 + 7 = 16 ✓\n\nAlways use opposite operations to isolate x!";
    }

    if (lower.match(/\b(calculus|derivative|integral|limit)\b/)) {
      return "📈 Calculus: Studies change and accumulation.\n\n**Derivatives**: Rate of change (slope)\n• Formula: d/dx(x²) = 2x\n• Used for: velocity, acceleration, optimization\n\n**Integrals**: Opposite of derivatives (area)\n• Used for: total distance, area, volume\n\n**Basic power rule**: d/dx(xⁿ) = nxⁿ⁻¹\n\nCalculus powers physics, engineering, economics!";
    }

    // Physics - Direct answers
    if (lower.includes('newton') || lower.match(/\b(first law|second law|third law|force|inertia)\b/)) {
      return "⚙️ Newton's Three Laws:\n\n1️⃣ **Inertia**: Objects keep doing what they're doing unless a force acts\n• Seatbelts prevent you from flying forward when car stops\n\n2️⃣ **F = ma**: Force = mass × acceleration\n• Heavier objects need more force to move\n• More force = faster acceleration\n\n3️⃣ **Action-Reaction**: Equal and opposite forces\n• You push ground down, ground pushes you up (jumping)\n• Rocket expels gas down, goes up";
    }

    if (lower.match(/\b(velocity|speed|acceleration|motion|kinetic)\b/)) {
      return "🚀 Motion Fundamentals:\n\n**Speed**: How fast (no direction)\n• 60 km/h\n\n**Velocity**: How fast + direction\n• 60 km/h North\n\n**Acceleration**: Change in velocity\n• Speeding up: a = 5 m/s²\n• Slowing down: a = -5 m/s²\n• Turning: Even at same speed, changing direction = acceleration\n\n**Kinetic Energy**: Energy of motion = ½mv²";
    }

    // Biology - Direct answers (check before general questions)
    if (lower.match(/\b(cell|dna|gene|biology|genetics|evolution|ecosystem)\b/)) {
      return "🧬 Biology Essentials:\n\n**Cells**: Basic units of life\n• Nucleus controls the cell\n• Organelles do specific jobs\n\n**DNA**: Genetic instruction manual\n• Double helix shape\n• Made of A, T, G, C bases\n• Code: 3 bases = 1 amino acid = part of protein\n\n**Genes**: DNA segments coding for proteins\n• Control traits (eye color, height)\n• Inherited from parents\n\n**Evolution**: Species change over time through natural selection";
    }

    // History - Direct answers
    if (lower.match(/\b(history|war|ancient|medieval|renaissance|industrial)\b/)) {
      return "📚 Historical Periods:\n\n**Ancient** (3000-500 BCE): Rise of civilizations, inventions\n**Medieval** (500-1500): Kingdoms, feudalism, discoveries\n**Renaissance** (1300-1600): Rebirth of learning and art\n**Industrial** (1700-1800): Machines replace manual labor\n**Modern** (1900-present): Technology, globalization\n\nHistory shows cause and effect across centuries!";
    }

    // Grammar - Direct answers
    if (lower.match(/\b(grammar|writing|essay|verb|noun|adjective|sentence)\b/)) {
      return "✍️ Writing Essentials:\n\n**Parts of speech**:\n• Nouns: Person, place, thing\n• Verbs: Action or state\n• Adjectives: Describe nouns\n\n**Essay structure**:\n1. Intro: Hook + thesis\n2. Body: 3 paragraphs with evidence\n3. Conclusion: Restate thesis\n\n**Golden rule**: Show, don't tell!";
    }

    if (lower.match(/\b(geometry|triangle|circle|angle|area|perimeter|volume|sphere|polygon|prism)\b/)) {
      return "📏 **Geometry**:\n\n**Key Formulas**:\n• Triangle Area: A = ½ × base × height\n• Circle: A = πr², C = 2πr\n• Pythagorean: a² + b² = c²\n• Volume Sphere: V = ⁴⁄₃πr³\n\n**Angles**:\n• Right angle: 90°\n• Straight line: 180°\n• Triangle total: 180°\n• Circle total: 360°";
    }

    if (lower.match(/\b(statistics|probability|mean|median|mode|average|distribution|deviation)\b/)) {
      return "📊 **Statistics & Probability**:\n\n**Measures of Center**:\n• Mean: Sum ÷ Count (average)\n• Median: Middle value\n• Mode: Most frequent value\n\n**Probability**:\n• Probability = Favorable ÷ Total\n• Ranges 0 to 1 (0-100%)\n• Independent: P(A and B) = P(A) × P(B)\n\n**Distributions**:\n• Normal: Bell curve\n• Standard deviation: Measures spread";
    }

    if (lower.match(/\b(velocity|speed|acceleration|motion|kinetic|energy|momentum|impulse)\b/)) {
      return "🚀 **Motion & Energy**:\n\n**Speed vs Velocity**:\n• Speed: How fast (km/h)\n• Velocity: Speed + direction\n\n**Acceleration**: Change in velocity\n• a = (v₂ - v₁) / time\n\n**Energy**:\n• Kinetic: Energy of motion = ½mv²\n• Potential: Stored energy\n• Conservation: Total energy stays same\n\n**Momentum**: p = mass × velocity";
    }

    if (lower.match(/\b(wave|light|sound|frequency|wavelength|echo|refraction|reflection)\b/)) {
      return "🌊 **Waves & Light**:\n\n**Wave Properties**:\n• Frequency: How many per second (Hz)\n• Wavelength: Distance between peaks\n• Speed = Frequency × Wavelength\n\n**Light**:\n• Spectrum: Red → Orange → Yellow → Green → Blue → Indigo → Violet\n• Speed: 300,000 km/s\n• Reflection: Bounces off\n• Refraction: Bends through\n\n**Sound**:\n• Needs medium (air, water)\n• Echo: Sound reflecting back";
    }

    if (lower.match(/\b(heat|temperature|thermal|conduction|convection|radiation)\b/)) {
      return "🔥 **Thermal Energy & Heat**:\n\n**Temperature vs Heat**:\n• Temperature: Particle motion measure\n• Heat: Energy transfer\n\n**Transfer Methods**:\n1. Conduction: Direct contact\n2. Convection: Through fluids\n3. Radiation: Through waves\n\n**Laws**:\n• Heat flows: Hot → Cold\n• Specific heat: Energy for 1kg by 1°C";
    }

    if (lower.match(/\b(electron|proton|neutron|nucleus|orbital|valence|isotope|ion)\b/)) {
      return "⚛️ **Atomic Structure**:\n\n**Subatomic Particles**:\n• Proton (+): Nucleus, positive\n• Neutron (0): Nucleus, no charge\n• Electron (-): Orbiting, negative\n\n**Nucleus**: Protons + Neutrons\n\n**Electrons**:\n• Orbit in shells\n• Valence: Outer shell (bonding)\n\n**Isotopes**: Same element, different neutrons\n**Ions**: Atoms with different electrons";
    }

    if (lower.match(/\b(plant|animal|body system|organ|tissue|anatomy|digestion|circulation|nervous)\b/)) {
      return "🫀 **Body Systems & Anatomy**:\n\n**Major Systems**:\n• Digestive: Break down food\n• Circulatory: Heart pumps blood\n• Respiratory: Lungs exchange gases\n• Nervous: Brain controls\n• Muscular: Movement\n• Skeletal: Support\n• Immune: Defense\n\n**Levels**:\nCell → Tissue → Organ → System → Organism\n\n**Plant Parts**:\n• Roots: Absorb water\n• Stems: Transport\n• Leaves: Photosynthesis";
    }

    if (lower.match(/\b(genetics|inheritance|trait|dominant|recessive|mutation|protein|enzyme)\b/)) {
      return "🧪 **Genetics & Heredity**:\n\n**Inheritance**:\n• Traits from parents\n• Dominant: Shows over recessive\n• Punnett square: Predict offspring\n\n**DNA to Protein**:\n1. DNA codon (3 bases)\n2. mRNA carries instructions\n3. tRNA brings amino acids\n4. Protein forms\n\n**Mutations**: DNA changes\n• Can be beneficial/harmful/neutral\n• Drive evolution";
    }

    if (lower.match(/\b(history|ancient|medieval|renaissance|industrial|modern|revolution|war|civilization)\b/)) {
      return "📚 **History Overview**:\n\n**Ancient** (3000-500 BCE):\n• Rise of civilizations (Egypt, Greece, Rome)\n\n**Medieval** (500-1500):\n• Feudalism, kingdoms, castles\n\n**Renaissance** (1300-1600):\n• Learning & art rebirth\n• Exploration begins\n\n**Industrial** (1700s-1800s):\n• Machines replace labor\n• Factory system\n\n**Modern** (1900s-present):\n• World Wars\n• Technology explosion";
    }

    if (lower.match(/\b(science|discovery|invention|scientist|experiment|method)\b/)) {
      return "🔬 **Scientific Method**:\n\n**Steps**:\n1. Question: What to know?\n2. Research: Gather info\n3. Hypothesis: Educated guess\n4. Experiment: Test it\n5. Analyze: Look at results\n6. Conclude: Draw conclusions\n7. Report: Share findings\n\n**Famous Scientists**:\n• Newton: Motion\n• Einstein: Relativity\n• Darwin: Evolution\n• Curie: Radioactivity";
    }

    if (lower.match(/\b(grammar|vocabulary|writing|essay|literature|syntax|punctuation|verb|noun|adjective|adverb)\b/)) {
      return "✍️ **Grammar & Writing**:\n\n**Parts of Speech**:\n• Noun: Person, place, thing\n• Verb: Action or state\n• Adjective: Describes noun\n• Adverb: Describes verb\n• Preposition: Relationship\n\n**Essay Structure**:\n1. Intro: Hook + thesis\n2. Body: 3 paragraphs\n3. Conclusion: Restate\n\n**Writing Tips**:\n• Show, don't tell\n• Vary sentence length\n• Use active voice";
    }

    if (lower.match(/\b(geography|continent|country|capital|map|landform|climate|biome|mountain|ocean)\b/)) {
      return "🌍 **Geography & World**:\n\n**Continents**: 7 (Africa, Antarctica, Asia, Europe, N.America, S.America, Australia)\n\n**Landforms**:\n• Mountains: High\n• Valleys: Low\n• Plains: Flat\n• Deserts: Dry\n• Forests: Dense\n\n**Climate Zones**:\n• Tropical: Hot, wet\n• Temperate: Moderate\n• Polar: Cold\n• Arid: Dry";
    }

    if (lower.match(/\b(economics|supply|demand|market|trade|currency|profit|investment|business)\b/)) {
      return "💰 **Economics Basics**:\n\n**Supply & Demand**:\n• Supply: Available amount\n• Demand: People want\n• Price: Supply + Demand\n• High demand + Low supply = High price\n\n**Market**:\n• Buyers + Sellers\n• Price negotiation\n\n**Money**:\n• Currency: Exchange medium\n• Import: Buy from other\n• Export: Sell to other\n\n**Profit** = Revenue - Costs";
    }

    if (lower.match(/\b(technology|computer|programming|code|software|algorithm|data|internet|digital|binary)\b/)) {
      return "💻 **Technology & Computing**:\n\n**Basics**:\n• Binary: 0s and 1s\n• Code: Computer instructions\n• Algorithm: Step-by-step solution\n• Data: Information\n\n**Computer Parts**:\n• CPU: Brain\n• RAM: Quick memory\n• Storage: Permanent\n• GPU: Graphics\n\n**Internet**:\n• World-wide network\n• IP address: Computer address\n• Cloud: Remote storage";
    }

    if (lower.match(/\b(psychology|behavior|emotion|learning|memory|brain|mind|stress|confidence)\b/)) {
      return "🧠 **Psychology & Learning**:\n\n**Memory Types**:\n• Short-term: ~7 items\n• Long-term: Knowledge storage\n• Working: Active processing\n\n**Learning Methods**:\n• Visual: See\n• Auditory: Hear\n• Kinesthetic: Do\n\n**Study Techniques**:\n• Active recall: Test yourself\n• Spaced repetition: Review\n• Teach others: Explain\n• Chunking: Small parts";
    }

    // Study tips - Direct answers
    if (lower.match(/\b(study|test|exam|learn|homework|assignment|revision|preparation|focus|concentration)\b/)) {
      return "📚 **Study & Learning Tips**:\n\n**Effective Methods**:\n✅ Active Recall: Test yourself\n✅ Spaced Repetition: Review schedule\n✅ Teach Others: Explain aloud\n✅ Mind Maps: Draw connections\n✅ Practice Problems: Apply knowledge\n✅ Pomodoro: 25 min + 5 min break\n✅ Sleep: Consolidates memory\n✅ Chunking: Break into parts\n\n**Before Exams**: Start weeks ahead, review, do practice tests, sleep, eat healthy";
    }

    // Capabilities - Direct answer
    if (lower.match(/\b(can you|what can|help with|capable|able)\b/)) {
      return "🤖 **I can help with:**\n📚 **Subjects**: Math, Physics, Chemistry, Biology, History, Geography, Economics\n✍️ **Writing**: Grammar, essays, literature, vocabulary\n🧠 **Learning**: Study techniques, memory tips, test prep\n💡 **Concepts**: Any educational topic\n💻 **Technology**: Basic programming, Internet\n\nAsk me anything specific!";
    }

    // General questions - comprehensive catch-all
    if (lower.match(/\b(what|how|why|explain|tell|teach|help|question)\b/)) {
      return "📖 **I can explain:**\n\n📚 **Subjects**: Math (Algebra, Calculus, Geometry, Statistics)\n🔬 **Science**: Physics, Chemistry, Biology\n📖 **History**, **Geography**, **Economics**\n✍️ **Writing & Grammar**\n🧠 **Study strategies**\n💻 **Technology basics**\n🎯 **Any educational concept**\n\nWhat's your question?";
    }

    // Thanks/gratitude
    if (lower.match(/\b(thanks|thank you|appreciate|grateful)\b/)) {
      return "😊 You're welcome! Keep learning and ask me anything else!";
    }

    // Confusion support
    if (lower.match(/\b(don't understand|not understand|confused|stuck|difficult|hard|challenge)\b/)) {
      return "💪 **No problem! Learning takes time.**\n\nTell me:\n1. What topic or subject?\n2. What part is confusing?\n3. What have you tried?\n\nI'll explain it step-by-step until you get it!";
    }

    // Default - comprehensive fallback
    return "✨ **I'm your AI tutor!**\n\nI can help with:\n📚 Any school subject\n🔬 Science, math, history\n✍️ Writing & grammar\n🧠 Study tips\n💡 Explain concepts\n\n**Ask me anything!**";
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <View>
          <Text style={styles.title}>AI Tutor</Text>
          <Text style={styles.subtitle}>Your personal learning assistant</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {item.sender === 'ai' && <Text style={styles.aiAvatar}>🤖</Text>}
            <View style={[
              styles.messageContent,
              item.sender === 'user' && styles.userMessageContent,
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'user' && styles.userMessageText,
              ]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.aiAvatar}>🤖</Text>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendMessage(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  headerIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    fontSize: 24,
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    maxWidth: '80%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageContent: {
    backgroundColor: '#007bff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  typingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  suggestionText: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#9ca3af' },
  sendIcon: { fontSize: 20 },
});
