import React, { useState, useEffect } from 'react'
import firestoreDB from '../firestoreDB'
import ProfileListItem from "./ProfileListItem"
import './Contacts.css'
import backLogo from '../assets/arrow-left-circle-fill.svg'
// import plusLogo from '../assets/plus-circle.svg'
import searchLogo from '../assets/search.svg'

function Contacts({ user, userContacts, activeChatId, onChatClick, setView }) {
    const [contacts, setContacts] = useState([])
    const [searchText, setSearchText] = useState("")

    const [newContactInputError, setNewContactInputError] = useState(undefined)
    const [newContactName, setNewContactName] = useState("")
    const [newContactNumber, setNewContactNumber] = useState("")

    useEffect(() => {
        setContacts(userContacts.sort((a, b)=>a.name > b.name ? 1 : -1))
    }, [userContacts])

    const filterContacts = (text)=>{
        if (text === "") return contacts
        const pattern = text.toLowerCase()
        return contacts.filter((contact)=>{
            return contact.name.toLowerCase().includes(pattern) 
            || contact.phone.toString().includes(pattern)
        })
    }

    const handleBackPress = ()=>{
        setView && setView("home")
    }

    const handleCreateContact = ()=>{
        if (newContactName.length > 0 && newContactNumber.length === 10) {
            firestoreDB().addContact(user.userId,
                newContactName, parseInt(newContactNumber))

            setNewContactName("")
            setNewContactNumber("")
            setNewContactInputError("")
        } else {
            setNewContactInputError("Input is not valid")
        }
    }

    const handleOnContactClick = (contact)=>{
        if (contact.type === "user") {
            const chat = contact.chat || firestoreDB()
                .createNewIndividualChatObject(user.userId, contact.userId)
            onChatClick(chat)
        } else {
            // todo: display popup saying contact is not a user of ChatApp
            window.alert(`${contact.name} is not a user of ChatApp`)
        }
    }

    return (
        <div className="left-component">
            <div className="header">
                <img src={ backLogo } style={{ marginLeft:"10px", marginRight: "10px", color:"black"}}
                    alt="Back" className="back-btn"
                    onClick={(e)=>{handleBackPress()}}/>
                <h4 className="title">Contacts</h4>
            </div>
            <div className="body">
                <div style={{margin:"5px", marginBottom:"10px", border:"1px solid black", borderRadius:"5px"}} className="create-contact-layout">
                    <p style={{color:"red", margin:"4px"}} className="create-contact-error">{newContactInputError}</p>
                    <input type="text" className="form-control" 
                        placeholder="Enter a name"
                        value={newContactName}
                        onChange={(e)=>{setNewContactName(e.target.value);setNewContactInputError("")}}/>
                    <input type="number" className="form-control" 
                        placeholder="Enter a phone number"
                        value={newContactNumber}
                        onChange={(e)=>{setNewContactNumber(e.target.value);setNewContactInputError("")}}/>
                    <div className="btn-success create-contact" onClick={(e)=>{handleCreateContact()}}>
                        {/* <img src={ plusLogo } alt=""/> */}
                        <p>Create new contact</p>
                    </div>
                </div>
                
                <div className="search">
                    <img style={{margin:"4px"}} src={searchLogo} alt="Search:"/>
                    <input type="text" className="search-input"
                        value={searchText}
                        onChange={(e)=>setSearchText(e.target.value)}/>
                </div>
                <ul className="list">
                    { filterContacts(searchText).map((contact)=>{
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
        </div>
    )
}

export default Contacts
