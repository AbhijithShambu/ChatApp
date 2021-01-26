import { React, useState, useEffect, useRef } from 'react'
import firestoreDB from '../firestoreDB'
import './Chat.css'
import Message from './Message'

function Chat({ user, contacts, chat, messages}) {
    const [messageText, setMessageText] = useState("")
    const [messageMedia, setMessageMedia] = useState(null)
    const [anyoneTyping, setAnyoneTyping] = useState(undefined)
    const scrollToEle = useRef(null)

    const [timer, setTimer] = useState(undefined)

    const scrollToBottom = (smoothScroll=false) => {
        scrollToEle.current?.scrollIntoView(smoothScroll ? { behavior: "smooth" } : {})
    }

    useEffect(() => {
        scrollToBottom()
        if (messages.length > 0) {
            const latestMsg = messages[messages.length-1]
            if (latestMsg.senderId != user.userId && latestMsg.recipientStatus[user.userId] !== 2) {
                firestoreDB().markAllMessagesAsRead(user.userId, chat, messages)
            }
        }
    }, [messages]);

    useEffect(() => {
        if(chat?.participantsData) {
            let typing = undefined
            Object.entries(chat.participantsData).map(([id, data])=>{
                if (id !== user.userId && data.isTyping) {
                    typing = `${contacts[id]?.name} is typing...`
                }
            })
            setAnyoneTyping(typing)
        }
    }, [chat?.participantsData])


    if (!chat) {
        return <div></div>
    }

    let name = ""
    let desc = ""
    if (chat.type == 'individual') {
        const chatUser = contacts[chat.participants
            .filter((participant)=>user.userId != participant).pop()]
        name = chatUser.name
        desc = chatUser.status
    } else if (chat.type == 'group'){
        name = chat.name
    }

    const typingStatus = (isTyping)=>{
        // console.log(`User ${isTyping ? "started" : "stopped"} typing`)
        firestoreDB().typingEvent(user.userId, chat.chatId, isTyping)
    }

    const handleOnKeyPress = (event)=>{
        timer ? clearTimeout(timer) : typingStatus(true)

        setTimer(setTimeout(()=>{
            typingStatus(false)
            setTimer(undefined)
        }, 250))
    }

    const handleOnBlur = (event)=>{
        if (timer) clearTimeout(timer)
        setTimer(undefined)
        typingStatus(false)
    }

    const handleSendMessage = ()=>{
        // console.log("Send clicked: "+messageText)
        if (messageText || messageMedia) {
            firestoreDB().sendMessage(user, chat, messageText, messageMedia)
            setMessageText("")
            setMessageMedia(null)
        }
    }

    return (
        <div className="chat">
            <div className="chat-toolbar">
                <div className="chat-info">
                    <h3 className="chat-name">{name}</h3>
                    <p className="chat-desc">{ anyoneTyping || desc }</p>
                </div>
                <div className="icon-options">

                </div>
            </div>

            <div className="chat-body" >
                <ul className="messages-list">{ 
                    messages.map((message, index)=>{
                        const hideSenderInfo = index > 0 && 
                            messages[index-1]?.senderId === message.senderId
                        
                        return (<li key={message.messageId}>
                            <Message 
                                sender={contacts[message.senderId]}
                                message={message}
                                viewProps = {{
                                    rightLayout: user.userId == message.senderId,
                                    hideSenderInfo: hideSenderInfo,
                                }}/>
                        </li>);
                    })
                    }</ul>
                <div  ref={scrollToEle}></div>
            </div>

            <div className="message-box">
                <div className="input-group message-input-box">
                    <input type="text" className="form-control message-input"
                        placeholder="Type a message"
                        value={messageText}
                        onChange={(event)=>setMessageText(event.target.value) }
                        onKeyPress={(event)=>handleOnKeyPress(event)}
                        onBlur={(e)=>{handleOnBlur(e)}}/>
                </div>
                <button className="btn btn-success message-send"
                    onClick={(_)=>handleSendMessage()}>Send</button>
            </div>

        </div>
    )
}

export default Chat
