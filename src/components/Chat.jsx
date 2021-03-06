import { React, useState, useEffect, useRef } from 'react'
import firestoreDB from '../firestoreDB'
import './Chat.css'
import Message from './Message'
import utils from '../Utils'

function Chat({ user, contacts, chatObj, messages, setMessages, setView}) {
    const [chat, setChat] = useState(chatObj)
    const [messageText, setMessageText] = useState("")
    const [messageMedia, setMessageMedia] = useState(null)
    const scrollToEle = useRef(null)

    const [timer, setTimer] = useState(undefined)

    const scrollToBottom = (smoothScroll=false) => {
        scrollToEle.current?.scrollIntoView(smoothScroll ? { behavior: "smooth" } : {})
    }

    useEffect(()=>{
        let unsubscribe = ()=>{}
        if (chatObj && !chatObj.isNewChat) {
            unsubscribe = firestoreDB().chatObserver(chatObj.chatId, (newChat)=>{
                setChat(newChat)
            }, (error)=>console.log({ chatObserverError: error }))
        }
        return ()=>unsubscribe()
    }, [chatObj])

    useEffect(() => {
        scrollToBottom()
        if (messages.length > 0) {
            const latestMsg = messages[messages.length-1]
            if (chat && !chat.isNewChat && latestMsg.senderId !== user.userId && latestMsg.recipientStatus[user.userId] !== 2) {
                firestoreDB().markAllMessagesAsRead(user.userId, chat, messages)
            }
        }
    }, [messages, user?.userId, chat]);

    if (!chat) {
        return <div></div>
    }

    const typingStatus = (isTyping)=>{
        // console.log(`User ${isTyping ? "started" : "stopped"} typing`)
        if (!chat.isNewChat) {
            firestoreDB().typingEvent(user.userId, chat.chatId, isTyping)
        }
    }

    const handleOnKeyPress = (event)=>{
        timer ? clearTimeout(timer) : typingStatus(true)

        setTimer(setTimeout(()=>{
            typingStatus(false)
            setTimer(undefined)
        }, 500))
    }

    const handleOnBlur = (event)=>{
        if (timer) clearTimeout(timer)
        setTimer(undefined)
        typingStatus(false)
    }

    const sendMessage = (message)=>{
        firestoreDB().sendMessage(user, chat, message).then(()=>{}, (error)=>{
            const updatedMessages = [...messages]
            updatedMessages[messages.indexOf(message)] 
                = {...message, 'status': "Failed"}
            setMessages(chat.chatId, updatedMessages)
        })
    }

    const handleSendMessage = ()=>{
        // console.log("Send clicked: "+messageText)
        if (messageText || messageMedia) {
            // Prepare a message
            const timeStamp = Date.now()
            const message = {
                messageId: timeStamp.toString(),
                chatId: chat.chatId,
                senderId: user.userId,
                recipients: chat.participants,
                status: "...",
                timestamp: utils.createTimestamp(new Date(timeStamp)),
                textContent: messageText
            }
            if (messageMedia) {
                message['mediaContent'] = messageMedia 
            }

            // Update the messages list with new nessage in local
            setMessages(chat.chatId, [...messages, message])
            
            // Send the message
            sendMessage(message)

            setMessageText("")
            setMessageMedia(null)
        }
    }

    let name = ""
    let desc = ""
    if (chat.type === 'individual') {
        const chatUser = contacts[chat.participants
            .filter((participant)=>user.userId !== participant).pop()]
        name = chatUser.name
        desc = chatUser.status
    } else if (chat.type === 'group'){
        name = chat.name
    }
    let typing = undefined
    if(chat?.participantsData) {
        Object.entries(chat.participantsData).forEach(([id, data])=>{
            if (id !== user.userId && data.isTyping) {
                typing = `${contacts[id]?.name} is typing...`
                return
            }
        })
    }

    const handleOnChatInfoClick = ()=>{
        if (chat.type === "individual") {
            setView({
                type: "chatInfo",
                contact: contacts[chat.participants
                    .filter((participant)=>user.userId !== participant).pop()],
            })
        } else if (chat.type === "group") {
            setView({
                type: "groupChatInfo",
                chat: chat,
            })
        }
    }

    return (
        <div className="right-component chat">
            <div className="chat-toolbar">
                <div className="chat-info" onClick={(e)=>handleOnChatInfoClick()}>
                    <h3 className="chat-name">{name}</h3>
                    <p className="chat-desc">{ typing || desc }</p>
                </div>
                <div className="icon-options">

                </div>
            </div>

            <div className="chat-body" >
                <ul className="messages-list">{ messages.map((message, index)=>{
                    const hideSenderInfo = index > 0 && 
                        messages[index-1]?.senderId === message.senderId
                    const isSelfMsg = user.userId === message.senderId
                    
                    let showDateEle = false
                    if (index > 0) {
                        const prevMsg = messages[index-1]
                        showDateEle = !utils.isSameDay(prevMsg.timestamp.toDate(),
                            message.timestamp.toDate())
                    } else { showDateEle = true }
                    return (<li key={message.messageId}>
                        { showDateEle && 
                        <p className="date">{utils.getShortDateInWords(message.timestamp.toDate())}</p>}
                        <Message 
                            sender={contacts[message.senderId]}
                            message={message}
                            viewProps = {{
                                rightLayout: isSelfMsg,
                                hideSenderInfo: hideSenderInfo,
                                showName: chat.type === "group" && !isSelfMsg
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
