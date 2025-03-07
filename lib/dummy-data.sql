-- Function to create dummy data for a new user
CREATE OR REPLACE FUNCTION create_dummy_data_for_user(new_user_id UUID) 
RETURNS void AS $$
DECLARE
    chat_id1 UUID;
    chat_id2 UUID;
    dummy_user1_id UUID;
    dummy_user2_id UUID;
BEGIN
    -- Create two dummy users to chat with
    INSERT INTO users (id, email, full_name, phone, avatar_url)
    VALUES 
        (uuid_generate_v4(), 'alice@example.com', 'Alice Smith', '+1234567890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice')
    RETURNING id INTO dummy_user1_id;
    
    INSERT INTO users (id, email, full_name, phone, avatar_url)
    VALUES 
        (uuid_generate_v4(), 'bob@example.com', 'Bob Johnson', '+1987654321', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob')
    RETURNING id INTO dummy_user2_id;

    -- Create two chats
    INSERT INTO chats (id, name, is_group)
    VALUES 
        (uuid_generate_v4(), 'Welcome Chat', false)
    RETURNING id INTO chat_id1;
    
    INSERT INTO chats (id, name, is_group)
    VALUES 
        (uuid_generate_v4(), 'Team Discussion', true)
    RETURNING id INTO chat_id2;

    -- Add chat participants
    INSERT INTO chat_participants (chat_id, user_id)
    VALUES
        (chat_id1, new_user_id),
        (chat_id1, dummy_user1_id),
        (chat_id2, new_user_id),
        (chat_id2, dummy_user1_id),
        (chat_id2, dummy_user2_id);

    -- Add some messages
    INSERT INTO messages (chat_id, sender_id, content, is_read)
    VALUES
        (chat_id1, dummy_user1_id, 'Welcome to the chat app! 👋', true),
        (chat_id1, new_user_id, 'Thanks! Happy to be here', true),
        (chat_id1, dummy_user1_id, 'Feel free to explore around', true),
        (chat_id2, dummy_user1_id, 'Welcome to the team discussion!', true),
        (chat_id2, dummy_user2_id, 'Glad to have you here', true),
        (chat_id2, new_user_id, 'Thanks everyone!', true);

    -- Add some labels to chats
    INSERT INTO chat_labels (chat_id, label_id)
    VALUES
        (chat_id1, (SELECT id FROM labels WHERE name = 'Demo')),
        (chat_id2, (SELECT id FROM labels WHERE name = 'Internal'));
END;
$$ LANGUAGE plpgsql;