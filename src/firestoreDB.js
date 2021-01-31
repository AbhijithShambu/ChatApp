import db from "./database";
import firebase from 'firebase';
// import utils from './Utils'

class FirestoreDB {
    userInfoObserver = (phone, success, failure=(error)=>{console.log(error)})=>{
        return db.collection('aUser')
        .where('phone', '==', phone)
        .where('type', '==', 'user')
        .onSnapshot((snapshot)=>{
            if(snapshot.docs && snapshot.docs.length > 0) {
                success(snapshot.docs.pop().data())
            } else { failure(new Error("No user found")) }
        }, (error=>failure(error)))
    }

    chatObserver = (chatId, success, failure)=>{
        return db.collection('aChat').doc(chatId)
        .onSnapshot((snapshot)=>{
            if (snapshot) {
                success(snapshot.data())
            } else { failure(new Error(`No chat with ${chatId} exists`)) }
        }, (error)=>failure(error))
    }

    userChatsObserver = (userId, success, failure)=>{
        let usersLoaded = false; let chatsLoaded = false
        let users = []; let chats = []

        const unsubscribeUsers = db.collection('aUser')
        .where('connections', 'array-contains', userId)
        .onSnapshot((snapshot)=>{
            if (snapshot.docs) {
                users = snapshot.docs.map((doc)=>doc.data())
                usersLoaded = true
                if (chatsLoaded) {
                    success({ users: users, chats: chats})
                }
            }
        }, (error)=>failure(error))

        const unsubscribeChats = db.collection('aChat')
        .where('participants', 'array-contains', userId)
        .onSnapshot((snapshot)=>{
            if (snapshot.docs) {
                chats = snapshot.docs.map((doc)=>doc.data())
                chatsLoaded = true
                if (usersLoaded) {
                    success({ users: users, chats: chats})
                }
            }
        }, (error)=>failure(error))

        return [unsubscribeUsers, unsubscribeChats]
    }

    chatMessagesObserver = (chatId, success, failure)=>{
        return db.collection('aMessage')
        .where('chatId', '==', chatId)
        .onSnapshot((snapshot)=>{
            if (snapshot.docs) {
                success(snapshot.docs.map((doc)=>doc.data()))
            } else { success([]) }
        }, (error)=>failure(error))
    }

    userMessagesObserver = (userId, success, failure)=>{
        return db.collection('aMessage')
        .where('recipients', 'array-contains', userId)
        .onSnapshot((snapshot)=>{
            if (snapshot.docs) {
                const chatMessages = {}
                const messages = snapshot.docs.map((doc)=>doc.data())
                messages.sort((a,b)=>a.timestamp>b.timestamp ? 1 : -1)
                messages.forEach((message)=>{
                    if (!(message.chatId in chatMessages)){
                        chatMessages[message.chatId] = []
                    }
                    chatMessages[message.chatId].push(message)
                })
                success(chatMessages)
            } else { success([]) }
        }, (error)=>failure(error))
    }

    sendMessage = (sender, chat, newMessage)=>{
        const batch = db.batch()
        
        const recipients = chat.participants.filter((id)=>id !== sender.userId)

        // Set recipient status as "Sent" for each recipient other than sender
        const recipientStatus = {}
        recipients.forEach((recipient)=>recipientStatus[recipient] = 0)

        const message = JSON.parse(JSON.stringify(newMessage))
        message['status'] = "Sent"
        message['recipientStatus'] = recipientStatus
        message['timestamp'] = newMessage.timestamp.toDate()

        // Make connections with participants who are not connected previously
        const newConnections = [...sender.connections]
        let updateConnections = false
        chat.participants.forEach((participant)=>{
            if (!newConnections.includes(participant)){
                newConnections.push(participant)
                updateConnections = true
            }
        })
        if (updateConnections) {
            const userRef = db.collection('aUser').doc(sender.userId)
            batch.update(userRef, { connections:newConnections })
        }
        const chatRef = db.collection('aChat').doc(chat.chatId)
        
        // Increase unreadMessages count for all recipients in aChat(chat)
        if (chat.isNewChat) {
            delete chat["isNewChat"]
            const participantsData = {}
            for (let recipient of recipients) {
                participantsData[recipient] = { 'unreadMessages': 1 }
            }

            batch.set(chatRef,  {
                ...chat,
                lastMessage: message,
                lastActivity: message.timestamp,
                participantsData: participantsData
            })
        } else {
            const data = {
                lastMessage: message,
                lastActivity: message.timestamp
            }
            recipients.forEach((recipient)=>{
                data[`participantsData.${recipient}.unreadMessages`] 
                    = firebase.firestore.FieldValue.increment(1)
            })
            batch.update(chatRef, data)
        }

        console.log(message)
    
        const messageRef = db.collection('aMessage')
            .doc(message.messageId)
        batch.set(messageRef, message)

        return batch.commit().then((_)=>{}, (error)=>console.log({
            sendMessageError:error
        }))
    }

