/*
 * VĀRDU KRĀJUMS / VOCABULARY DATA  (avots: "Stage 3 student.pdf")
 * ---------------------------------------------------------------
 * Katram vārdam:
 *   word        – angļu vārds vai frāze (obligāts)
 *   pos         – vārda šķira: noun, verb, adjective ... (nav obligāts)
 *   explanation – vārda skaidrojums angliski (obligāts)
 *   example     – piemēra teikums (nav obligāts)
 *   translation – tulkojums latviski (nav obligāts)
 *   qa          – jautājumi un atbildes no mācību materiāla:
 *                 [{ q: "jautājums", a: "atbilde" }, ...]
 *
 * PAŠREIZĒJAIS SATURS IR PARAUGS – tiks aizstāts ar vārdiem no "Stage 3 student.pdf".
 */
window.VOCABULARY = {
  source: "Paraugs (sample) – gaida Stage 3 student.pdf",
  words: [
    {
      word: "push",
      pos: "verb",
      explanation: "to press against something with your hand or body so that it moves away from you",
      example: "Push the door to open it.",
      translation: "stumt, spiest",
      qa: [
        { q: "What do you do to a door that says “PUSH”?", a: "I push it to open it." },
        { q: "What's the opposite of push?", a: "The opposite of push is pull." }
      ]
    },
    {
      word: "pull",
      pos: "verb",
      explanation: "to hold something and move it towards you",
      example: "Pull the chair closer to the table.",
      translation: "vilkt",
      qa: [
        { q: "What do you do when you open a drawer?", a: "I pull it towards me." },
        { q: "Do you push or pull a dog's lead when you walk it?", a: "The dog pulls the lead, and I pull it back." }
      ]
    },
    {
      word: "borrow",
      pos: "verb",
      explanation: "to take and use something that belongs to someone else, and give it back later",
      example: "Can I borrow your pen?",
      translation: "aizņemties",
      qa: [
        { q: "What do you say when you want to use someone's pen for a moment?", a: "Can I borrow your pen, please?" },
        { q: "Where can you borrow books?", a: "You can borrow books from a library." }
      ]
    },
    {
      word: "lend",
      pos: "verb",
      explanation: "to give something to someone for a short time, expecting to get it back",
      example: "Could you lend me ten euros?",
      translation: "aizdot",
      qa: [
        { q: "What's the difference between lend and borrow?", a: "I lend something to you, and you borrow something from me." },
        { q: "What's the past tense of lend?", a: "The past tense of lend is lent." }
      ]
    },
    {
      word: "early",
      pos: "adjective / adverb",
      explanation: "before the usual or expected time",
      example: "I get up early on weekdays.",
      translation: "agri",
      qa: [
        { q: "What's the opposite of early?", a: "The opposite of early is late." },
        { q: "Do you get up early in the morning?", a: "Yes, I get up early, at six o'clock." }
      ]
    },
    {
      word: "between",
      pos: "preposition",
      explanation: "in the space that separates two things or people",
      example: "The letter B is between A and C.",
      translation: "starp",
      qa: [
        { q: "What letter is between A and C?", a: "The letter B is between A and C." },
        { q: "What day is between Monday and Wednesday?", a: "Tuesday is between Monday and Wednesday." }
      ]
    }
  ]
};
