import React, { useState, useEffect } from 'react'
import utils from '../Utils'
import ChatListItem from './ChatListItem'
import ProfileListItem from './ProfileListItem'
import './UserChats.css'
import firestoreDB from '../firestoreDB'
import contactsLogo from '../assets/person-lines-fill.svg'

function UserChats({ user, contacts, chats, onChatClick, activeChatId, setView }) {
    const [searchText, setSearchText] = useState("")
    const [contactsWithChat, setContactsWithChat] = useState([])

    useEffect(() => {
        let chatContacts = []
        chats?.forEach((chat)=>{
            chatContacts = [...chatContacts, 
                ...chat.participants.filter((participant)=>!chatContacts.includes(participant))]
        })
        setContactsWithChat(chatContacts)
    }, [chats])

    if (!user) {
        return <div></div>
    }

    const filterChats = (search)=>{
        if (search === "") {
            return chats
        } else {
            const pattern = new RegExp(search.toLowerCase())
            return chats.filter((chat)=>{
                const chatInfo = utils.getChatInfo(user, chat, contacts)
                for (let property in chatInfo) {
                    if (pattern.exec(chatInfo[property]?.toString()?.toLowerCase())) {
                        return true
                    }
                }
                return false
            })
        }
    }

    const filterContacts = (search)=>{
        const pattern = new RegExp(search.toLowerCase())
        return Object.values(contacts).filter((contact)=>{
            if (!contactsWithChat.includes(contact.userId)) {
                for (const property in contact) {
                    if (pattern.exec(contact[property]?.toString()?.toLowerCase())) {
                        return true
                    }
                }
            }
            return false
        })
    }

    const handleSearchClick= ()=>{
        // Close keyboard in case of mobiles
    }

    return (
        <div className="left-component">
            <div className="toolbar">
                <img src={user.picture} alt="" className="user-picture"/>
                <h5 className="title">ChatApp</h5>
                <div className="options">
                    <img src={ contactsLogo } alt="" style={{ margin: "5px" }}
                        onClick={ (e)=>setView && setView("contacts") }/>
                     <button className="btn-sm btn-primary" style={{ }}
                        onClick={ (e)=>setView && setView("createGroup") }>New Group</button>
                </div>
            </div>
            <div className="search-layout">
                <form>
                    <input type="text" className="form-control search-input"
                        value={searchText} onChange={(e)=>setSearchText(e.target.value)}/>
                </form>
                <button style={{display:"none"}} type="submit"
                    className="btn btn-primary search-button"
                    onClick={(e)=>{ e.preventDefault();handleSearchClick()}}>Search</button>
            </div>
            <ul className="chat-list">
                { filterChats(searchText).map((chat)=>{
                    return (
                        <li key={chat.chatId} className={chat.chatId === activeChatId ? "active-chat-item":""}>
                            <ChatListItem user={user} contacts={contacts} chat={chat} 
                                onClick={onChatClick}/>
                        </li>
                    )
                })}
                { searchText !== "" && filterContacts(searchText).map((contact)=>{
                    return (
                        <li key={contact.userId}>
                            <ProfileListItem title={contact.name} description={contact.description}
                                picture={contact.picture}
                                onClick={(_)=>{onChatClick(firestoreDB()
                                    .createNewIndividualChatObject(user.userId, contact.userId))}}
                                />
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default UserChats
