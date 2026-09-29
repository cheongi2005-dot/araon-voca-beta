// 예문·해석 검사: node scripts/check-sentences.cjs
// 모든 단어에 빈칸(___)이 있는 예문과 한국어 해석(sentenceKo)이 있는지,
// 고유명사가 예문 맨 앞에 있는지 (WordCard의 blankWord가 문장 중간의 Title-case 단어를 소문자로 바꾸기 때문).
const fs = require('node:fs');
const path = require('node:path');

const PROPER = /^((Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day|January|February|March|April|May|June|July|August|September|October|November|December|Korea|China|France|India|English|Korean|Halloween|Mercury|Venus|Earth|Mars)$/;

(async () => {
  let failed = false;
  for (const course of ['Elementary100', 'Level1', 'Level2', 'Level3', 'Level4', 'Level5']) {
    const text = fs.readFileSync(path.join(__dirname, '../src/data', `${course}.js`), 'utf8');
    const { DATA_BY_DAY } = await import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`);
    const errors = [];
    let n = 0, bad = 0;
    for (const [day, words] of Object.entries(DATA_BY_DAY)) {
      for (const { word, sentence, sentenceKo } of words) {
        n++;
        const before = errors.length;
        const at = `Day ${day} ${word}: ${sentence}`;
        if (typeof sentence !== 'string') { errors.push(`예문 없음 — ${at}`); bad++; continue; }
        const blanks = sentence.split('___').length - 1;
        // Level 4는 'massive success requires massive action'처럼 빈칸이 둘인 것도 있고,
        // 'turn A into B'·'keep A from ~ing'·'end up -ing' 같은 틀 표현은 빈칸에 그대로 넣을 수 없어 빈칸 없는 완성 문장이다
        const pattern = /\b[AB]\b|~|\(|-ing/.test(word);
        if (course === 'Level4' ? blanks < 1 && !pattern : blanks !== 1) errors.push(`빈칸 수 ${blanks} — ${at}`);
        if (course !== 'Level4' && !/^\S.*[.!?]$/.test(sentence)) errors.push(`문장 부호로 끝나야 함 — ${at}`);
        if (PROPER.test(word) && !sentence.startsWith('___')) errors.push(`고유명사는 예문 맨 앞에 — ${at}`);
        if (!/[가-힣]/.test(sentenceKo || '')) errors.push(`해석 없음 — ${at}`);
        if (errors.length > before) bad++;
      }
    }
    console.log(`${course}: ${n - bad}/${n} OK`);
    errors.slice(0, 5).forEach(e => console.log(`  ${e}`));
    if (errors.length > 5) console.log(`  … 외 ${errors.length - 5}개`);
    failed ||= errors.length > 0;
  }
  process.exit(failed ? 1 : 0);
})();
