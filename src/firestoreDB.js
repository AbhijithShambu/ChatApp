import db from "./database";
import firebase from 'firebase';
import utils from './Utils'

class FirestoreDB {
    userInfoObserver = (phone, success, failure)=>{
        db.collection('aUser')
        .where('phone', '==', phone)
        .onSnapshot((snapshot)=>{
            if(snapshot.docs && snapshot.docs.length > 0) {
                success(snapshot.docs.pop().data())
            } else { failure(new Error("No user found")) }
        }, (error=>failure(error)))
    }

    userChatsObserver = (userId, success, failure)=>{
        let usersLoaded = false; let chatsLoaded = false
        let users = []; let chats = []

        db.collection('aUser')
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

        db.collection('aChat')
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
    }

    chatMessagesObserver = (chatId, success, failure)=>{
        db.collection('aMessage')
        .where('chatId', '==', chatId)
        .onSnapshot((snapshot)=>{
            if (snapshot.docs) {
                success(snapshot.docs.map((doc)=>doc.data()))
            } else { success([]) }
        }, (error)=>failure(error))
    }

    userMessagesObserver = (userId, success, failure)=>{
        db.collection('aMessage')
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
        
        const recipients = chat.participants.filter((id)=>id != sender.userId)

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
            const updateUserConnectionsReq = db.collection('aUser')
            .doc(sender.userId)
            batch.update(updateUserConnectionsReq, 
                { connections:newConnections })
        }
        const updateChatInfoReq = db.collection('aChat').doc(chat.chatId)
        
        // Increase unreadMessages count for all recipients in aChat(chat)
        if (chat.isNewChat) {
            delete chat["isNewChat"]
            const participantsData = {}
            recipients.forEach((recipient)=>{
                participantsData[recipient] = { 'unreadMessages': 1 }
            })
            batch.set(updateChatInfoReq, {
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
            batch.update(updateChatInfoReq, data)
        }

        console.log(message)
    
        const sendMsgReq = db.collection('aMessage')
            .doc(message.messageId)
        batch.set(sendMsgReq, message)

        return batch.commit().then((_)=>{}, (error)=>console.log({
            sendMessageError:error
        }))
    }

    markAllMessagesAsRead = (userId, chat, messages)=>{
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
                if (recipient != userId) {
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
}

const instance = new FirestoreDB();

const firestoreDB = () => instance;
export default firestoreDB;