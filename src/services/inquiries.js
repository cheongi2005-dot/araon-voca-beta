/**
 * 문의(inquiries) 컬렉션 공통 규약.
 *
 * 학생 문의 / 학부모 문의 / 관리자 답변 세 화면이 같은 컬렉션을 쓰면서
 * 담당자 이메일과 정렬 방식을 각자 적어두고 있어 여기로 모았습니다.
 */

/** 문의 알림을 받을 담당 선생님 주소. */
export const INQUIRY_TARGET_EMAIL = 'di4377491@gmail.com';

/** 학생이 직접 남긴 문의를 학부모 문의와 구분하는 표시값. */
export const INQUIRY_USER_TYPE = {
  student: 'student',
  parent: 'parent',
};

/** 학생 문의 작성 시 고를 수 있는 분류. */
export const INQUIRY_CATEGORIES = ['학습 오류', '시스템 버그', '기능 건의', '기타 질문'];

/**
 * 최신순 정렬.
 * createdAt은 serverTimestamp라 쓰기 직후 스냅샷에서는 아직 null일 수 있으므로
 * 값이 없으면 0으로 두어 목록 끝으로 보냅니다.
 */
export const sortInquiriesByNewest = (inquiries) =>
  [...inquiries].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

/** userType이 'student'가 아닌 문의는 모두 학부모 문의로 봅니다(레거시 데이터에는 필드가 없음). */
export const isStudentInquiry = (inquiry) => inquiry.userType === INQUIRY_USER_TYPE.student;
