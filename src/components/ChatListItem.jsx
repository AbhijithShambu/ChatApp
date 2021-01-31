import React from 'react'
import ProfileListItem from './ProfileListItem.jsx'
import utils from '../Utils'

function ChatListItem({ user, contacts, chat, onClick }) {
    let name = ""
    let picture = ""
    let lastMessage = ""
    if (chat.type === 'individual') {
        const chatUser = contacts[chat.participants.filter((participant)=>user.userId !== participant).pop()]
        name = chatUser.name
        picture = chatUser.picture
        if (chat.lastMessage) {
            lastMessage = chat.lastMessage.textContent
        }
    } else if (chat.type === 'group'){
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

    const unreadCount = chat.participantsData[user.userId]?.unreadMessages || 0

    let isTyping = undefined
    Object.entries(chat.participantsData).forEach(([id, data])=>{
        if(id !== user.userId && data.isTyping) {
            isTyping = `${contacts[id]?.name} is typing...`
            return
        }
    })
    
    return (
        <ProfileListItem 
            title={name} 
            description={ isTyping || lastMessage || "..."}  
            picture={picture}
            subText={utils.getShortDate(chat.lastActivity.toDate())} 
            notificationsCount={unreadCount}
            onClick={(_)=>onClick(chat)}
        />
    );
}

export default ChatListItem
