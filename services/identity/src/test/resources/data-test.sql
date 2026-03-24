-- Test data initialization for integration tests
-- This SQL is executed when Liquibase is disabled in test profile

-- Insert STORE_OWNER role if not exists
INSERT INTO roles (id, name, description, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'STORE_OWNER',
    'Store Owner Role',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'STORE_OWNER'
);

-- Insert other roles if needed for tests
INSERT INTO roles (id, name, description, created_at, updated_at)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'ADMIN',
    'Administrator Role',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'ADMIN'
);
