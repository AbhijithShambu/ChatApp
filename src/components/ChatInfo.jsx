import React, { useState, useEffect } from 'react'
import utils from '../Utils'
import ProfileListItem from "./ProfileListItem"
import backIcon from '../assets/arrow-left-circle-fill.svg'
import './ChatInfo.css'

function ChatInfo({ contact, groupChats, setView }) {
    const [commonGroups, setCommonGroups] = useState([])
    useEffect(() => {
        setCommonGroups(groupChats.filter((groupChat)=>{
            return groupChat.participants.includes(contact)
        }))
    }, [contact, groupChats])
    return (
        <div className="right-component chat-info">
            <div className="header">
                <img onClick={(e)=>setView && setView("home")} 
                 src={ backIcon } alt="" className="back-icon"/>
                <div className="header-info">
                    <h5>{ contact.name }</h5>
                </div>
                <img width="100%" height="250px" style={{objectFit:"contain"}}
                 src={ contact.picture || utils.getDefaultPicture()} alt=""/>
            </div>

            <div className="section">
                <p className="section-title">About and phone number</p>
                <div className="border-bottom">
                    <p className="item-title">{ contact.description }</p>
                    {/* <p className="item-subtext">subtext</p> */}
                </div>
                <div className="item-title-subtext">
                    <p style={{marginTop:"4px"}}>{ contact.phone }</p>
                    <p className="subtext">Mobile</p>
                </div>
            </div>

            <div className="section" 
                style={ commonGroups?.length > 0 ? {display:"block"}: {display:"none"}}>
                <div className="section-header title-subtext-right">
                    <p className="section-title">Groups in common</p>
                    <p>{commonGroups.length}</p>
                </div>
                <ul className="list">
                    { commonGroups.map((groupChat)=>{<li>
                        <ProfileListItem
                            title={groupChat.name}
                            description={groupChat.description}
                            picture={ groupChat.picture }/>
                    </li>})}
                </ul>
            </div>
        </div>
    )
}

export default ChatInfo
