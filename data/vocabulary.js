/*
 * VĀRDU KRĀJUMS / VOCABULARY DATA
 * ---------------------------------------------------------------
 * Šeit glabājas visi vārdiņi. Katra "tēma" (unit) satur vārdu sarakstu.
 *
 * Katram vārdam ir šādi lauki:
 *   word        – angļu vārds vai frāze (obligāts)
 *   pos         – vārda šķira: noun, verb, adjective, adverb, phrase ... (ieteicams)
 *   meaning     – definīcija angļu valodā (obligāts)
 *   example     – piemēra teikums, kurā vārds ir lietots (ieteicams;
 *                 no tā automātiski veido "ieraksti trūkstošo vārdu" jautājumus)
 *   translation – tulkojums latviski (nav obligāts)
 *   usage       – papildu skaidrojums par lietojumu angliski (nav obligāts;
 *                 tiek parādīts, ja atbilde ir nepareiza)
 *
 * Papildus var pievienot gatavus jautājumus tēmas laukā "questions":
 *   { question: "...", options: ["a","b","c","d"], answer: "b", explanation: "..." }
 *
 * PAŠREIZĒJAIS SATURS IR TIKAI PARAUGS – to aizstās vārdi no mācību materiāliem.
 */
window.VOCABULARY = {
  units: [
    {
      id: "sample",
      title: "Paraugs · Sample unit",
      description: "Demonstrācijas vārdi – tiks aizstāti ar jūsu materiāliem",
      words: [
        {
          word: "reliable",
          pos: "adjective",
          meaning: "able to be trusted to do something well or to behave as expected",
          example: "My old car is still very reliable.",
          translation: "uzticams",
          usage: "Collocations: a reliable friend / source / method. Opposite: unreliable. The noun is 'reliability'."
        },
        {
          word: "achieve",
          pos: "verb",
          meaning: "to succeed in doing or getting something after a lot of effort",
          example: "She worked hard to achieve her goals.",
          translation: "sasniegt",
          usage: "We achieve goals, success, results or an aim. The noun is 'achievement'. Don't confuse with 'receive' (to get something that is given to you)."
        },
        {
          word: "borrow",
          pos: "verb",
          meaning: "to take and use something that belongs to someone else, and return it later",
          example: "Can I borrow your pen for a minute?",
          translation: "aizņemties",
          usage: "You BORROW something FROM someone; someone LENDS something TO you. 'Can I borrow your pen?' = 'Can you lend me your pen?'"
        },
        {
          word: "lend",
          pos: "verb",
          meaning: "to give something to someone for a short time, expecting it to be given back",
          example: "Could you lend me ten euros until Friday?",
          translation: "aizdot",
          usage: "Past forms: lend – lent – lent. Pattern: lend somebody something / lend something to somebody."
        },
        {
          word: "convenient",
          pos: "adjective",
          meaning: "suitable for your plans and needs; easy to use or reach",
          example: "The shop is in a convenient location near the station.",
          translation: "ērts, piemērots",
          usage: "Used about times, places and methods: 'Is 5 o'clock convenient for you?' Not used for comfortable clothes or chairs – there we say 'comfortable'."
        },
        {
          word: "comfortable",
          pos: "adjective",
          meaning: "making you feel physically relaxed, without pain or discomfort",
          example: "This sofa is really comfortable.",
          translation: "ērts (fiziski)",
          usage: "Used about furniture, clothes, shoes, rooms and feelings: 'I feel comfortable here.' For a suitable time or place, use 'convenient'."
        },
        {
          word: "rarely",
          pos: "adverb",
          meaning: "not often; almost never",
          example: "We rarely go to the cinema these days.",
          translation: "reti",
          usage: "Adverbs of frequency usually go before the main verb but after 'be': 'He is rarely late.' Similar: seldom, hardly ever."
        },
        {
          word: "decrease",
          pos: "verb",
          meaning: "to become smaller in size, number or amount",
          example: "Prices usually decrease after the holidays.",
          translation: "samazināties",
          usage: "Opposite: increase. As a noun the stress moves: a DEcrease (noun) vs. to deCREASE (verb)."
        },
        {
          word: "look forward to",
          pos: "phrasal verb",
          meaning: "to feel happy and excited about something that is going to happen",
          example: "I look forward to hearing from you.",
          translation: "ar nepacietību gaidīt",
          usage: "'To' here is a preposition, so it is followed by a noun or an -ing form: 'I look forward to seeing you' (NOT 'to see you')."
        },
        {
          word: "argue",
          pos: "verb",
          meaning: "to speak angrily to someone because you disagree with them",
          example: "The children always argue about who sits in the front seat.",
          translation: "strīdēties",
          usage: "Patterns: argue WITH somebody ABOUT something. The noun is 'argument'."
        }
      ],
      questions: [
        {
          question: "Choose the correct sentence.",
          options: [
            "Can you borrow me your bike?",
            "Can you lend me your bike?",
            "Can I lend your bike?",
            "Can you borrow your bike to me?"
          ],
          answer: "Can you lend me your bike?",
          explanation: "The owner LENDS something TO another person; the other person BORROWS it FROM the owner. So: 'Can you lend me your bike?' or 'Can I borrow your bike?'"
        }
      ]
    }
  ]
};
