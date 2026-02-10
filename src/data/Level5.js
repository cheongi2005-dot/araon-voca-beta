export const DAY_TITLES = {
    1: "인지 및 사고", 2: "철학 및 가치", 3: "심리 및 감정", 4: "언어 및 소통", 5: "사회 구조 및 상호작용",
    6: "경제 기초 및 자원", 7: "비즈니스 및 금융", 8: "법과 정의", 9: "정치 및 통치", 10: "사회 변화 및 인구",
    11: "과학 탐구 및 방법론", 12: "생명 과학 및 유전", 13: "물리 및 에너지", 14: "화학 및 물질", 15: "지구과학 및 기상",
    16: "천문 및 우주", 17: "정보 기술 및 미래", 18: "예술 및 미학", 19: "역사 및 고고학", 20: "의학 및 보건",
    21: "환경 및 생태계", 22: "교육 및 학문", 23: "노동 및 직업", 24: "행동 및 성향", 25: "추상 형용사 및 상태",
    26: "핵심 다의어 1", 27: "핵심 다의어 2", 28: "혼동하기 쉬운 어휘", 29: "논리 연결어", 30: "고난도 학술 동사"
};
export const DATA_BY_DAY = {
  // [Day 1] 인지 및 사고
  1: [
    { word: "perceive", meaning: "인지하다, 감지하다" }, { word: "cognitive", meaning: "인지의, 인식의" }, { word: "intuition", meaning: "직관, 직감" }, { word: "bias", meaning: "편견, 선입견" }, { word: "subjective", meaning: "주관적인" },
    { word: "objective", meaning: "객관적인, 목표" }, { word: "perspective", meaning: "관점, 시각" }, { word: "rationalize", meaning: "합리화하다" }, { word: "consciousness", meaning: "의식, 자각" }, { word: "abstract", meaning: "추상적인" },
    { word: "concrete", meaning: "구체적인" }, { word: "premise", meaning: "전제" }, { word: "deduction", meaning: "연역, 추론" }, { word: "induction", meaning: "귀납, 유도" }, { word: "validity", meaning: "타당성, 유효성" },
    { word: "fallacy", meaning: "오류, 틀린 생각" }, { word: "paradox", meaning: "역설" }, { word: "contemplate", meaning: "심사숙고하다" }, { word: "insight", meaning: "통찰력, 식견" }, { word: "manifest", meaning: "나타내다, 명백한" },
    { word: "inherent", meaning: "내재하는, 타고난" }, { word: "intrinsic", meaning: "본질적인, 고유한" }, { word: "extrinsic", meaning: "외적인, 비본질적인" }, { word: "innate", meaning: "타고난, 선천적인" }, { word: "sophisticated", meaning: "세련된, 정교한" },
    { word: "obscure", meaning: "모호한, 무명의" }, { word: "explicit", meaning: "명백한, 노골적인" }, { word: "implicit", meaning: "암시된, 내포된" }, { word: "ambiguous", meaning: "애매모호한" }, { word: "vague", meaning: "막연한, 희미한" },
    { word: "lucid", meaning: "명쾌한, 맑은" }, { word: "coherent", meaning: "일관성 있는" }, { word: "contradictory", meaning: "모순되는" }, { word: "notion", meaning: "개념, 관념" }, { word: "speculate", meaning: "추측하다, 투기하다" },
    { word: "verify", meaning: "증명하다, 확인하다" }, { word: "analyze", meaning: "분석하다" }, { word: "synthesize", meaning: "통합하다, 합성하다" }, { word: "empirical", meaning: "경험적인, 실증적인" }, { word: "skeptical", meaning: "회의적인" }
  ],
  // [Day 2] 철학 및 가치
  2: [
    { word: "ethics", meaning: "윤리학, 도덕" }, { word: "morality", meaning: "도덕성" }, { word: "virtue", meaning: "미덕, 장점" }, { word: "dilemma", meaning: "딜레마, 궁지" }, { word: "altruism", meaning: "이타주의" },
    { word: "egoism", meaning: "이기주의" }, { word: "utilitarian", meaning: "공리주의의" }, { word: "aesthetic", meaning: "미학의, 심미적인" }, { word: "existence", meaning: "존재, 생존" }, { word: "mortality", meaning: "죽을 운명, 사망률" },
    { word: "destiny", meaning: "운명" }, { word: "doctrine", meaning: "교리, 신조" }, { word: "dogma", meaning: "독단, 교조" }, { word: "fundamental", meaning: "근본적인" }, { word: "secular", meaning: "세속적인" },
    { word: "sacred", meaning: "신성한" }, { word: "spiritual", meaning: "정신적인, 영적인" }, { word: "material", meaning: "물질적인, 재료" }, { word: "ideology", meaning: "이데올로기, 관념" }, { word: "pluralism", meaning: "다원주의" },
    { word: "skeptic", meaning: "회의론자" }, { word: "transcendental", meaning: "초월적인" }, { word: "nihilism", meaning: "허무주의" }, { word: "stoic", meaning: "금욕적인" }, { word: "cynical", meaning: "냉소적인" },
    { word: "radical", meaning: "급진적인" }, { word: "conservative", meaning: "보수적인" }, { word: "progressive", meaning: "진보적인" }, { word: "worldview", meaning: "세계관" }, { word: "enlightenment", meaning: "계몽, 깨달음" },
    { word: "integrity", meaning: "정직, 고결함" }, { word: "dignity", meaning: "존엄성" }, { word: "justice", meaning: "정의" }, { word: "equity", meaning: "형평성, 공정" }, { word: "fairness", meaning: "공정함" },
    { word: "conviction", meaning: "확신, 유죄 판결" }, { word: "aspiration", meaning: "열망, 포부" }, { word: "benevolence", meaning: "자비심, 박애" }, { word: "conscience", meaning: "양심" }, { word: "reverence", meaning: "숭배, 경의" }
  ],
  // [Day 3] 심리 및 감정
  3: [
    { word: "empathy", meaning: "공감" }, { word: "sympathy", meaning: "동정, 공감" }, { word: "compassion", meaning: "연민, 자애" }, { word: "resentment", meaning: "분노, 분개" }, { word: "temperament", meaning: "기질, 성질" },
    { word: "anxiety", meaning: "불안, 걱정" }, { word: "depression", meaning: "우울, 불경기" }, { word: "trauma", meaning: "정신적 외상" }, { word: "subconscious", meaning: "잠재의식의" }, { word: "defense", meaning: "방어" },
    { word: "mechanism", meaning: "기제, 구조" }, { word: "complex", meaning: "복잡한, 콤플렉스" }, { word: "projection", meaning: "투사, 투영" }, { word: "fixation", meaning: "집착, 고정" }, { word: "stimulus", meaning: "자극" },
    { word: "response", meaning: "반응" }, { word: "conditioning", meaning: "조건 형성" }, { word: "habituate", meaning: "습관화하다" }, { word: "motivation", meaning: "동기 부여" }, { word: "obsession", meaning: "강박, 집착" },
    { word: "impulse", meaning: "충동" }, { word: "restraint", meaning: "억제, 자제" }, { word: "inhibition", meaning: "억제, 금지" }, { word: "gratification", meaning: "만족, 희열" }, { word: "fulfillment", meaning: "성취, 이행" },
    { word: "self-esteem", meaning: "자존감" }, { word: "Narcissism", meaning: "자기애" }, { word: "extrovert", meaning: "외향적인 사람" }, { word: "introvert", meaning: "내향적인 사람" }, { word: "trait", meaning: "특성" },
    { word: "characteristic", meaning: "특징" }, { word: "aptitude", meaning: "적성" }, { word: "orientation", meaning: "성향, 방향" }, { word: "dissonance", meaning: "부조화" }, { word: "stereotype", meaning: "고정관념" },
    { word: "prejudice", meaning: "편견" }, { word: "phobia", meaning: "공포증" }, { word: "hysteria", meaning: "히스테리" }, { word: "sentiment", meaning: "정서, 감정" }, { word: "euphoria", meaning: "행복감, 희열" }
  ],
  // [Day 4] 언어 및 소통
  4: [
    { word: "articulate", meaning: "명확하게 말하다" }, { word: "rhetoric", meaning: "수사학, 미사여구" }, { word: "eloquent", meaning: "유창한, 설득력 있는" }, { word: "convey", meaning: "전달하다" }, { word: "interpret", meaning: "해석하다, 통역하다" },
    { word: "transmit", meaning: "전송하다, 전염시키다" }, { word: "proclaim", meaning: "선언하다, 공포하다" }, { word: "advocate", meaning: "옹호하다, 지지자" }, { word: "elaborate", meaning: "정교한, 상세히 설명하다" }, { word: "clarify", meaning: "명확하게 하다" },
    { word: "illustrate", meaning: "설명하다, 삽화를 넣다" }, { word: "emphasize", meaning: "강조하다" }, { word: "reinforce", meaning: "강화하다" }, { word: "refute", meaning: "반박하다" }, { word: "contradict", meaning: "모순되다, 부정하다" },
    { word: "dispute", meaning: "분쟁, 논쟁하다" }, { word: "controversy", meaning: "논란" }, { word: "consensus", meaning: "합의, 일치" }, { word: "dialogue", meaning: "대화" }, { word: "discourse", meaning: "담론, 강연" },
    { word: "narrative", meaning: "이야기, 서사" }, { word: "context", meaning: "맥락, 문맥" }, { word: "precise", meaning: "정확한" }, { word: "concise", meaning: "간결한" }, { word: "wordy", meaning: "장황한" },
    { word: "literal", meaning: "글자 그대로의" }, { word: "figurative", meaning: "비유적인" }, { word: "metaphor", meaning: "은유, 비유" }, { word: "analogy", meaning: "비유, 유추" }, { word: "irony", meaning: "반어법" },
    { word: "subtle", meaning: "미묘한" }, { word: "nuance", meaning: "뉘앙스, 미세한 차이" }, { word: "terminology", meaning: "전문 용어" }, { word: "jargon", meaning: "은어, 특수 용어" }, { word: "dialect", meaning: "방언, 사투리" },
    { word: "accent", meaning: "억양, 강조" }, { word: "fluency", meaning: "유창함" }, { word: "literacy", meaning: "읽고 쓰는 능력" }, { word: "utterance", meaning: "발언, 발화" }, { word: "feedback", meaning: "피드백, 반응" }
  ],
  // [Day 5] 사회 구조 및 상호작용
  5: [
    { word: "alienation", meaning: "소외" }, { word: "isolation", meaning: "고립" }, { word: "conform", meaning: "순응하다" }, { word: "rebel", meaning: "반항하다" }, { word: "ostracize", meaning: "배척하다" },
    { word: "discriminate", meaning: "차별하다" }, { word: "persecute", meaning: "박해하다" }, { word: "integrate", meaning: "통합하다" }, { word: "assimilate", meaning: "동화되다" }, { word: "accommodate", meaning: "수용하다" },
    { word: "compromise", meaning: "타협하다" }, { word: "negotiate", meaning: "협상하다" }, { word: "reconcile", meaning: "화해시키다" }, { word: "harmonize", meaning: "조화시키다" }, { word: "friction", meaning: "마찰" },
    { word: "conflict", meaning: "갈등" }, { word: "stability", meaning: "안정성" }, { word: "turbulence", meaning: "격동, 난기류" }, { word: "status quo", meaning: "현재의 상황" }, { word: "hierarchy", meaning: "계급제, 위계" },
    { word: "prestige", meaning: "위신, 명성" }, { word: "reputation", meaning: "평판" }, { word: "honor", meaning: "명예" }, { word: "shame", meaning: "수치심" }, { word: "stigma", meaning: "오명, 낙인" },
    { word: "norm", meaning: "규범, 표준" }, { word: "convention", meaning: "관습, 집회" }, { word: "tradition", meaning: "전통" }, { word: "ritual", meaning: "의식" }, { word: "solidarity", meaning: "연대, 결속" },
    { word: "cohesion", meaning: "결속력" }, { word: "bond", meaning: "유대, 채권" }, { word: "kinship", meaning: "친족 관계" }, { word: "peer", meaning: "동료, 또래" }, { word: "superior", meaning: "상급의, 우월한" },
    { word: "inferior", meaning: "하급의, 열등한" }, { word: "mentor", meaning: "멘토, 스승" }, { word: "protege", meaning: "제자, 피보호자" }, { word: "authority", meaning: "권위, 당국" }, { word: "legitimacy", meaning: "정당성" }
  ],
  // [Day 6] 경제 기초 및 자원
  6: [
    { word: "inflation", meaning: "인플레이션, 물가 상승" }, { word: "deflation", meaning: "디플레이션, 물가 하락" }, { word: "recession", meaning: "경기 후퇴" }, { word: "depression", meaning: "불황, 우울" }, { word: "surplus", meaning: "잉여, 흑자" },
    { word: "deficit", meaning: "적자" }, { word: "commodity", meaning: "상품, 원자재" }, { word: "capital", meaning: "자본, 수도" }, { word: "labor", meaning: "노동" }, { word: "entrepreneur", meaning: "기업가" },
    { word: "investment", meaning: "투자" }, { word: "asset", meaning: "자산" }, { word: "liability", meaning: "부채, 법적 책임" }, { word: "debt", meaning: "빚, 부채" }, { word: "revenue", meaning: "수입, 세입" },
    { word: "profit", meaning: "이익" }, { word: "yield", meaning: "산출하다, 굴복하다" }, { word: "interest", meaning: "이자, 관심" }, { word: "exchange", meaning: "교환, 환율" }, { word: "currency", meaning: "통화, 화폐" },
    { word: "fiscal", meaning: "재정의" }, { word: "monetary", meaning: "금융의, 화폐의" }, { word: "incentive", meaning: "장려책" }, { word: "scarcity", meaning: "부족, 결핍" }, { word: "allocation", meaning: "배분, 할당" },
    { word: "equilibrium", meaning: "평형, 균형" }, { word: "demand", meaning: "수요" }, { word: "supply", meaning: "공급" }, { word: "utility", meaning: "효용, 공공사업" }, { word: "elasticity", meaning: "탄력성" },
    { word: "monopoly", meaning: "독점" }, { word: "oligopoly", meaning: "과점" }, { word: "competition", meaning: "경쟁" }, { word: "efficiency", meaning: "효율성" }, { word: "equity", meaning: "형평성, 보통주" },
    { word: "subsidy", meaning: "보조금" }, { word: "tariff", meaning: "관세" }, { word: "quota", meaning: "할당량" }, { word: "regulation", meaning: "규제" }, { word: "privatization", meaning: "민영화" }
  ],
  // [Day 7] 비즈니스 및 금융
  7: [
    { word: "bankruptcy", meaning: "파산" }, { word: "insolvency", meaning: "지불 불능" }, { word: "liquidation", meaning: "청산" }, { word: "venture", meaning: "모험, 벤처 사업" }, { word: "startup", meaning: "신생 기업" },
    { word: "franchise", meaning: "가맹점, 독점 판매권" }, { word: "corporation", meaning: "법인, 기업" }, { word: "conglomerate", meaning: "복합 기업" }, { word: "subsidiary", meaning: "자회사" }, { word: "merger", meaning: "합병" },
    { word: "acquisition", meaning: "인수, 획득" }, { word: "dividend", meaning: "배당금" }, { word: "stock", meaning: "주식, 재고" }, { word: "bond", meaning: "채권, 유대" }, { word: "portfolio", meaning: "포트폴리오" },
    { word: "security", meaning: "보안, 증권" }, { word: "derivative", meaning: "파생 상품" }, { word: "mortgage", meaning: "담보 대출" }, { word: "insurance", meaning: "보험" }, { word: "premium", meaning: "보험료, 할증료" },
    { word: "marketing", meaning: "마케팅" }, { word: "brand", meaning: "브랜드" }, { word: "loyalty", meaning: "충성도" }, { word: "target", meaning: "목표" }, { word: "demographic", meaning: "인구 통계학의" },
    { word: "segment", meaning: "부분, 조각" }, { word: "consumer", meaning: "소비자" }, { word: "retail", meaning: "소매" }, { word: "wholesale", meaning: "도매" }, { word: "inventory", meaning: "재고" },
    { word: "logistics", meaning: "물류" }, { word: "distribution", meaning: "유통, 배분" }, { word: "chain", meaning: "연쇄, 체인점" }, { word: "trade", meaning: "무역" }, { word: "export", meaning: "수출" },
    { word: "import", meaning: "수입" }, { word: "deficit", meaning: "적자" }, { word: "transaction", meaning: "거래" }, { word: "negotiation", meaning: "협상" }, { word: "strategy", meaning: "전략" }
  ],
  // [Day 8] 법과 정의
  8: [
    { word: "legislation", meaning: "입법, 법률" }, { word: "statute", meaning: "법규, 제정법" }, { word: "ordinance", meaning: "조례" }, { word: "constitutional", meaning: "헌법의" }, { word: "judicial", meaning: "사법의" },
    { word: "legislative", meaning: "입법의" }, { word: "executive", meaning: "행정의, 중역" }, { word: "litigation", meaning: "소송" }, { word: "lawsuit", meaning: "소송, 고소" }, { word: "plaintiff", meaning: "원고" },
    { word: "defendant", meaning: "피고" }, { word: "attorney", meaning: "변호사" }, { word: "counsel", meaning: "조언, 변호인" }, { word: "verdict", meaning: "판결" }, { word: "sentence", meaning: "문장, 형벌" },
    { word: "conviction", meaning: "확신, 유죄 판결" }, { word: "acquittal", meaning: "무죄 선고" }, { word: "testimony", meaning: "증언" }, { word: "witness", meaning: "목격자, 증인" }, { word: "evidence", meaning: "증거" },
    { word: "proof", meaning: "증거, 증명" }, { word: "validity", meaning: "유효성, 타당성" }, { word: "precedent", meaning: "선례" }, { word: "legacy", meaning: "유산" }, { word: "mandate", meaning: "권한, 명령" },
    { word: "sanction", meaning: "제재, 허가" }, { word: "prohibition", meaning: "금지" }, { word: "restriction", meaning: "제한" }, { word: "obligation", meaning: "의무" }, { word: "liability", meaning: "법적 책임" },
    { word: "duty", meaning: "의무, 관세" }, { word: "right", meaning: "권리, 오른쪽" }, { word: "liberty", meaning: "자유" }, { word: "equality", meaning: "평등" }, { word: "justice", meaning: "정의" },
    { word: "fairness", meaning: "공정함" }, { word: "penalty", meaning: "처벌, 위약금" }, { word: "fine", meaning: "벌금, 좋은" }, { word: "imprisonment", meaning: "투옥" }, { word: "rehabilitation", meaning: "재활, 복권" }
  ],
  // [Day 9] 정치 및 통치
  9: [
    { word: "sovereignty", meaning: "주권" }, { word: "democracy", meaning: "민주주의" }, { word: "republic", meaning: "공화국" }, { word: "monarchy", meaning: "군주제" }, { word: "autocracy", meaning: "독재 정치" },
    { word: "bureaucracy", meaning: "관료주의" }, { word: "administration", meaning: "관리, 행정부" }, { word: "cabinet", meaning: "내각, 장식장" }, { word: "congress", meaning: "의회" }, { word: "parliament", meaning: "의회" },
    { word: "senate", meaning: "상원" }, { word: "representative", meaning: "대표자" }, { word: "constituent", meaning: "유권자, 성분" }, { word: "electorate", meaning: "유권자 전체" }, { word: "ballot", meaning: "투표" },
    { word: "election", meaning: "선거" }, { word: "primary", meaning: "예비 선거, 주요한" }, { word: "campaign", meaning: "캠페인, 선거 운동" }, { word: "platform", meaning: "공약, 승강장" }, { word: "policy", meaning: "정책" },
    { word: "reform", meaning: "개혁" }, { word: "revolution", meaning: "혁명" }, { word: "rebellion", meaning: "반란" }, { word: "regime", meaning: "정권" }, { word: "dictatorship", meaning: "독재" },
    { word: "tyranny", meaning: "폭정, 독재" }, { word: "corruption", meaning: "부패" }, { word: "transparency", meaning: "투명성" }, { word: "accountability", meaning: "책임" }, { word: "patriotism", meaning: "애국심" },
    { word: "nationalism", meaning: "민족주의" }, { word: "diplomacy", meaning: "외교" }, { word: "ambassador", meaning: "대사" }, { word: "treaty", meaning: "조약" }, { word: "alliance", meaning: "동맹" },
    { word: "neutral", meaning: "중립의" }, { word: "conflict", meaning: "갈등" }, { word: "resolution", meaning: "해결, 결의" }, { word: "arbitration", meaning: "중재" }, { word: "compromise", meaning: "타협" }
  ],
  // [Day 10] 사회 변화 및 인구
  10: [
    { word: "demographic", meaning: "인구 통계학의" }, { word: "census", meaning: "인구 조사" }, { word: "migration", meaning: "이주" }, { word: "immigration", meaning: "이민" }, { word: "emigration", meaning: "타국으로의 이주" },
    { word: "urban", meaning: "도시의" }, { word: "rural", meaning: "시골의" }, { word: "suburban", meaning: "교외의" }, { word: "gentrification", meaning: "젠트리피케이션" }, { word: "globalization", meaning: "세계화" },
    { word: "localization", meaning: "현지화" }, { word: "modernization", meaning: "현대화" }, { word: "secularization", meaning: "세속화" }, { word: "pluralism", meaning: "다원주의" }, { word: "diversity", meaning: "다양성" },
    { word: "inclusion", meaning: "포함, 포용" }, { word: "inequality", meaning: "불평등" }, { word: "poverty", meaning: "가난" }, { word: "welfare", meaning: "복지" }, { word: "security", meaning: "보안, 안보" },
    { word: "infrastructure", meaning: "사회 기반 시설" }, { word: "transportation", meaning: "교통수단" }, { word: "media", meaning: "매체" }, { word: "censorship", meaning: "검열" }, { word: "propaganda", meaning: "선전" },
    { word: "information", meaning: "정보" }, { word: "knowledge", meaning: "지식" }, { word: "technology", meaning: "기술" }, { word: "innovation", meaning: "혁신" }, { word: "paradigm", meaning: "패러다임, 틀" },
    { word: "shift", meaning: "변화, 이동" }, { word: "transition", meaning: "전환" }, { word: "evolution", meaning: "진화" }, { word: "progress", meaning: "진보" }, { word: "development", meaning: "발달, 발전" },
    { word: "sustainability", meaning: "지속 가능성" }, { word: "conservation", meaning: "보존" }, { word: "ecology", meaning: "생태학" }, { word: "environment", meaning: "환경" }, { word: "transformation", meaning: "변모, 변형" }
  ],
  // [Day 11] 과학 탐구 및 방법론
  11: [
    { word: "phenomenon", meaning: "현상" }, { word: "variable", meaning: "변수" }, { word: "constant", meaning: "상수, 일정한" }, { word: "prototype", meaning: "시제품, 원형" }, { word: "apparatus", meaning: "기구, 장치" },
    { word: "procedure", meaning: "절차" }, { word: "observation", meaning: "관찰" }, { word: "measurement", meaning: "측정" }, { word: "calculation", meaning: "계산" }, { word: "formulation", meaning: "공식화" },
    { word: "theorem", meaning: "정리, 법칙" }, { word: "axiom", meaning: "공리" }, { word: "quantitative", meaning: "양적인" }, { word: "qualitative", meaning: "질적인" }, { word: "data", meaning: "자료, 데이터" },
    { word: "statistic", meaning: "통계치" }, { word: "probability", meaning: "확률" }, { word: "correlation", meaning: "상관관계" }, { word: "causation", meaning: "인과관계" }, { word: "precision", meaning: "정밀도" },
    { word: "accuracy", meaning: "정확도" }, { word: "error", meaning: "오차" }, { word: "deviation", meaning: "편차" }, { word: "margin", meaning: "여백, 차이" }, { word: "magnitude", meaning: "규모" },
    { word: "function", meaning: "기능, 함수" }, { word: "component", meaning: "구성 요소" }, { word: "structure", meaning: "구조" }, { word: "element", meaning: "요소" }, { word: "compound", meaning: "화합물" },
    { word: "mixture", meaning: "혼합물" }, { word: "properties", meaning: "특성, 속성" }, { word: "aspect", meaning: "측면" }, { word: "dimension", meaning: "차원, 크기" }, { word: "perspective", meaning: "관점" },
    { word: "framework", meaning: "틀, 체제" }, { word: "methodology", meaning: "방법론" }, { word: "simulation", meaning: "시뮬레이션" }, { word: "classification", meaning: "분류" }, { word: "sequence", meaning: "순서, 배열" }
  ],
  // [Day 12] 생명 과학 및 유전
  12: [
    { word: "organism", meaning: "유기체, 생물" }, { word: "species", meaning: "종" }, { word: "adaptation", meaning: "적응" }, { word: "mutation", meaning: "돌연변이" }, { word: "chromosome", meaning: "염색체" },
    { word: "gene", meaning: "유전자" }, { word: "heredity", meaning: "유전" }, { word: "reproduction", meaning: "번식, 복제" }, { word: "offspring", meaning: "자식, 새끼" }, { word: "fertilization", meaning: "수정" },
    { word: "embryo", meaning: "배아" }, { word: "cell", meaning: "세포" }, { word: "tissue", meaning: "조직" }, { word: "organ", meaning: "장기" }, { word: "anatomy", meaning: "해부학" },
    { word: "physiology", meaning: "생리학" }, { word: "metabolism", meaning: "신진대사" }, { word: "enzyme", meaning: "효소" }, { word: "hormone", meaning: "호르몬" }, { word: "immunity", meaning: "면역" },
    { word: "antibody", meaning: "항체" }, { word: "pathogen", meaning: "병균" }, { word: "bacteria", meaning: "박테리아" }, { word: "virus", meaning: "바이러스" }, { word: "infection", meaning: "감염" },
    { word: "secretion", meaning: "분비" }, { word: "respiration", meaning: "호흡" }, { word: "digestion", meaning: "소화" }, { word: "stimulus", meaning: "자극" }, { word: "reflex", meaning: "반사" },
    { word: "instinct", meaning: "본능" }, { word: "habitat", meaning: "서식지" }, { word: "niche", meaning: "틈새, 지위" }, { word: "predator", meaning: "포식자" }, { word: "prey", meaning: "먹이" },
    { word: "parasite", meaning: "기생충" }, { word: "symbiosis", meaning: "공생" }, { word: "extinction", meaning: "멸종" }, { word: "fossil", meaning: "화석" }, { word: "speciesism", meaning: "종 차별주의" }
  ],
  // [Day 13] 물리 및 에너지
  13: [
    { word: "matter", meaning: "물질, 문제" }, { word: "particle", meaning: "입자" }, { word: "atom", meaning: "원자" }, { word: "molecule", meaning: "분자" }, { word: "electron", meaning: "전자" },
    { word: "nucleus", meaning: "핵" }, { word: "gravity", meaning: "중력" }, { word: "mass", meaning: "질량, 덩어리" }, { word: "weight", meaning: "무게" }, { word: "density", meaning: "밀도" },
    { word: "volume", meaning: "부피, 음량" }, { word: "velocity", meaning: "속도" }, { word: "acceleration", meaning: "가속도" }, { word: "force", meaning: "힘" }, { word: "friction", meaning: "마찰" },
    { word: "inertia", meaning: "관성" }, { word: "momentum", meaning: "운동량, 가속도" }, { word: "energy", meaning: "에너지" }, { word: "kinetic", meaning: "운동의" }, { word: "potential", meaning: "잠재적인, 위치의" },
    { word: "thermodynamics", meaning: "열역학" }, { word: "conduction", meaning: "전도" }, { word: "convection", meaning: "대류" }, { word: "radiation", meaning: "방사선, 복사" }, { word: "wavelength", meaning: "파장" },
    { word: "frequency", meaning: "주파수, 빈도" }, { word: "spectrum", meaning: "스펙트럼" }, { word: "reflection", meaning: "반사, 투영" }, { word: "refraction", meaning: "굴절" }, { word: "optics", meaning: "광학" },
    { word: "magnetism", meaning: "자기" }, { word: "electricity", meaning: "전기" }, { word: "circuit", meaning: "회로" }, { word: "voltage", meaning: "전압" }, { word: "resistance", meaning: "저항" },
    { word: "current", meaning: "전류, 현재의" }, { word: "fusion", meaning: "융합" }, { word: "fission", meaning: "분열" }, { word: "vacuum", meaning: "진공" }, { word: "relativity", meaning: "상대성" }
  ],
  // [Day 14] 화학 및 물질
  14: [
    { word: "substance", meaning: "물질, 실체" }, { word: "composition", meaning: "구성, 작문" }, { word: "solution", meaning: "용액, 해결책" }, { word: "solvent", meaning: "용매" }, { word: "solute", meaning: "용질" },
    { word: "concentration", meaning: "농도, 집중" }, { word: "dilution", meaning: "희석" }, { word: "acidity", meaning: "산도" }, { word: "alkalinity", meaning: "알칼리성" }, { word: "neutral", meaning: "중성의" },
    { word: "reaction", meaning: "반응" }, { word: "catalyst", meaning: "촉매" }, { word: "oxidation", meaning: "산화" }, { word: "reduction", meaning: "환원, 감소" }, { word: "bonding", meaning: "결합" },
    { word: "ionic", meaning: "이온의" }, { word: "covalent", meaning: "공유 결합의" }, { word: "state", meaning: "상태, 국가" }, { word: "solid", meaning: "고체" }, { word: "liquid", meaning: "액체" },
    { word: "gas", meaning: "기체" }, { word: "plasma", meaning: "플라스마" }, { word: "evaporation", meaning: "증발" }, { word: "condensation", meaning: "응결" }, { word: "sublimation", meaning: "승화" },
    { word: "combustion", meaning: "연소" }, { word: "corrosion", meaning: "부식" }, { word: "synthetic", meaning: "합성의" }, { word: "organic", meaning: "유기물의" }, { word: "inorganic", meaning: "무기물의" },
    { word: "polymer", meaning: "중합체" }, { word: "alloy", meaning: "합금" }, { word: "conductivity", meaning: "전도성" }, { word: "solubility", meaning: "용해도" }, { word: "toxicity", meaning: "독성" },
    { word: "element", meaning: "요소, 원소" }, { word: "isotope", meaning: "동위 원소" }, { word: "valence", meaning: "원자가" }, { word: "molecular", meaning: "분자의" }, { word: "periodic", meaning: "주기적인" }
  ],
  // [Day 15] 지구과학 및 기상
  15: [
    { word: "geology", meaning: "지질학" }, { word: "crust", meaning: "지각" }, { word: "mantle", meaning: "맨틀" }, { word: "core", meaning: "핵" }, { word: "tectonic", meaning: "구조상의" },
    { word: "fault", meaning: "단층, 잘못" }, { word: "erosion", meaning: "침식" }, { word: "weathering", meaning: "풍화" }, { word: "sediment", meaning: "퇴적물" }, { word: "strata", meaning: "지층" },
    { word: "volcanic", meaning: "화산의" }, { word: "seismic", meaning: "지진의" }, { word: "altitude", meaning: "고도" }, { word: "latitude", meaning: "위도" }, { word: "longitude", meaning: "경도" },
    { word: "atmosphere", meaning: "대기" }, { word: "troposphere", meaning: "대류권" }, { word: "stratosphere", meaning: "성층권" }, { word: "precipitation", meaning: "강수량" }, { word: "humidity", meaning: "습도" },
    { word: "pressure", meaning: "압력, 기압" }, { word: "climate", meaning: "기후" }, { word: "meteorology", meaning: "기상학" }, { word: "forecasting", meaning: "예보" }, { word: "current", meaning: "해류, 현재의" },
    { word: "tide", meaning: "조수" }, { word: "marine", meaning: "해양의" }, { word: "terrestrial", meaning: "육생의, 지구의" }, { word: "continent", meaning: "대륙" }, { word: "hemisphere", meaning: "반구" },
    { word: "glacier", meaning: "빙하" }, { word: "iceberg", meaning: "빙산" }, { word: "desertification", meaning: "사막화" }, { word: "eruption", meaning: "폭발" }, { word: "fossilization", meaning: "화석화" },
    { word: "topography", meaning: "지형학" }, { word: "canyon", meaning: "협곡" }, { word: "plateau", meaning: "고원" }, { word: "abyss", meaning: "심연" }, { word: "ozone", meaning: "오존" }
  ],
  // [Day 16] 천문 및 우주
  16: [
    { word: "universe", meaning: "우주" }, { word: "galaxy", meaning: "은하" }, { word: "constellation", meaning: "별자리" }, { word: "star", meaning: "별" }, { word: "planet", meaning: "행성" },
    { word: "satellite", meaning: "위성" }, { word: "asteroid", meaning: "소행성" }, { word: "comet", meaning: "혜성" }, { word: "meteor", meaning: "유성" }, { word: "orbit", meaning: "궤도" },
    { word: "rotation", meaning: "자전" }, { word: "revolution", meaning: "공전" }, { word: "solar", meaning: "태양의" }, { word: "lunar", meaning: "달의" }, { word: "eclipse", meaning: "식(蝕)" },
    { word: "telescope", meaning: "망원경" }, { word: "observatory", meaning: "천문대" }, { word: "cosmic", meaning: "우주의" }, { word: "gravitation", meaning: "만유인력" }, { word: "black hole", meaning: "블랙홀" },
    { word: "light-year", meaning: "광년" }, { word: "nebula", meaning: "성운" }, { word: "supernova", meaning: "초신성" }, { word: "void", meaning: "공간, 빈 곳" }, { word: "radiation", meaning: "복사, 방사선" },
    { word: "astronaut", meaning: "우주 비행사" }, { word: "spacecraft", meaning: "우주선" }, { word: "launch", meaning: "발사하다" }, { word: "probe", meaning: "탐사선" }, { word: "expedition", meaning: "탐험" },
    { word: "extra-terrestrial", meaning: "외계의" }, { word: "colonization", meaning: "식민지화" }, { word: "propulsion", meaning: "추진력" }, { word: "vacuum", meaning: "진공" }, { word: "cluster", meaning: "성단, 무리" },
    { word: "gravity", meaning: "중력" }, { word: "friction", meaning: "마찰" }, { word: "navigation", meaning: "항법, 항해" }, { word: "signal", meaning: "신호" }, { word: "infinite", meaning: "무한한" }
  ],
  // [Day 17] 정보 기술 및 미래
  17: [
    { word: "computing", meaning: "컴퓨팅" }, { word: "hardware", meaning: "하드웨어" }, { word: "software", meaning: "소프트웨어" }, { word: "application", meaning: "응용 프로그램" }, { word: "operating", meaning: "운영의" },
    { word: "interface", meaning: "인터페이스" }, { word: "network", meaning: "네트워크" }, { word: "server", meaning: "서버" }, { word: "cloud", meaning: "클라우드" }, { word: "security", meaning: "보안" },
    { word: "hacking", meaning: "해킹" }, { word: "firewall", meaning: "방화벽" }, { word: "encryption", meaning: "암호화" }, { word: "artificial", meaning: "인공의" }, { word: "intelligence", meaning: "지능" },
    { word: "machine learning", meaning: "머신 러닝" }, { word: "algorithm", meaning: "알고리즘" }, { word: "database", meaning: "데이터베이스" }, { word: "storage", meaning: "저장" }, { word: "virtual", meaning: "가상의" },
    { word: "augmented", meaning: "증강된" }, { word: "automation", meaning: "자동화" }, { word: "robotics", meaning: "로봇 공학" }, { word: "nanotechnology", meaning: "나노 기술" }, { word: "biotechnology", meaning: "생물 공학" },
    { word: "digitalize", meaning: "디지털화하다" }, { word: "connectivity", meaning: "연결성" }, { word: "bandwidth", meaning: "대역폭" }, { word: "streaming", meaning: "스트리밍" }, { word: "transmission", meaning: "전송" },
    { word: "compatible", meaning: "호환되는" }, { word: "versatile", meaning: "다재다능한" }, { word: "innovative", meaning: "혁신적인" }, { word: "efficiency", meaning: "효율성" }, { word: "optimization", meaning: "최적화" },
    { word: "generation", meaning: "세대, 발생" }, { word: "interaction", meaning: "상호 작용" }, { word: "autonomous", meaning: "자율적인" }, { word: "sensor", meaning: "센서" }, { word: "feedback", meaning: "피드백" }
  ],
  // [Day 18] 예술 및 미학
  18: [
    { word: "masterpiece", meaning: "걸작" }, { word: "exhibition", meaning: "전시회" }, { word: "gallery", meaning: "미술관" }, { word: "curator", meaning: "큐레이터" }, { word: "artifact", meaning: "유물" },
    { word: "portrait", meaning: "초상화" }, { word: "landscape", meaning: "풍경화" }, { word: "sculpture", meaning: "조각" }, { word: "architecture", meaning: "건축" }, { word: "decoration", meaning: "장식" },
    { word: "ornament", meaning: "장식품" }, { word: "authentic", meaning: "진품의" }, { word: "replica", meaning: "복제품" }, { word: "duplicate", meaning: "복제하다" }, { word: "aesthetic", meaning: "미적인" },
    { word: "inspiration", meaning: "영감" }, { word: "creativity", meaning: "창의성" }, { word: "expression", meaning: "표현" }, { word: "genre", meaning: "장르" }, { word: "technique", meaning: "기법" },
    { word: "perspective", meaning: "원근법, 관점" }, { word: "composition", meaning: "구성, 작곡" }, { word: "contrast", meaning: "대조" }, { word: "harmony", meaning: "조화" }, { word: "abstract", meaning: "추상적인" },
    { word: "figurative", meaning: "구상적인, 비유적인" }, { word: "avant-garde", meaning: "전위적인" }, { word: "contemporary", meaning: "현대의" }, { word: "classic", meaning: "고전적인" }, { word: "vintage", meaning: "빈티지" },
    { word: "auditorium", meaning: "강당" }, { word: "acoustics", meaning: "음향" }, { word: "rhythm", meaning: "리듬" }, { word: "melody", meaning: "선율" }, { word: "tempo", meaning: "박자" },
    { word: "performance", meaning: "공연, 성과" }, { word: "theater", meaning: "극장" }, { word: "literature", meaning: "문학" }, { word: "narrative", meaning: "서사" }, { word: "symbolism", meaning: "상징주의" }
  ],
  // [Day 19] 역사 및 고고학
  19: [
    { word: "civilization", meaning: "문명" }, { word: "heritage", meaning: "유산" }, { word: "ancestor", meaning: "조상" }, { word: "descendant", meaning: "후손" }, { word: "medieval", meaning: "중세의" },
    { word: "renaissance", meaning: "르네상스" }, { word: "era", meaning: "시대" }, { word: "epoch", meaning: "획기적인 시대" }, { word: "dynasty", meaning: "왕조" }, { word: "empire", meaning: "제국" },
    { word: "colony", meaning: "식민지" }, { word: "imperialism", meaning: "제국주의" }, { word: "revolution", meaning: "혁명" }, { word: "reform", meaning: "개혁" }, { word: "chronicle", meaning: "연대기" },
    { word: "record", meaning: "기록" }, { word: "document", meaning: "문서" }, { word: "manuscript", meaning: "원고" }, { word: "archeology", meaning: "고고학" }, { word: "excavation", meaning: "발굴" },
    { word: "tomb", meaning: "무덤" }, { word: "relic", meaning: "유물" }, { word: "ruins", meaning: "유적, 폐허" }, { word: "monument", meaning: "기념비" }, { word: "fossil", meaning: "화석" },
    { word: "anthropology", meaning: "인류학" }, { word: "ethnography", meaning: "민족지학" }, { word: "primitive", meaning: "원시적인" }, { word: "feudal", meaning: "봉건적인" }, { word: "noble", meaning: "귀족" },
    { word: "peasant", meaning: "농민" }, { word: "slavery", meaning: "노예제" }, { word: "migration", meaning: "이주" }, { word: "conquest", meaning: "정복" }, { word: "alliance", meaning: "동맹" },
    { word: "sovereignty", meaning: "주권" }, { word: "independence", meaning: "독립" }, { word: "chronological", meaning: "연대순의" }, { word: "legacy", meaning: "유산" }, { word: "ritual", meaning: "의식" }
  ],
  // [Day 20] 의학 및 보건
  20: [
    { word: "diagnosis", meaning: "진단" }, { word: "symptom", meaning: "증상" }, { word: "treatment", meaning: "치료" }, { word: "therapy", meaning: "요법" }, { word: "surgery", meaning: "수술" },
    { word: "operation", meaning: "작동, 수술" }, { word: "physician", meaning: "내과 의사" }, { word: "specialist", meaning: "전문의" }, { word: "patient", meaning: "환자" }, { word: "clinical", meaning: "임상의" },
    { word: "chronic", meaning: "만성적인" }, { word: "acute", meaning: "급성의" }, { word: "epidemic", meaning: "전염병" }, { word: "pandemic", meaning: "세계적 대유행" }, { word: "vaccine", meaning: "백신" },
    { word: "antibiotic", meaning: "항생제" }, { word: "dose", meaning: "복용량" }, { word: "prescription", meaning: "처방전" }, { word: "pharmaceutical", meaning: "제약의" }, { word: "fatigue", meaning: "피로" },
    { word: "inflammation", meaning: "염증" }, { word: "swelling", meaning: "부기" }, { word: "allergy", meaning: "알레르기" }, { word: "complication", meaning: "합병증" }, { word: "side-effect", meaning: "부작용" },
    { word: "recovery", meaning: "회복" }, { word: "rehabilitation", meaning: "재활" }, { word: "prevent", meaning: "예방하다" }, { word: "hygiene", meaning: "위생" }, { word: "sanitation", meaning: "공중위생" },
    { word: "wellness", meaning: "건강함" }, { word: "nutrition", meaning: "영양" }, { word: "vitamin", meaning: "비타민" }, { word: "obesity", meaning: "비만" }, { word: "diabetes", meaning: "당뇨병" },
    { word: "mortality", meaning: "사망률" }, { word: "longevity", meaning: "장수" }, { word: "genetics", meaning: "유전학" }, { word: "transfusion", meaning: "수혈" }, { word: "transplantation", meaning: "이식" }
  ],
  // [Day 21] 환경 및 생태계
  21: [
    { word: "sustainability", meaning: "지속 가능성" }, { word: "ecosystem", meaning: "생태계" }, { word: "biodiversity", meaning: "생물 다양성" }, { word: "conservation", meaning: "보존" }, { word: "preservation", meaning: "보존, 보호" },
    { word: "restoration", meaning: "복원" }, { word: "depletion", meaning: "고갈" }, { word: "contamination", meaning: "오염" }, { word: "pollution", meaning: "오염" }, { word: "emission", meaning: "배출" },
    { word: "greenhouse", meaning: "온실" }, { word: "glacier", meaning: "빙하" }, { word: "arctic", meaning: "북극의" }, { word: "tropical", meaning: "열대의" }, { word: "deforestation", meaning: "삼림 파괴" },
    { word: "desertification", meaning: "사막화" }, { word: "erosion", meaning: "침식" }, { word: "drought", meaning: "가뭄" }, { word: "famine", meaning: "기근" }, { word: "renewable", meaning: "재생 가능한" },
    { word: "alternative", meaning: "대안의" }, { word: "resource", meaning: "자원" }, { word: "scarcity", meaning: "부족" }, { word: "abundance", meaning: "풍부" }, { word: "fertile", meaning: "비옥한" },
    { word: "barren", meaning: "박토의, 불임의" }, { word: "habitat", meaning: "서식지" }, { word: "sanctuary", meaning: "보호구역" }, { word: "species", meaning: "종" }, { word: "endangered", meaning: "멸종 위기의" },
    { word: "extinct", meaning: "멸종된" }, { word: "adaptable", meaning: "적응력 있는" }, { word: "resilient", meaning: "탄력 있는, 회복력 있는" }, { word: "ecological", meaning: "생태학의" }, { word: "footprint", meaning: "발자국, 영향" },
    { word: "organic", meaning: "유기농의, 생물의" }, { word: "toxic", meaning: "독성의" }, { word: "hazardous", meaning: "위험한" }, { word: "disposal", meaning: "처분" }, { word: "recycling", meaning: "재활용" }
  ],
  // [Day 22] 교육 및 학문
  22: [
    { word: "curriculum", meaning: "교육과정" }, { word: "pedagogy", meaning: "교수법" }, { word: "instruction", meaning: "지시, 교육" }, { word: "assessment", meaning: "평가" }, { word: "evaluation", meaning: "평가" },
    { word: "feedback", meaning: "피드백" }, { word: "intuition", meaning: "직관" }, { word: "intelligence", meaning: "지능" }, { word: "aptitude", meaning: "적성" }, { word: "competence", meaning: "능력" },
    { word: "proficiency", meaning: "숙달" }, { word: "literacy", meaning: "읽고 쓰는 능력" }, { word: "scholarship", meaning: "장학금, 학문" }, { word: "faculty", meaning: "학부, 교수진" }, { word: "discipline", meaning: "학과, 규율" },
    { word: "theory", meaning: "이론" }, { word: "hypothesis", meaning: "가설" }, { word: "thesis", meaning: "학위 논문" }, { word: "methodology", meaning: "방법론" }, { word: "analysis", meaning: "분석" },
    { word: "synthesis", meaning: "통합, 합성" }, { word: "perspective", meaning: "관점" }, { word: "criticism", meaning: "비평, 비판" }, { word: "interpretation", meaning: "해석" }, { word: "objective", meaning: "객관적인, 목표" },
    { word: "subjective", meaning: "주관적인" }, { word: "rigorous", meaning: "엄격한" }, { word: "intensive", meaning: "집중적인" }, { word: "elementary", meaning: "초보의" }, { word: "intermediate", meaning: "중급의" },
    { word: "advanced", meaning: "상급의" }, { word: "vocational", meaning: "직업의" }, { word: "academic", meaning: "학업의" }, { word: "theoretical", meaning: "이론적인" }, { word: "empirical", meaning: "경험적인" },
    { word: "comprehensive", meaning: "포괄적인" }, { word: "specialized", meaning: "전문화된" }, { word: "interdisciplinary", meaning: "학제간의" }, { word: "collaborative", meaning: "협력적인" }, { word: "autonomous", meaning: "자율적인" }
  ],
  // [Day 23] 노동 및 직업
  23: [
    { word: "occupation", meaning: "직업" }, { word: "profession", meaning: "전문직" }, { word: "career", meaning: "경력, 직업" }, { word: "employment", meaning: "고용" }, { word: "recruitment", meaning: "채용" },
    { word: "resignation", meaning: "사직" }, { word: "retirement", meaning: "은퇴" }, { word: "promotion", meaning: "승진, 홍보" }, { word: "transfer", meaning: "이동, 전근" }, { word: "qualification", meaning: "자격" },
    { word: "requirement", meaning: "자격 요건" }, { word: "certificate", meaning: "증명서" }, { word: "license", meaning: "면허" }, { word: "expertise", meaning: "전문 지식" }, { word: "competence", meaning: "능력" },
    { word: "efficiency", meaning: "효율성" }, { word: "productivity", meaning: "생산성" }, { word: "motivation", meaning: "동기 부여" }, { word: "incentive", meaning: "장려금, 유인" }, { word: "reward", meaning: "보상" },
    { word: "salary", meaning: "급여" }, { word: "wage", meaning: "임금" }, { word: "benefit", meaning: "수당, 혜택" }, { word: "welfare", meaning: "복지" }, { word: "union", meaning: "노동조합" },
    { word: "strike", meaning: "파업" }, { word: "negotiation", meaning: "협상" }, { word: "contract", meaning: "계약" }, { word: "freelance", meaning: "프리랜서" }, { word: "entrepreneur", meaning: "기업가" },
    { word: "startup", meaning: "신생 기업" }, { word: "corporation", meaning: "기업" }, { word: "personnel", meaning: "인원, 인사과" }, { word: "administration", meaning: "행정, 관리" }, { word: "management", meaning: "경영" },
    { word: "leadership", meaning: "지도력" }, { word: "supervise", meaning: "감독하다" }, { word: "colleague", meaning: "동료" }, { word: "subordinate", meaning: "하급자" }, { word: "workplace", meaning: "직장" }
  ],
  // [Day 24] 행동 및 성향
  24: [
    { word: "temperament", meaning: "기질" }, { word: "personality", meaning: "성격" }, { word: "character", meaning: "성격, 등장인물" }, { word: "virtue", meaning: "미덕" }, { word: "vice", meaning: "악덕" },
    { word: "integrity", meaning: "고결함" }, { word: "dignity", meaning: "존엄성" }, { word: "humility", meaning: "겸손" }, { word: "arrogance", meaning: "오만" }, { word: "confidence", meaning: "자신감" },
    { word: "optimism", meaning: "낙관주의" }, { word: "pessimism", meaning: "비관주의" }, { word: "enthusiasm", meaning: "열정" }, { word: "indifference", meaning: "무관심" }, { word: "curiosity", meaning: "호기심" },
    { word: "creativity", meaning: "창의성" }, { word: "originality", meaning: "독창성" }, { word: "flexibility", meaning: "유연성" }, { word: "adaptability", meaning: "적응력" }, { word: "endurance", meaning: "인내" },
    { word: "patience", meaning: "인내심" }, { word: "diligence", meaning: "부지런함" }, { word: "negligence", meaning: "태만" }, { word: "impulse", meaning: "충동" }, { word: "instinct", meaning: "본능" },
    { word: "habit", meaning: "습관" }, { word: "routine", meaning: "일상" }, { word: "custom", meaning: "관습" }, { word: "convention", meaning: "인습, 관례" }, { word: "tradition", meaning: "전통" },
    { word: "preference", meaning: "선호" }, { word: "tendency", meaning: "경향" }, { word: "inclination", meaning: "성향" }, { word: "prejudice", meaning: "편견" }, { word: "stereotype", meaning: "고정관념" },
    { word: "discrimination", meaning: "차별" }, { word: "tolerance", meaning: "관용" }, { word: "empathy", meaning: "공감" }, { word: "hostility", meaning: "적대감" }, { word: "generosity", meaning: "너그러움" }
  ],
  // [Day 25] 추상 형용사 및 상태
  25: [
    { word: "subtle", meaning: "미묘한" }, { word: "delicate", meaning: "섬세한" }, { word: "intricate", meaning: "복잡한" }, { word: "complex", meaning: "복잡한" }, { word: "profound", meaning: "심오한" },
    { word: "superficial", meaning: "피상적인" }, { word: "trivial", meaning: "사소한" }, { word: "vital", meaning: "필수적인" }, { word: "crucial", meaning: "중대한" }, { word: "essential", meaning: "필수적인" },
    { word: "significant", meaning: "중요한" }, { word: "immense", meaning: "거대한" }, { word: "vast", meaning: "광대한" }, { word: "minute", meaning: "미세한" }, { word: "precise", meaning: "정확한" },
    { word: "accurate", meaning: "정확한" }, { word: "vague", meaning: "모호한" }, { word: "ambiguous", meaning: "모호한" }, { word: "obscure", meaning: "모호한, 무명의" }, { word: "transparent", meaning: "투명한" },
    { word: "opaque", meaning: "불투명한" }, { word: "durable", meaning: "내구성이 있는" }, { word: "fragile", meaning: "깨지기 쉬운" }, { word: "stable", meaning: "안정된" }, { word: "volatile", meaning: "변덕스러운" },
    { word: "permanent", meaning: "영구적인" }, { word: "temporary", meaning: "일시적인" }, { word: "constant", meaning: "끊임없는" }, { word: "variable", meaning: "변하기 쉬운" }, { word: "consistent", meaning: "일관된" },
    { word: "arbitrary", meaning: "임의적인" }, { word: "random", meaning: "무작위의" }, { word: "deliberate", meaning: "의도적인" }, { word: "spontaneous", meaning: "자발적인" }, { word: "inevitable", meaning: "피할 수 없는" },
    { word: "coincidental", meaning: "우연한" }, { word: "plausible", meaning: "타당한 것 같은" }, { word: "absurd", meaning: "불합리한" }, { word: "authentic", meaning: "진짜의" }, { word: "artificial", meaning: "인공의" }
  ],
  // [Day 26] 핵심 다의어 1
  26: [
    { word: "account", meaning: "설명하다, 계좌, 중요성" }, { word: "address", meaning: "주소, 다루다, 연설하다" }, { word: "apply", meaning: "적용하다, 지원하다, 바르다" }, { word: "appreciate", meaning: "감사하다, 감상하다, 인정하다" }, { word: "assume", meaning: "추정하다, 떠맡다, ~인 척하다" },
    { word: "bear", meaning: "견디다, 열매를 맺다, 곰" }, { word: "bill", meaning: "계산서, 법안, 지폐" }, { word: "board", meaning: "판자, 위원회, 탑승하다" }, { word: "case", meaning: "사례, 사건, 상자" }, { word: "cast", meaning: "던지다, 배역을 맡기다, 석고" },
    { word: "cause", meaning: "원인, 일으키다, 대의명분" }, { word: "charge", meaning: "요금, 책임, 고발하다" }, { word: "close", meaning: "닫다, 친밀한, 가까운" }, { word: "command", meaning: "명령, 구사력, 내려다보다" }, { word: "compromise", meaning: "타협하다, 손상시키다" },
    { word: "concern", meaning: "걱정, 관심, 관계되다" }, { word: "count", meaning: "세다, 중요하다, 간주하다" }, { word: "cover", meaning: "덮다, 다루다, 보도하다" }, { word: "degree", meaning: "도(度), 정도, 학위" }, { word: "deliver", meaning: "배달하다, 연설하다, 해산하다" },
    { word: "direct", meaning: "직접적인, 감독하다, 길을 안내하다" }, { word: "drive", meaning: "운전하다, 몰아가다, 추진력" }, { word: "even", meaning: "평평한, 짝수의, 심지어 ~조차" }, { word: "exercise", meaning: "운동, 연습, (권리) 행사" }, { word: "express", meaning: "표현하다, 급행의" },
    { word: "fair", meaning: "공평한, 박람회, 상당한" }, { word: "figure", meaning: "수치, 인물, 생각하다" }, { word: "fine", meaning: "좋은, 미세한, 벌금" }, { word: "firm", meaning: "딱딱한, 확고한, 회사" }, { word: "ground", meaning: "땅, 근거, 이유" },
    { word: "issue", meaning: "문제, 발행물, 발표하다" }, { word: "last", meaning: "지난, 마지막의, 지속되다" }, { word: "leave", meaning: "떠나다, 남기다, 휴가" }, { word: "match", meaning: "경기, 어울리다, 필적하다" }, { word: "mean", meaning: "의미하다, 비열한, 평균" },
    { word: "mind", meaning: "마음, 꺼리다, 보살피다" }, { word: "note", meaning: "메모, 주목하다, 음조" }, { word: "object", meaning: "물체, 목적, 반대하다" }, { word: "observe", meaning: "관찰하다, 준수하다, 언급하다" }, { word: "order", meaning: "주문, 순서, 질서" }
  ],
  // [Day 27] 핵심 다의어 2
  27: [
    { word: "party", meaning: "파티, 정당, 당사자" }, { word: "plant", meaning: "식물, 공장, 심다" }, { word: "point", meaning: "점, 요점, 가리키다" }, { word: "practice", meaning: "연습, 관행, 관습" }, { word: "present", meaning: "현재의, 출석한, 선물하다" },
    { word: "press", meaning: "누르다, 언론, 압박" }, { word: "project", meaning: "계획, 투사하다, 보여주다" }, { word: "race", meaning: "경주, 인종" }, { word: "range", meaning: "범위, 산맥, 분포하다" }, { word: "reach", meaning: "도착하다, 뻗다, 범위" },
    { word: "reason", meaning: "이유, 이성, 추론하다" }, { word: "reflect", meaning: "반사하다, 반영하다, 숙고하다" }, { word: "regard", meaning: "간주하다, 존경, 안부" }, { word: "relief", meaning: "안도, 구호(물자), 양각" }, { word: "reserve", meaning: "예약하다, 비축물, 보호구역" },
    { word: "scale", meaning: "규모, 저울, 비늘" }, { word: "state", meaning: "상태, 국가, 말하다" }, { word: "subject", meaning: "주제, 과목, 피실험자" }, { word: "term", meaning: "용어, 기간, 조건" }, { word: "yield", meaning: "산출하다, 굴복하다, 양보하다" },
    { word: "absolute", meaning: "절대적인, 완전한" }, { word: "abstract", meaning: "추상적인, 개요" }, { word: "agent", meaning: "대리인, 요원, 동인(動因)" }, { word: "bank", meaning: "은행, 둑, 제방" }, { word: "bar", meaning: "막대기, 술집, 법조계, 막다" },
    { word: "beat", meaning: "때리다, 이기다, 박자" }, { word: "bound", meaning: "~할 것 같은, 묶인, 경계" }, { word: "capital", meaning: "수도, 자본, 대문자의" }, { word: "channel", meaning: "채널, 경로, 수로" }, { word: "character", meaning: "성격, 인물, 글자" },
    { word: "check", meaning: "수표, 점검, 억제하다" }, { word: "column", meaning: "기둥, 칼럼" }, { word: "content", meaning: "내용물, 만족하는" }, { word: "contract", meaning: "계약서, 수축하다, 병에 걸리다" }, { word: "counter", meaning: "계산대, 반대의, 반격하다" },
    { word: "deal", meaning: "다루다, 거래, 양" }, { word: "decline", meaning: "거절하다, 감소하다" }, { word: "desert", meaning: "사막, 버리다" }, { word: "due", meaning: "만기가 된, ~하기로 되어 있는" }, { word: "effect", meaning: "효과, 영향, 결과" }
  ],
  // [Day 28] 혼동하기 쉬운 어휘
  28: [
    { word: "adapt", meaning: "적응하다, 개조하다" }, { word: "adopt", meaning: "채택하다, 입양하다" }, { word: "affect", meaning: "영향을 미치다" }, { word: "effect", meaning: "결과, 영향, 효과" }, { word: "complement", meaning: "보충물, 보어" },
    { word: "compliment", meaning: "칭찬, 경의" }, { word: "continuous", meaning: "끊이지 않는 (시간)" }, { word: "continual", meaning: "빈번한 (반복)" }, { word: "disinterested", meaning: "사심 없는, 객관적인" }, { word: "uninterested", meaning: "무관심한" },
    { word: "eminent", meaning: "저명한, 탁월한" }, { word: "imminent", meaning: "임박한" }, { word: "ingenious", meaning: "기발한, 독창적인" }, { word: "ingenuous", meaning: "순진한, 솔직한" }, { word: "literal", meaning: "글자 그대로의" },
    { word: "literary", meaning: "문학의" }, { word: "literate", meaning: "읽고 쓸 줄 아는" }, { word: "personal", meaning: "개인적인" }, { word: "personnel", meaning: "전 직원, 인사과" }, { word: "principal", meaning: "주요한, 교장" },
    { word: "principle", meaning: "원리, 원칙" }, { word: "stationary", meaning: "정지된" }, { word: "stationery", meaning: "문구류" }, { word: "wander", meaning: "헤매다, 배회하다" }, { word: "wonder", meaning: "궁금해하다, 경이" },
    { word: "industrial", meaning: "산업의" }, { word: "industrious", meaning: "근면한, 부지런한" }, { word: "economic", meaning: "경제의" }, { word: "economical", meaning: "경제적인, 절약하는" }, { word: "respectable", meaning: "존경할 만한" },
    { word: "respectful", meaning: "경의를 표하는, 공손한" }, { word: "respective", meaning: "각각의" }, { word: "sensitive", meaning: "민감한, 예민한" }, { word: "sensible", meaning: "분별 있는, 합리적인" }, { word: "successful", meaning: "성공적인" },
    { word: "successive", meaning: "연속적인" }, { word: "imaginative", meaning: "상상력이 풍부한" }, { word: "imaginary", meaning: "가상의" }, { word: "imaginable", meaning: "상상할 수 있는" }, { word: "credible", meaning: "신용할 수 있는" }
  ],
  // [Day 29] 논리 연결어 및 담화 표지어
  29: [
    { word: "furthermore", meaning: "뿐만 아니라, 더욱이" }, { word: "moreover", meaning: "게다가, 더욱이" }, { word: "additionally", meaning: "추가적으로" }, { word: "likewise", meaning: "마찬가지로" }, { word: "similarly", meaning: "비슷하게" },
    { word: "conversely", meaning: "반대로" }, { word: "nevertheless", meaning: "그럼에도 불구하고" }, { word: "nonetheless", meaning: "그럼에도 불구하고" }, { word: "whereas", meaning: "~인 반면에" }, { word: "notwithstanding", meaning: "~에도 불구하고" },
    { word: "consequently", meaning: "결과적으로" }, { word: "accordingly", meaning: "그에 따라서" }, { word: "subsequently", meaning: "그 뒤에, 나중에" }, { word: "henceforth", meaning: "이후로 줄곧" }, { word: "meanwhile", meaning: "한편, 그동안에" },
    { word: "simultaneously", meaning: "동시에" }, { word: "ultimately", meaning: "궁극적으로" }, { word: "specifically", meaning: "구체적으로" }, { word: "namely", meaning: "즉, 다시 말해" }, { word: "paradoxically", meaning: "역설적으로" },
    { word: "ostensibly", meaning: "표면상으로는" }, { word: "arguably", meaning: "주장하건대" }, { word: "presumably", meaning: "아마, 짐작건대" }, { word: "supposedly", meaning: "추정상, 아마" }, { word: "inevitably", meaning: "필연적으로" },
    { word: "theoretically", meaning: "이론적으로" }, { word: "practically", meaning: "사실상, 실용적으로" }, { word: "alternatively", meaning: "그 대신에" }, { word: "precisely", meaning: "정확하게" }, { word: "fundamentally", meaning: "근본적으로" },
    { word: "essentially", meaning: "본질적으로" }, { word: "primarily", meaning: "주로" }, { word: "predominantly", meaning: "지배적으로, 대개" }, { word: "exclusively", meaning: "독점적으로, 오로지" }, { word: "relatively", meaning: "상대적으로" },
    { word: "absolutely", meaning: "절대적으로" }, { word: "virtually", meaning: "사실상, 가상으로" }, { word: "literally", meaning: "말 그대로" }, { word: "metaphorically", meaning: "비유적으로" }, { word: "respectively", meaning: "각각" }
  ],
  // [Day 30] 고난도 학술 동사
  30: [
    { word: "abandon", meaning: "버리다, 포기하다" }, { word: "abolish", meaning: "폐지하다" }, { word: "accommodate", meaning: "수용하다, 부응하다" }, { word: "accumulate", meaning: "축적하다" }, { word: "acknowledge", meaning: "인정하다" },
    { word: "acquire", meaning: "획득하다" }, { word: "advocate", meaning: "옹호하다, 지지하다" }, { word: "alleviate", meaning: "완화시키다" }, { word: "anticipate", meaning: "예상하다" }, { word: "attain", meaning: "달성하다" },
    { word: "attribute", meaning: "~의 탓으로 돌리다" }, { word: "augment", meaning: "증가시키다" }, { word: "coincide", meaning: "일치하다, 동시에 일어나다" }, { word: "collaborate", meaning: "협력하다" }, { word: "commence", meaning: "시작하다" },
    { word: "compensate", meaning: "보상하다" }, { word: "compile", meaning: "편집하다" }, { word: "conform", meaning: "따르다, 순응하다" }, { word: "constrain", meaning: "강제하다, 제한하다" }, { word: "contradict", meaning: "반박하다, 모순되다" },
    { word: "deteriorate", meaning: "악화되다" }, { word: "deviate", meaning: "벗어나다" }, { word: "diminish", meaning: "줄어들다" }, { word: "discern", meaning: "식별하다, 알아차리다" }, { word: "discard", meaning: "버리다" },
    { word: "distort", meaning: "왜곡하다" }, { word: "elicit", meaning: "이끌어 내다" }, { word: "eliminate", meaning: "제거하다" }, { word: "embody", meaning: "구현하다, 상징하다" }, { word: "embrace", meaning: "포용하다, 받아들이다" },
    { word: "emphasize", meaning: "강조하다" }, { word: "encounter", meaning: "마주치다" }, { word: "enhance", meaning: "향상시키다" }, { word: "ensure", meaning: "보장하다" }, { word: "entail", meaning: "수반하다" },
    { word: "establish", meaning: "확립하다, 설립하다" }, { word: "exaggerate", meaning: "과장하다" }, { word: "exceed", meaning: "넘어서다, 초과하다" }, { word: "execute", meaning: "수행하다, 처형하다" }, { word: "exhibit", meaning: "전시하다, 보이다" }
  ]
};