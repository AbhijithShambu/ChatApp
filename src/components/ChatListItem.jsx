import React from 'react'
import ProfileListItem from './ProfileListItem.jsx'

function ChatListItem({ user, contacts, chat, onClick }) {
    let name = ""
    let picture = ""
    let lastMessage = ""
    if (chat.type == 'individual') {
        const chatUser = contacts[chat.participants.filter((participant)=>user.userId != participant).pop()]
        name = chatUser.name
        picture = chatUser.picture
        if (chat.lastMessage) {
            lastMessage = chat.lastMessage.textContent
        }
    } else if (chat.type == 'group'){
        name = chat.name
        picture = chat.picture
        
        if (chat.lastMessage) {
            const messageSender = contacts[chat.lastMessage.senderId]
            if (messageSender) {
                lastMessage = messageSender.name + ":  "
            }
            lastMessage += chat.lastMessage.textContent
        }
    }

    const unreadCount = chat.participantsData[user.userId].unreadMessages
    
    return (
        <ProfileListItem 
            title={name} 
            description={lastMessage || "..."}  
            picture={picture}
            subText={chat.lastActivity.toDate().toLocaleTimeString()} 
            notificationsCount={unreadCount}
            onClick={(_)=>onClick(chat)}
        />
    );
}

export default ChatListItem
