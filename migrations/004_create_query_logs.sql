CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    question TEXT NOT NULL,
    provider VARCHAR(50),
    model VARCHAR(100),
    generated_sql TEXT,
    natural_answer TEXT,
    row_count INTEGER,
    latency_ms INTEGER,
    status VARCHAR(20) NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_logs_status ON query_logs(status);
