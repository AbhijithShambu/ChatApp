import React from 'react'
import utils from '../Utils'

function Message({ sender , message, viewProps }) {
    let messageClass = viewProps.rightLayout ? "message right-layout" : "message"
    if (viewProps.hideSenderInfo) {
        messageClass += " hide-sender-info"
    }

    let mediaElement = <div></div>
    const pattern = new RegExp(".*\.[jpg|png|jpeg]$")
    if (pattern.exec(message.mediaContent)) {
        mediaElement = <img src={new URL(message.mediaContent)} alt="" className="message-media" 
            width="200px" height="200px" style={ { objectFit:"contain", margin: "2px"} }/>
    }

    return (
        <div className={ messageClass }>
            <img src={ new URL(sender.picture || utils.getDefaultPicture()) } 
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

export default Message
