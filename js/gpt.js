const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatViewHeader = document.getElementById('chat-view-header');
const messageList = document.getElementById('message-list');
const addChatBtn = document.getElementById('new-chat-btn');
const apiKeyInput = document.getElementById('api-key-input');
const chatList = document.getElementById('chat-list');

apiKeyInput.value = localStorage.getItem('apiKey') || '';
apiKeyInput.addEventListener('input', () => {
    localStorage.setItem('apiKey', apiKeyInput.value);
});

let chats = JSON.parse(localStorage.getItem('chats'));
let activeChatIndex = parseInt(localStorage.getItem('activeChatIndex')) || 0;
refreshChatView(activeChatIndex);
function refreshChats() {
    if (chats === null || chats.length === 0) {
        chats = [{'title': 'Chat 1', 'messages': []}];
    }
    localStorage.setItem('chats', JSON.stringify(chats));
}

function createNewChatListItem(newChatName) {
    const newChat = document.createElement('div');
    newChat.classList.add('chat');
    newChat.textContent = newChatName;
    const deleteButton = document.createElement('i')
    deleteButton.classList.add('delete-chat-btn')
    deleteButton.classList.add('lni')
    deleteButton.classList.add('lni-trash-can')
    newChat.appendChild(deleteButton)
    return newChat;
}

function refreshChatView(index) {
    activeChatIndex = index || 0;
    localStorage.setItem('activeChatIndex', activeChatIndex.toString());
    refreshChats()
    chatList.innerHTML = '';
    chats.forEach(chat => {
        chatList.appendChild(createNewChatListItem(chat.title));
    });
    chatList.querySelectorAll('div')[activeChatIndex].classList.add('active');
    setChatListListener()
    openChat(activeChatIndex);
}

function deleteChat(index) {
    chats.splice(index, 1);
    if (index === activeChatIndex) {
        refreshChatView(0);
    } else if (index < activeChatIndex) {
        refreshChatView(activeChatIndex - 1);
    } else {
        refreshChatView(activeChatIndex);
    }
}

function setChatListListener() {
    chatList.querySelectorAll('div').forEach((chat) => {
        chat.addEventListener('click', () => {
            const index = Array.from(chatList.querySelectorAll('div')).indexOf(chat);
            refreshChatView(index);
        });
    });
    document.querySelectorAll('.delete-chat-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const index = Array.from(document.querySelectorAll('.delete-chat-btn')).indexOf(btn);
            deleteChat(index);
        });
    });
}

function newChat() {
    const newChatName = prompt('Enter chat name:');
    const assistantDescription = prompt('Assistant description (you can leave this empty for default assistant):')
    if (newChatName) {
        chats.push({'title': newChatName, 'messages': []});
        const index = chats.length - 1;
        if (assistantDescription) {
            chats[index].messages.push({
                'role': 'system',
                'text': assistantDescription
            });
        }
        refreshChatView(index);
    }
}

function createNewMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', message.role);
    const sentMessageText = document.createElement('p');
    sentMessageText.textContent = message.text;
    messageElement.appendChild(sentMessageText);
    return messageElement;
}

function newMessage(message) {
    chats[activeChatIndex].messages.push(message);
    refreshChats();
    messageList.appendChild(createNewMessageElement(message));
    messageList.scrollTop = messageList.scrollHeight;
}

function openChat(index) {
    const chat = chats[index];
    if (chat) {
        chatViewHeader.textContent = chat.title;
        messageList.innerHTML = '';
        if (chat.messages) {
            chat.messages.forEach(message => {
                messageList.appendChild(createNewMessageElement(message));
            });
            // Scroll to bottom of message list
            messageList.scrollTop = messageList.scrollHeight;
        }
    } else {
        chatViewHeader.textContent = '';
        messageList.innerHTML = '';
    }
    messageInput.focus();
}

function onDataReceived(data) {
    console.log(data);
    let role, text;
    if (data.choices) {
        role = data.choices[0].message.role;
        text = data.choices[0].message.content;
    } else if (data.error) {
        role = 'system';
        text = data.error.message;
    } else {
        role = 'system';
        text = 'Error';
    }
    newMessage({
        role: role,
        text: text
    })
}

function sendRequest(messages) {
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKeyInput.value
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages.map(message => {
                return {
                    role: message.role,
                    content: message.text
                }
            }),
        })
    })
        .then(response => response.json())
        .then(data => onDataReceived(data))
        .catch(error => {
            console.error(error);
            newMessage({
                role: 'system',
                text: error
            })
        });
}

function send() {
    if (messageInput.value.trim() !== '') {
        newMessage({
            role: 'user',
            text: messageInput.value.trim()
        });
        messageInput.value = '';
        sendRequest(chats[activeChatIndex].messages);
    }
}

addChatBtn.addEventListener('click', () => {
    newChat();
});

sendBtn.addEventListener('click', () => {
    send();
});

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'n') {
        newChat();
    }
    if (e.altKey && e.key === 'd') {
        deleteChat(activeChatIndex)
    }
});

messageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        send();
    }
});