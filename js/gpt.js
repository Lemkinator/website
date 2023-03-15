const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatViewHeader = document.querySelector('.chat-view h3');
const messageList = document.querySelector('.message-list');
const addChatBtn = document.getElementById('add-chat');
const apiKeyInput = document.getElementById('api-key-input');
const chatList = document.querySelector('.chat-list');

apiKeyInput.value = localStorage.getItem('apiKey') || '';
apiKeyInput.addEventListener('input', () => {
    localStorage.setItem('apiKey', apiKeyInput.value);
});

//load chat list from local storage and set first chat as active
const chatListFromLocalStorage = JSON.parse(localStorage.getItem('chatList'));
if (chatListFromLocalStorage) {
    chatListFromLocalStorage.forEach(chat => {
        const newChat = document.createElement('li');
        newChat.classList.add('chat');
        newChat.textContent = chat;
        chatList.appendChild(newChat);
    });
    chatList.querySelector('li').classList.add('active');
    document.querySelector('.chat-view h3').textContent = chatList.querySelector('li').textContent;
    document.querySelector('.message-list').innerHTML = '';
    setChatListListener()
    openChat(chatList.querySelector('li').textContent)
} else {
    // Add default chat to chat list
    const defaultChat = document.createElement('li');
    defaultChat.classList.add('chat');
    defaultChat.classList.add('active');
    defaultChat.textContent = 'Chat 1';
    chatList.appendChild(defaultChat);
    // Add empty array for default chat messages to Local Storage
    localStorage.setItem('Chat 1', JSON.stringify([]));
    // Add default chat to chat list in Local Storage
    localStorage.setItem('chatList', JSON.stringify(['Chat 1']));
    setChatListListener()
    openChat('Chat 1')
}

// Add new chat when add chat button is clicked
addChatBtn.addEventListener('click', () => {
    const newChatName = prompt('Enter chat name:');
    if (newChatName && !chatList.innerHTML.includes(newChatName)) {
        // Add new chat to chat list
        const newChat = document.createElement('li');
        newChat.classList.add('chat');
        newChat.classList.add('active');
        newChat.textContent = newChatName;
        chatList.appendChild(newChat);
        // Add empty array for new chat messages to Local Storage
        localStorage.setItem(newChatName, JSON.stringify([]));
        // Change to new chat view
        chatList.querySelectorAll('li').forEach(chat => {
            chat.classList.remove('active');
        });
        newChat.classList.add('active');
        document.querySelector('.chat-view h3').textContent = newChatName;
        document.querySelector('.message-list').innerHTML = '';
        // Add new chat to chat list in Local Storage
        localStorage.setItem('chatList', JSON.stringify([...chatList.querySelectorAll('li')].map(chat => chat.textContent)));
        setChatListListener()
    }
});

function openChat(name) {
    chatViewHeader.textContent = name;
    // Get chat messages from Local Storage
    const chatMessages = JSON.parse(localStorage.getItem(name));
    // Display chat messages in message list
    messageList.innerHTML = '';
    if (chatMessages) {
        chatMessages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', message.role);
            const messageText = document.createElement('p');
            messageText.textContent = message.text;
            messageElement.appendChild(messageText);
            messageList.appendChild(messageElement);
        });
        // Scroll to bottom of message list
        messageList.scrollTop = messageList.scrollHeight;
    }
}

// Change chat view when a chat is clicked
function setChatListListener() {
    chatList.querySelectorAll('li').forEach(chat => {
        chat.addEventListener('click', () => {
            // Remove active class from all chats
            chatList.querySelectorAll('li').forEach(c => {
                c.classList.remove('active');
            });
            // Add active class to clicked chat
            chat.classList.add('active');
            // Change chat view header
            openChat(chat.textContent);
        });
    });
}

// Send message when enter key is pressed
messageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        send();
    }
});

function send() {
    if (messageInput.value.trim() !== '') {
        // Create sent message object
        const sentMessage = {
            role: 'user',
            text: messageInput.value.trim()
        };
        // Add sent message to Local Storage
        const chatName = chatViewHeader.textContent;
        let chatMessages = JSON.parse(localStorage.getItem(chatName)) || [];
        chatMessages.push(sentMessage);
        localStorage.setItem(chatName, JSON.stringify(chatMessages));
        // Create sent message element
        const sentMessageElement = document.createElement('div');
        sentMessageElement.classList.add('message', 'user');
        const sentMessageText = document.createElement('p');
        sentMessageText.textContent = sentMessage.text;
        sentMessageElement.appendChild(sentMessageText);
        // Append sent message to message list
        messageList.appendChild(sentMessageElement);
        // Clear message input
        messageInput.value = '';

        // Get response from ChatGPT API
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKeyInput.value
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: chatMessages.map(message => {
                    return {
                        role: message.role,
                        content: message.text
                    }
                }),
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // Create received message object
                const receivedMessage = {
                    role: data.choices[0].message.role,
                    text: data.choices[0].message.content
                };
                // Add received message to Local Storage
                chatMessages.push(receivedMessage);
                localStorage.setItem(chatName, JSON.stringify(chatMessages));
                // Create received message element
                const receivedMessageElement = document.createElement('div');
                receivedMessageElement.classList.add('message', 'assistant');
                const receivedMessageText = document.createElement('p');
                receivedMessageText.textContent = receivedMessage.text;
                receivedMessageElement.appendChild(receivedMessageText);
                // Append received message to message list
                messageList.appendChild(receivedMessageElement);
                // Scroll to bottom of message list
                messageList.scrollTop = messageList.scrollHeight;
            })
            .catch(error => {
                console.error(error);
            });
    }
}

// Send message when send button is clicked
sendBtn.addEventListener('click', () => {
    send();
});