    markAllMessagesAsRead = (userId, chat, messages)=>{
        if (!userId || !chat || !messages) {
            return new Promise((_, failure)=>{
                failure(new Error("markMessagesAsRead: Invalid arguments"))
            })
        } else if (messages.length === 0) {
            return new Promise((success)=>{
                success("No messages in the chat")
            })
        }
        const batch = db.batch();

        // For current participant(userId) in aChat set unreadMessages to 0
        const userData = chat.participantsData[userId]
        if (!userData || userData['unreadMessages'] !== 0) {
            const chatRef = db.collection('aChat').doc(chat.chatId)
            // batch.update(chatRef, { participantsData: data })
            const data = {}
            data[`participantsData.${userId}.unreadMessages`] = 0
            batch.update(chatRef, data)
        }

        // Task: For each message, set current user's status as "Seen" and 
        // if all other recipients have status as "Seen" then 
        // mark entire message's status as "Seen"
        const updateMessages = {}   // To store message updates
        let count = 0   // For tracking number of messages to be updated
        // Iterate from the most recent message
        for(let index=messages.length-1; index>=0; index--) {
            const message = messages[index]
            if (message.recipientStatus[userId] === 2 || message.senderId === userId) {
                // If status for current user is already set as "Seen" or 
                // if the message is sent by the current user itself then stop iterating further.
                break;
            }
            // Set recipient status for current user as "Seen"
            const recipientStatus = {}
            recipientStatus[userId] = 2
            
            // Check for average status of the message
            let minStatus = 2
            for(let recipient of message.recipients) {
                if (recipient !== userId) {
                    const status = message.recipientStatus[recipient]
                    if (status < minStatus) {
                        minStatus = status
                    }
                }
            }
            let statusDesc = "Seen"
            if (minStatus === 0){
                statusDesc = "Sent"
            } else if(minStatus === 1) {
                statusDesc = "Delivered"
            }
            
            // Message content to be updated
            updateMessages[message.messageId] = {
                status: statusDesc,
                recipientStatus: recipientStatus
            }

            count++
        }

        // Make firestore request to update all required messages
        if (count > 0) {
            for(let id in updateMessages){
                const ref = db.collection('aMessage').doc(id)
                batch.update(ref, updateMessages[id])
            }
        }

        return batch.commit().then((_)=>{}, (error)=>console.log({
            markAllMessagesAsReadError:error
        }))
    }

    typingEvent = (userId, chatId, isTyping)=>{
        const data = {}
        data[`participantsData.${userId}.isTyping`] = isTyping
        return db.collection('aChat').doc(chatId).update(data)
    }

    createNewUserObject = (name, phone, picture, description, status)=>{
        return {
            type:"user",
            userId:phone.toString(),
            name:name,
            phone:phone,
            picture:picture,
            description:description,
            status:status,
            connections:[],
            contacts:[]
        }
    }

    createNewIndividualChatObject = (createrId, participantId)=> {
        return {
            chatId: `Chat${Date.now().toString()}`,
            type: "individual",
            participants: [createrId, participantId],
            participantsData: {},
            lastActivity: new Date(Date.now()),
            createdBy: createrId,
            isNewChat: true
        }
   }

