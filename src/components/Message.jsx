import React from 'react'
import { Dropdown } from 'react-bootstrap'
import utils from '../Utils'
import './Message.css'

function Message({ sender , message, viewProps }) {
    if (!sender) return <div></div>

    let messageClass = viewProps.rightLayout ? "message right-layout" : "message"
    if (viewProps.hideSenderInfo) {
        messageClass += " hide-sender-pic"
    } else if (viewProps.showName) {
        messageClass += " show-sender-name"
    }

    let mediaElement = <div></div>
    const pattern = new RegExp(".*[jpg|png|jpeg]$")
    if (pattern.exec(message.mediaContent)) {
        const downloadMedia = ()=>{
             // todo:
        }

        mediaElement = (
            <div className="message-media">
                <div style={{ display:"none" }} className="media-download">
                    <button onClick={(_)=>downloadMedia()} className="btn btn-secondary">Downlaod</button>
                </div>
                <img src={new URL(message.mediaContent)} alt="" 
                    className="message-media" 
                    width="200px" height="200px"
                    style={ { objectFit:"contain", margin: "2px"} }/>
            </div>  
        )
    }

    let date = message.timestamp
    if ("toDate" in date) {
        date = date.toDate()
    }

    return (
        <div className={ messageClass }>
            <img src={ new URL(sender.picture || utils.getDefaultPicture()) } 
                alt="" className="sender-picture"/>
            <div className="message-container">
                <p id="sender-name">{sender.name}</p>
                <div className="message-layout">
                    <div className="message-header">

                    </div>
                    { mediaElement }
                    <div className="message-body">
                        <p className="message-text">{ message.textContent }</p>
                        <p className="message-timestamp">{ utils.getTime(date) }</p>
                    </div>
                </div>
                <p className="message-status">{message.status}</p>
            </div>
            <div className="message-options">
                <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-basic"
                        style={{
                            margin:"0px", 
                            padding:"0px 4px", 
                            background:"rgba(150, 156, 211, 0.5)",
                            border:"0px"
                        }}
                    ></Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item href="#/action-1">Forward</Dropdown.Item>
                        <Dropdown.Item href="#/action-2">Reply-to</Dropdown.Item>
                        <Dropdown.Item href="#/action-3">Info</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
}

export default Message
