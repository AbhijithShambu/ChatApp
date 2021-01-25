import { React, useState, useEffect, useRef } from 'react'
import firestoreDB from '../firestoreDB'
import './Chat.css'
import utils from '../Utils'

const defaultPicture = "https://workhound.com/wp-content/uploads/2017/05/placeholder-profile-pic.png"

function Chat({ user, contacts, chat, messages}) {
    const [messageText, setMessageText] = useState("")
    const [messageMedia, setMessageMedia] = useState(null)
    const scrollToEle = useRef(null)

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

    // useEffect(() => {
    //     console.log({ UIChat: {
    //         user: user,
    //         contacts: contacts,
    //         chat: chat,
    //         messages: messages
    //     }})
    // }, [chat])

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

    const createMessage = (message, isSameSender)=>{
        let sender = user
        let messageClass = "message right-layout"
        if (message.senderId != user.userId) {
            sender = contacts[message.senderId]
            messageClass = "message"
        }

        if (isSameSender) {
            messageClass += " same-sender"
        }

        let mediaElement = <div></div>
        const pattern = new RegExp(".*\.[jpg|png|jpeg]$")
        if (pattern.exec(message.mediaContent)) {
            mediaElement = <img src={new URL(message.mediaContent)} alt="" className="message-media" 
                width="200px" height="200px" style={ { objectFit:"contain", margin: "2px"} }/>
        }

        return (
            <div className={ messageClass }>
                <img src={ new URL(sender.picture || defaultPicture) } 
                    alt="" className="sender-picture"/>
                <div className="message-container">
                    <div className="message-layout">
                        <div className="message-header">

                        </div>
                        { mediaElement }
                        <div className="message-body">
                            <p className="message-text">{ message.textContent }</p>
                            <p className="message-timestamp">{ utils.getShortDate(message.timestamp.toDate()) }</p>
                        </div>
                    </div>
                    <p className="message-status">{message.status}</p>
                </div>
            </div>
        );
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
                    <p className="chat-desc">{ desc }</p>
                </div>
                <div className="icon-options">

                </div>
            </div>

            <div className="chat-body" >
                <ul className="messages-list">
                    { 
                        messages.map((message, index)=>{
                            return <li key={message.messageId}>{createMessage(message, 
                                index > 0 && messages[index-1]?.senderId === message.senderId)}</li>
                        })
                    }
                </ul>
                <div  ref={scrollToEle}></div>
            </div>

            <div className="message-box">
                <div className="input-group message-input-box">
                    <input type="text" className="form-control message-input"
                        placeholder="Type a message"
                        value={messageText}
                        onChange={(event)=>setMessageText(event.target.value)}/>
                </div>
                <button className="btn btn-success message-send"
                    onClick={(_)=>handleSendMessage()}>Send</button>
            </div>

        </div>
    )
}

export default Chat