    signupUser = (name, phone, picture, description)=>{
        db.collection('aUser').doc(phone.toString()).get()
        .then((snap)=>{
            if (snap.docs && snap.docs.length > 0) {
                const user = snap.docs.pop().data()
                if (user.type !== "user") {
                    return db.collection('aUser').doc(user.userId).update({
                        type:"user",
                        name:name,
                        description:description,
                        picture:picture,
                        status:"Active"
                    })
                }
            } else {
                return db.collection('aUser').doc(phone.toString())
                .set(this.createNewUserObject(name, phone, picture, description, "Active"))
            }
        })
    }

    addContact = (userId, name, phone)=>{
        return new Promise((success, failure)=>{
            db.collection('aUser').doc(phone.toString()).get()
            .then((snap)=>{
                const batch = db.batch()
                if (snap.docs && snap.docs.length > 0) {
                    // If user exists
                    const contactRef = db.collection('aUser').doc(phone.toString())
                    batch.update(contactRef, {
                        connections: firebase.firestore.FieldValue.arrayUnion(userId)
                    })
                } else {
                    const contactRef = db.collection('aUser').doc(phone.toString())
                    batch.set(contactRef, {
                        ...this.createNewUserObject(name, phone, "", "", ""),
                        connections: [userId],
                        type:"contact"
                    })
                }

                const userData = {
                    contacts: firebase.firestore.FieldValue.arrayUnion(phone.toString())
                }
                userData[`contactInfo.${phone.toString()}`] = { name: name, phone:phone }
                const userRef = db.collection('aUser').doc(userId)
                batch.update(userRef, userData)

                batch.commit().then((result)=>{ success(result) }, (error)=>{
                    console.log({ addContactError:error })
                    failure(error)
                })
            }, (error)=>failure(error))
        })
    }

    createGroup = (createrId, name, description, picture, participants)=>{
        if (!participants.includes(createrId)) {
            participants.push(createrId)
        }

        const batch = db.batch()
        const id = `ChatGroup:${Date.now()}`
        batch.set(db.collection('aChat').doc(id), {
            chatId: id,
            type: "group",
            participants: participants,
            participantsData: {},
            lastActivity: new Date(Date.now()),
            name: name,
            description: description,
            picture: picture,
            admins:[createrId],
            createdBy:createrId
        })

        participants.forEach((participant)=>{
            const connections = participants.filter((member)=>member !== participant)
            batch.update(db.collection('aUser').doc(participant), {
                connections: firebase.firestore.FieldValue.arrayUnion(...connections)
            })
        })

        return batch.commit().then((_)=>{}, (error)=>console.log({createGroup:error}))
    }

    addContactToGroup = (chat, newMemberId)=>{
        const batch = db.batch()

        // Add new member to aChat
        batch.update(db.collection('aChat').doc(chat.chatId), {
            participants: firebase.firestore.FieldValue.arrayUnion(newMemberId)
        })

        // Update connections of member with all the members of the chat
        batch.update(db.collection('aUser').doc(newMemberId), {
            connections: firebase.firestore.FieldValue.arrayUnion(...chat.participants)
        })

        // Update connections for each member of the chat with new member
        chat.participants?.forEach((participant)=>{
            batch.update(db.collection('aUser').doc(participant), {
                connections: firebase.firestore.FieldValue.arrayUnion(newMemberId)
            })
        })

        return batch.commit().then((_)=>{}, (error)=>console.log({addContactToGroup:error}))
    }

    removeContactFromGroup = (chat, member)=>{
        const batch = db.batch()

        // Remove member from aChat
        batch.update(db.collection('aChat').doc(chat.chatId), {
            participants: firebase.firestore.FieldValue.arrayRemove(member.userId)
        })

        member.groupContacts?.forEach((contact)=>{
            batch.update(db.collection('aUser').doc(contact), {
                connections: firebase.firestore.FieldValue.arrayRemove(member.userId)
            })
        })

        return batch.commit().then((_)=>{}, (error)=>console.log({removeContactFromGrp:error}))
    }

}

const instance = new FirestoreDB();

const firestoreDB = () => instance;
export default firestoreDB;