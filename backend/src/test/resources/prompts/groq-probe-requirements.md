아래 인터뷰 대화에서 사용자의 요구 조건을 추출해 JSON 객체 하나로만 답하라. 설명, 코드 블록 없이 JSON만 출력한다.

규칙:
- 대화에서 사용자가 답하지 않은 항목은 반드시 null로 둔다. 추측하거나 0, 빈 문자열로 채우지 않는다.
- 금액은 원 단위 정수, 날짜는 YYYY-MM-DD.

형식:
{"item": string, "budget": integer|null, "due_date": "YYYY-MM-DD"|null, "need_install": boolean|null, "quantity": integer|null, "notes": string|null}

대화:
<conversation>
