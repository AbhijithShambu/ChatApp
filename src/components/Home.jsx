import React, { useState, useEffect } from 'react'
import firestoreDB from '../firestoreDB'
import Chat from './Chat'
import UserChats from './UserChats'
import './Home.css'

function Home() {
    const [user, setUser] = useState(null)
    const [contacts, setContacts] = useState({})
    const [chats, setChats] = useState([])
    const [chatMessages, setChatMessages] = useState({})

    const [currentChat, setCurrentChat] = useState(null)

    let phone = 8888888888 // todo: Remove Hardcoded

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('phone')) {
      phone = Number.parseInt(urlParams.get('phone'))
    }

    useEffect(() => {
        const db = firestoreDB()
        db.userInfoObserver(phone, (userInfo)=>{
          setUser(userInfo)
          console.log("UserInfo")
          console.log(userInfo)

          db.userChatsObserver(userInfo.userId, ({users, chats})=>{
            const userContacts = {}
            users.forEach((user)=>{
                userContacts[user.userId] = user
            })

            setContacts(userContacts)
            console.log("Contacts:")
            console.log(userContacts)

            setChats(chats)
            console.log("Chats:")
            console.log(chats)

          })

          db.userMessagesObserver(userInfo.userId, (messages)=>{
            setChatMessages(messages)
            console.log("Messages:")
            console.log(messages)
          })
        })
        
      }, [phone])

    const handleChatClick = (chat)=>{
      console.log("Chat clicked: "+chat)
      setCurrentChat(chat)
 
      // firestoreDB().markAllMessagesAsRead(user.userId, 
      //   chat, chatMessages[chat.chatId])
    }

    return (
        <div className="home">
            <UserChats user={ user } contacts={ contacts } chats={ chats }
              onChatClick={(chatId)=>handleChatClick(chatId)}/>

            <Chat user={ user } contacts={ contacts } 
              chat={ currentChat } messages={ chatMessages[currentChat && currentChat.chatId] || [] }/>
        </div>
    )
}

export default Home
