import React from 'react'
import utils from '../Utils'
import backIcon from '../assets/arrow-left-circle-fill.svg'
import ProfileListItem from "./ProfileListItem"
import { Badge } from "react-bootstrap"
import './ChatInfo.css'

function GroupChatInfo({ chat, connections, setView }) {
    return (
        <div className="right-component chat-info">
            <div className="header">
                <img onClick={(e)=>setView && setView("home")} 
                 src={ backIcon } alt="" className="back-icon"/>
                <div className="header-info">
                    <h5>{ chat.name }</h5>
                    <p>created by: creater name</p>
                </div>
                <img width="100%" height="250px" style={{objectFit:"contain"}}
                 src={ chat.picture || utils.getDefaultPicture() } alt=""/>
            </div>

            <div className="section">
                <p>{ chat.description }</p>
           </div>

            <div className="section">
                <div className="section-header title-subtext-right">
                    <p className="section-title">Participants</p>
                    <Badge pill variant="success">{ chat.participants.length}</Badge>{' '}
                </div>
                <ul className="list">
                    { chat.participants.map((participantId)=>{
                        const participant = connections[participantId]
                        if (participant) {
                            return <li>
                                <ProfileListItem
                                    title={ participant.name }
                                    description={ participant.description }
                                    picture={ participant.picture }
                                    onClick={(e)=>{ setView({ type:"home", contactId: participantId} ) }}/>
                            </li>
                        }
                    })}
                </ul>
            </div>
        </div>
    )
}

export default GroupChatInfo
