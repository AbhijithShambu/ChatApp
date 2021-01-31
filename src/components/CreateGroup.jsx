import React, { useState, useEffect } from 'react'
import ProfileListItem from "./ProfileListItem"
import firestoreDB from "../firestoreDB"
import backLogo from '../assets/arrow-left-circle-fill.svg'
import searchLogo from '../assets/search.svg'
import cameraLogo from '../assets/camera-fill.svg'
import groupIcon from '../assets/groupIcon.png'
import { Badge } from 'react-bootstrap'
import './Contacts.css'
import './CreateGroup.css'

function CreateGroup({ user, userContacts, setView }) {
    const [mode, setMode] = useState("addParticipants")
    const [selectedChats, setSelectedChats] = useState([])

    // addParticipants mode states
    const [contacts, setContacts] = useState([])
    const [searchText, setSearchText] = useState("")
    
    // groupInfo mode states
    const [groupName, setGroupName] = useState("")
    const [groupDesc, setGroupDesc] = useState("")
    const [groupImage, setGroupImage] = useState("")

    useEffect(() => {
        const chatContacts = userContacts
        .filter((contact)=>contact.type==="user")
        .sort((a, b)=>a.name > b.name ? 1 : -1)
        setContacts(chatContacts)
    }, [userContacts])

    const filterChats = (text)=>{
        if (text === "") return contacts
        const pattern = text.toLowerCase()
        return contacts.filter((contact)=>{
            return contact.name.toLowerCase().includes(pattern) 
            || contact.phone.toString().includes(pattern)
        })
    }

    const createBubble = (contact)=>{
        const handleCloseBubble = ()=>{
            setSelectedChats( [...selectedChats.filter((selectedChat)=> contact !== selectedChat)])
        }
        return (
            <div classsName="bubble" 
            style={{display:"flex", margin:"4px", alignItems:"center", 
                padding:"3px 5px", background:"grey", borderRadius:"16px"}}
            >
                <p style={ { color:"white", fontSize:"small", margin:"2px 2px" }}>{contact.name}</p>
                <Badge onClick={(e)=>handleCloseBubble()} pill variant="secondary">x</Badge>{' '}
                {/* <p onClick={(e)=>handleCloseBubble()}>x</p> */}
            </div>
        )
    }

    const handleOnContactClick = (contact)=>{
        if (!selectedChats.includes(contact)) {
            setSelectedChats([...selectedChats, contact])
        }
    }

    const handleBackPress = ()=>{
        if (mode === "addParticipants") {
            setView && setView("home")
        } else if (mode === "groupInfo") {
            setMode("addParticipants")
        }
    }

    const handleCreateGroup = ()=>{
        if (user && groupName.length > 0 && groupDesc.length > 0) {
            const participants = selectedChats.map((contact)=>contact.userId)
            firestoreDB().createGroup(user.userId, groupName, groupDesc, groupImage, participants)
            setView && setView("home")
        }
    }

    const getTitle = ()=>{
        if (mode === "addParticipants") {
            return "Add participants to the Group"
        } else if (mode === "groupInfo") {
            return "Create group"
        }
    }

    const getModeView = ()=>{
        if (mode === "addParticipants") {
            return <div className="body">
                <div className="selected-chats" style={{display:"flex", justifyContent:"flex-start", margin:"10px"}}>
                    {selectedChats.map((contact)=>createBubble(contact))}
                </div>
                <button style={selectedChats.length>0 ? {display:"block", margin:"10px"} : {display:"none"}}
                    onClick={(e)=>{ setMode("groupInfo") }}
                    className="btn-sm btn-success">Next</button>
                <div className="search">
                    <img style={{margin:"4px"}} src={searchLogo} alt="Search:"/>
                    <input type="text" className="search-input"
                        value={searchText}
                        onChange={(e)=>setSearchText(e.target.value)}/>
                </div>
                <ul className="list">
                    { filterChats(searchText).map((contact)=>{
                        return <li className="list-item">
                            <ProfileListItem
                                title={contact.name} 
                                description={contact.phone.toString()} 
                                picture={contact.picture}
                                onClick={(_)=>handleOnContactClick(contact)}
                            />
                        </li>
                    })}
                </ul>
                </div>
        } else if ("groupInfo") {
            return <div className="body group-info">
                <div className="group-image">
                    <div className="input-group-image">
                        <img src={ cameraLogo } alt=""/>
                        <p style={{margin:"0px", fontSize:"small", color:"white"}}>Add Group image</p>
                    </div>
                    <img src={ groupIcon } className="image-circle"/>
                </div>
                <input className="form-control" type="text" placeholder="Enter group name"
                    value={groupName} onChange={(e)=>setGroupName(e.target.value)}/>
                <input className="form-control" type="text" placeholder="Enter group description"
                    value={groupDesc} onChange={(e)=>setGroupDesc(e.target.value)}/>
                <button onClick={(_)=>handleCreateGroup()} 
                    className="btn-sm btn-success">Create Group</button>
            </div>
        }
    }

    return (
        <div className="left-component">
            <div className="header">
                <img src={ backLogo } style={{ marginLeft:"10px", marginRight: "10px", color:"black"}}
                    alt="Back" className="back-btn"
                    onClick={(e)=>{handleBackPress()}}/>
                <h5 className="title">{ getTitle() }</h5>
            </div>
            { getModeView() } 
        </div>
    )
}

export default CreateGroup
