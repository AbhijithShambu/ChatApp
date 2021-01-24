import React from 'react'
import { Badge } from 'react-bootstrap'
import './ProfileListItem.css'

const defaultPicture = "https://workhound.com/wp-content/uploads/2017/05/placeholder-profile-pic.png"

function ProfileListItem({ title, description, picture, subText="", notificationsCount=0, onClick=(_)=>{}}) {
    const elementVisiblity = (isVisible)=> isVisible ? {} : { display: "none" }

    return (
        <div className="profile-list-item" onClick={onClick}>
            <img src={ picture || defaultPicture } alt="" className="profile-picture"/>
            <div className="profile-info">
                <h6 className="profile-title">{ title }</h6>
                <p className="profile-description">{ description }</p>
            </div>
            <div className="profile-other-info">
                <p className="profile-subtext">{ subText }</p>
                <Badge style={ elementVisiblity(notificationsCount) } 
                    id="profile-notifications-count" pill variant="success">{notificationsCount}</Badge>{' '}
            </div>
        </div>
    )
}

export default ProfileListItem
