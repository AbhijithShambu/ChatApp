import React, { useState, useEffect } from 'react'
import ChatListItem from './ChatListItem'
import ProfileListItem from './ProfileListItem'
import './UserChats.css'

function UserChats({ user, contacts, chats, onChatClick }) {
    const [searchText, setSearchText] = useState("")

    const filterChats = (search)=>{
        if (search == "") {
            return chats
        } else {
            const pattern = new RegExp(search)
            return chats.filter((chat)=>{
                for (let property in chat) {
                    if (pattern.exec(chats[property])) {
                        return true
                    }
                }
                return false
            })
        }
    }

    const filterContacts = (search)=>{
        const pattern = new RegExp(search)
        return Object.values(contacts).filter((contact)=>{
            for (const property in contact) {
                if (pattern.exec(contact[property])) {
                    return true
                }
            }
            return false
        })
    }

    const createNewChat = (contact)=> {
         return {
             chatId:Date.now().toString(),
             type:"individual",
             participants:[user.userId, contact.userId],
             lastActivity:new Date(Date.now()),
             createdBy:user.userId
         }
    }

    return (
        <ul className="chat-list">
            { filterChats(searchText).map((chat)=>{
                return (
                    <li key={chat.chatId}>
                        <ChatListItem user={user} contacts={contacts} chat={chat} 
                            onClick={onChatClick}/>
                    </li>
                )
            })}
            { searchText !== "" && filterContacts(searchText).map((contact)=>{
                return (
                    <li key={contact.userId}>
                        <ProfileListItem title={contact.name} description={contact.description}
                            picture={contact.picture} onClick={(_)=>{onChatClick(createNewChat(contact))}}/>
                    </li>
                )
            })}
        </ul>
    )
}

export default UserChats
