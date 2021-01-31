import React, { useState, useEffect } from 'react'
import firestoreDB from '../firestoreDB'
import Chat from './Chat'
import UserChats from './UserChats'
import Contacts from './Contacts'
import CreateGroup from './CreateGroup'
import ChatInfo from './ChatInfo'
import GroupChatInfo from './GroupChatInfo'
import './Home.css'

function Home() {
    const [user, setUser] = useState(null)
    const [connections, setConnections] = useState({})
    const [chats, setChats] = useState([])
    const [chatMessages, setChatMessages] = useState({})
    const [contacts, setContacts] = useState([])
    const [currentChat, setCurrentChat] = useState(null)
    const [currentChatId, setCurrentChatId] = useState(undefined)
    const [leftView, setLeftView] = useState("home")
    const [rightView, setRightView] = useState("home")

    let phone = 8888888888 // todo: Remove Hardcoded

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('phone')) {
      phone = Number.parseInt(urlParams.get('phone'))
    }

    useEffect(() => {
        const db = firestoreDB()
        let unsubscribeChats = ()=>{}
        let unsubscribeConnections = ()=>{}
        let unsubscribeMessages = ()=>{}
        const unsubscribeUser = db.userInfoObserver(phone, (userInfo)=>{
          setUser(userInfo)

          const unsubscribeFns = db.userChatsObserver(userInfo.userId, ({users, chats})=>{
            const userConnections = {}
            users.forEach((user)=>{
                userConnections[user.userId] = user
            })

            console.log({ chatsObserver: chats })
            setConnections(userConnections)
            setChats(chats)

            if (currentChatId) {
              setCurrentChat(chats[currentChatId])
            }

            // Prepare contacts info
            const userContacts = []
            userInfo?.contacts?.forEach((contactId)=>{
              const contactInfo = userConnections[contactId]
              if (contactInfo) {
                chats.forEach((chat)=>{
                  if (chat.type === "individual" && 
                  chat.participants.includes(contactId)) {
                    contactInfo['chat'] = chat
                  }
                })
                userContacts.push(contactInfo)
              }
            })
            console.log({
              user:userInfo,
              contacts:userContacts
            })
            setContacts(userContacts)
          })
          unsubscribeConnections = unsubscribeFns[0]
          unsubscribeChats = unsubscribeFns[1]

          unsubscribeMessages = db.userMessagesObserver(userInfo.userId, (messages)=>{
            setChatMessages(messages)
          })
        })
        
        return ()=>{
          unsubscribeUser()
          unsubscribeConnections()
          unsubscribeChats()
          unsubscribeMessages()
        }
      }, [phone])

    const handleChatClick = (chat)=>{
      if (currentChat !== chat) {
        console.log("Chat clicked: "+chat)
        setCurrentChat(chat)
        setCurrentChatId(Object.assign(chat?.chatId))
        setRightView("home")
  
        firestoreDB().markAllMessagesAsRead(user.userId, 
          chat, chatMessages[chat.chatId] || [])
      }
    }

    const setMessagesForChat = (chatId, messages)=>{
      const newChatMessages = {...chatMessages}
      newChatMessages[chatId] = messages
      setChatMessages(newChatMessages)
    }

    const getLeftView = ()=>{
      if (leftView === "contacts") {
        return <Contacts user={ user } userContacts={ contacts } activeChatId={ currentChat?.chatId }
              onChatClick={(chatId)=>handleChatClick(chatId)} setView={setLeftView}/>
      } else if (leftView === "createGroup") {
        return <CreateGroup user={ user } userContacts={ contacts } setView={ setLeftView }/>
      } 
      else {
        return <UserChats user={ user } contacts={ connections } 
          chats={ chats } activeChatId={ currentChat?.chatId }
          onChatClick={(chatId)=>handleChatClick(chatId)} setView={setLeftView}/>
      }
    }

    const getRightView = ()=>{
      if (typeof rightView !== "string" && "type" in rightView) {
        if (rightView.type === "chatInfo") {
          return <ChatInfo contact={rightView.contact} 
            groupChats={ Object.values(chats).filter((chat)=>chat.type === "group") }
            setView={ setRightView }/>
        } else if (rightView.type === "groupChatInfo") {
          return <GroupChatInfo chat={ rightView.chat }
            connections={ connections }
            setView = { setRightView } />
        } else if (rightView.type === "home") {
          const matches = Object.values(chats).filter((chat)=>{
            return chat.type === "individual" 
              && chat.participants.includes(rightView.contactId) 
          })
          if (matches.length > 0 && rightView.contactId !== user.userId) {
            handleChatClick(matches.pop())
          }
        }
      } else {
        return <Chat user={ user } contacts={ connections } 
          chatObj={ chats[currentChat?.chatId] || currentChat } 
          messages={ chatMessages[currentChat && currentChat.chatId] || [] }
          setMessages={ setMessagesForChat } setView={ setRightView }/>
      }
    }

    if (!user) return <div></div>

    return (
        <div className="home">
            { getLeftView() }

            { getRightView() }
        </div>
    )
}

export default Home
