export const PHONICS_STAGES = [
  {
    id: "letter_a",
    title: "알파벳 A의 비밀",
    targetSound: "a",
    subTitle: "두 가지 소리 규칙",
    steps: [
      {
        type: "explanation",
        emotion: "waving",
        title: "안녕, 친구들!",
        subtitle: "A와의 첫 만남",
        dialogue: "오늘 라온이랑 같이 알파벳의 첫 번째 대장, 'A'가 어떤 소리를 내는지 재미있게 알아볼까요?",
        details: ["알파벳 'A'는 사실 아주 변신을 잘하는 친구예요. 상황에 따라 크게 두 가지 소리를 낸답니다. 왜 그런 소리가 나는지 이유도 함께 설명해 줄게요!"]
      },
      {
        type: "explanation",
        emotion: "explaining",
        title: "1. 입을 크게 벌리는 '애!'",
        subtitle: "단모음 a",
        dialogue: "가장 먼저 배우는 'A'의 기본 소리는 [æ], 우리말로 하면 '애!' 소리예요.",
        details: [
          "🍎 어떤 소리인가요?\n사과를 한입 크게 '아삭!' 베어 물 때처럼 입을 옆으로, 아래로 크게 벌리고 '애!'라고 소리 내보세요.",
          "📍 언제 이 소리가 나나요?\n주로 단어 중간에 'A' 혼자 있을 때 이런 소리가 나요."
        ]
      },
      { type: "word", emotion: "happy", word: "ant",  meaning: "개미",   phonetic: "ænt",  emoji: "🐜" },
      { type: "word", emotion: "happy", word: "cat",  meaning: "고양이", phonetic: "kæt",    emoji: "🐱" },
      { type: "word", emotion: "happy", word: "hat",  meaning: "모자",   phonetic: "hæt",    emoji: "🎩" },
      {
        type: "explanation",
        emotion: "magic",
        title: "2. 자기 이름을 말하는 '에이~'",
        subtitle: "장모음 a (매직 e)",
        dialogue: "두 번째는 'A'가 자기 이름 그대로 '에이'라고 소리 내는 경우예요.",
        details: [
          "🪄 이유가 무엇인가요? (매직 e의 마법!)\n단어 끝에 친구인 'e'가 붙으면 마법이 일어나요! 끝에 있는 'e'는 소리를 내지 않는 대신, 앞에 있는 'A'에게 힘을 빡! 빌려줘요. 그러면 'A'는 기운이 나서 자기 이름인 '에이!'를 당당하게 외치게 된답니다."
        ]
      },
      { type: "word", emotion: "proud", word: "cake", meaning: "케이크", phonetic: "keɪk", emoji: "🎂" },
      { type: "word", emotion: "proud", word: "game", meaning: "게임",   phonetic: "ɡeɪm",   emoji: "🎮" },
      { type: "word", emotion: "proud", word: "tape", meaning: "테이프", phonetic: "teɪp", emoji: "📼" },
{
        type: "summary",
        emotion: "cheering",
        title: "💡 라온이의 요약 정리!",
        dialogue: "우와! 오늘 정말 많은 걸 배웠네요. 마지막으로 정리해 볼까요?",
        summaryTable: [
          { 
            situation: "A 혼자 있을 때", 
            sound: "애!", 
            reason: "입을 크게 벌려요.", 
            example: "ant / cat / hat"
          },
          { 
            situation: "끝에 e가 올 때", 
            sound: "에이~", 
            reason: "매직 e가 A에게 힘을 빌려줘요!", 
            example: "cake / game / tape"
          }
        ],
        outro: "우리 친구들, 이제 길에서 'A'를 만나면 \"안녕! 너 지금은 '애'라고 할 거니, 아니면 '에이'라고 할 거니?\" 하고 물어봐 줄 수 있겠죠?"
      },
      { 
        type: "quiz",
        extraQuizWords: [
          { emotion: "happy", word: "bat",  meaning: "박쥐",     phonetic: "bæt",   emoji: "🦇" },
          { emotion: "happy", word: "cap",  meaning: "모자",     phonetic: "kæp",   emoji: "🧢" },
          { emotion: "happy", word: "pan",  meaning: "프라이팬", phonetic: "pæn",   emoji: "🍳" },
          { emotion: "happy", word: "jam",  meaning: "잼",       phonetic: "dʒæm",  emoji: "🍓" },
          { emotion: "happy", word: "map",  meaning: "지도",     phonetic: "mæp",   emoji: "🗺️" },
          { emotion: "proud", word: "lake",  meaning: "호수",   phonetic: "leɪk",  emoji: "🏞️" },
          { emotion: "proud", word: "grape", meaning: "포도",   phonetic: "ɡreɪp", emoji: "🍇" },
          { emotion: "proud", word: "snake", meaning: "뱀",     phonetic: "sneɪk", emoji: "🐍" },
          { emotion: "proud", word: "plane", meaning: "비행기", phonetic: "pleɪn", emoji: "✈️" },
          { emotion: "proud", word: "whale", meaning: "고래",   phonetic: "weɪl",  emoji: "🐋" }
        ]
      }
    ]
  }
];