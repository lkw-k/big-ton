CREATE TABLE session (
    id           uuid PRIMARY KEY,
    requirements jsonb,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- vendor는 data->>'vendor'와 같은 값. 업체별 최신 견적 1건만 유지한다.
CREATE TABLE quote (
    id         bigserial PRIMARY KEY,
    session_id uuid        NOT NULL REFERENCES session (id) ON DELETE CASCADE,
    vendor     text        NOT NULL,
    data       jsonb       NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, vendor)
);

-- SSE 재전송용. id 순서가 발행 순서.
CREATE TABLE event_log (
    id         bigserial PRIMARY KEY,
    session_id uuid        NOT NULL REFERENCES session (id) ON DELETE CASCADE,
    payload    jsonb       NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_log_session_id_idx ON event_log (session_id, id);
