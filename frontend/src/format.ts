// 화면 표시용 포맷. null 처리는 호출하는 쪽에서 "미확인" 배지로 한다.

export const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
