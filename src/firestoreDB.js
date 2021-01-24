import db from "./database";

const extractDataFromDoc = (doc)=>{
    const obj = doc.data()
    obj['id'] = doc.id;
    return obj;
}

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
        let usersLoaded = false
        let chatsLoaded = false

        let users = []
        let chats = []

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
                    let chat = chatMessages[message.chatId]
                    if (chat) {
                        chatMessages[message.chatId] = [...chat, message]
                    } else {
                        chatMessages[message.chatId] = [message]
                    }
                })
                success(chatMessages)
            } else { success([]) }
        }, (error)=>failure(error))
    }

    sendMessage = (senderId, chat, text, media=null)=>{
        const timeStamp = Date.now()
        const recipientStatus = {}
        const recipients = JSON.parse(JSON.stringify(chat.participants.filter((id)=>id != senderId)))
        recipients.forEach((recipient)=>recipientStatus[recipient] = 0)

        // Create a new message entry
        const message = {
            messageId: timeStamp.toString(),
            chatId: chat.chatId,
            senderId: senderId,
            recipients: chat.participants,
            recipientStatus: recipientStatus,
            status: "Sent",
            timestamp: new Date(timeStamp),
            textContent: text
        }
        if (media) {
            message['mediaContent'] = media 
        }

        // Increase unreadMessages count for all recipients in aChat(chat)
        const participantsData = chat.participantsData
        recipients.forEach((recipient)=>{
            const data = participantsData[recipient]
            if (data) {
                data['unreadMessages'] = data['unreadMessages']+1
            } else {
                data = { 'unreadMessages': 1 }
            }
        })

        // Post data to the firestoreDB
        // const updateChatInfoReq = db.collection('aChat').doc(chat.chatId)
        // .update({
        //     lastMessage: message,
        //     lastActivity: new Date(timeStamp),
        //     participantsData: participantsData
        // })

        const updateChatInfoReq = db.collection('aChat').doc(chat.chatId)
        .set({
            ...chat,
            lastMessage: message,
            lastActivity: new Date(timeStamp),
            participantsData: participantsData
        })

        const sendMsgReq = db.collection('aMessage').doc(timeStamp.toString())
        .set(message)

        return Promise.all([sendMsgReq, updateChatInfoReq])
    }

    markAllMessagesAsRead = (userId, chat, messages)=>{
        // For current participant(userId) in aChat set unreadMessages to 0
        const participantsData = 
            JSON.parse(JSON.stringify(chat.participantsData))
        const data = participantsData[userId]
        let updateReq = true
        if (data) {
            if (data['unreadMessages'] == 0) {
                updateReq = false
            } else {
                data['unreadMessages'] = 0
            }
        } else {
            data = { 'unreadMessages': 0 }
        }
        // Make request to update aChat(chat) info
        let updateChatInfoReq = null
        if (updateReq) {
            updateChatInfoReq = db.collection('aChat').doc(chat.chatId)
            .update({
                participantsData: participantsData
            })
        }

        // Task: For each message, set current user's status as "Seen" and 
        // if all other recipients have status as "Seen" then 
        // mark entire message's status as "Seen"
        console.log({
            messagesSentTobeUpdated: messages
        })
        const updateMessages = {}   // To store message updates
        let count = 0   // For tracking number of messages to be updated
        // Iterate from the most recent message
        for(let index=messages.length-1; index>=0; index--) {
            const message = messages[index]
            console.log(message)
            if (message.recipientStatus[userId] === 2 || message.senderId === userId) {
                // If status for current user is already set as "Seen" or 
                // if the message is sent by the current user itself then stop iterating further.
                console.log({
                    "Breaking":{
                        statusAlreadyAsSeen: message.recipientStatus[userId] === 2,
                        isSenderSelf:message.senderId === userId
                    }
                })
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
        let updateMessageStatusReq = null
        if (count > 0) {
            const batch = db.batch();
            for(let id in updateMessages){
                const ref = db.collection('aMessage').doc(id)
                batch.update(ref, updateMessages[id])
            }
            
            updateMessageStatusReq = batch.commit()
        }

        console.log({
            markAsRead: {
                chatInfoUpdate:{
                    participantsData: participantsData
                },
                messagesUpdate:updateMessages
            }
        })

        return Promise.all([updateChatInfoReq, updateMessageStatusReq])
    }
}

const instance = new FirestoreDB();

const firestoreDB = () => instance;
export default firestoreDB;