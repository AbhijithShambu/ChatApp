import db from "./database";

const extractDataFromDoc = (doc)=>{
    const obj = doc.data()
    obj['id'] = doc.id;
    return obj;
}

class FirestoreDBNoSQL {
    userInfo = (phone)=>{
        return new Promise((success, failure)=>{
            db.collection('user')
            .where('phone', '==', phone)
            .get().then(
                (snap)=>{
                    if (snap.docs) {
                        success(extractDataFromDoc(snap.docs.pop()))
                    } else { failure(new Error("No user found")) }
                },
                (error)=>failure(error)
            )
        })
    }

    userContacts = (userDocId)=>{
        return new Promise((success, failure)=>{
            db.collection("user").doc(userDocId).collection('contacts')
            .get().then(
                (snap)=>{
                    if (snap.docs) {
                        success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
                    } else { success([]) }                },
                (error)=>failure(error)
            )
        })
    }

    userGroupChats = (phone)=>{
        return new Promise((success, failure)=>{
            db.collection("groupChat")
            .where("participantIds", "array-contains", phone)
            .get().then(
                (snap)=>{
                    if (snap.docs) {
                        success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
                    } else { success([]) }
                },
                (error)=>failure(error)
            )
        })
    }

    userChats = (userDocId, phone)=>{
        return new Promise((success, failure)=>{
            const individualChatsReq = this.userContacts(userDocId)
            const groupChatsReq = this.userGroupChats(phone)

            Promise.all([individualChatsReq, groupChatsReq]).then((values)=>{
                const groupChats = values.pop()
                const individualChats = values.pop()
                success([...individualChats, ...groupChats])
            }, (error)=>failure(error))
        })
    }

    chatMessages = (chatId)=>{
        return new Promise((success, failure)=>{
            db.collection("chatMessage")
            .where("chatId", "==", chatId)
            .get().then(
                (snap)=>{
                    success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
                },
                (error)=>failure(error)
            )
        })
    }

    userContactsObserver = (userDocId, success, failure)=> {
        db.collection("user").doc(userDocId).collection('contacts')
        .onSnapshot(
            (snap)=>{
                if (snap.docs) {
                    success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
                } else { success([]) }                },
            (error)=>failure(error)
        )
    }

    userGroupChatsObserver = (phone, success, failure)=> {
        db.collection("groupChat")
        .where("participantIds", "array-contains", phone)
        .onSnapshot(
            (snap)=>{
                if (snap.docs) {
                    success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
                } else { success([]) }                },
            (error)=>failure(error)
        )
    }

    userChatsObserver = (userDocId, phone, success, failure)=> {
        let individualChatsLoaded = false
        let groupChatsLoaded = false

        let individualChats = []
        let groupChats = []

        db.collection("user").doc(userDocId).collection('contacts')
        .onSnapshot(
            (snap)=>{
                let chats = []
                if (snap.docs) {
                    chats = snap.docs.map((doc)=>extractDataFromDoc(doc))
                }  

                individualChats = chats
                individualChatsLoaded = true
                if(groupChatsLoaded) {
                    success([...individualChats, ...groupChats])
                }
            },
            (error)=>failure(error)
        )

        db.collection("groupChat")
        .where("participantIds", "array-contains", phone)
        .onSnapshot(
            (snap)=>{
                let chats = []
                if (snap.docs) {
                    chats = snap.docs.map((doc)=>extractDataFromDoc(doc))
                }  
                groupChats = chats
                groupChatsLoaded = true
                if(individualChatsLoaded) {
                    success([...individualChats, ...groupChats])
                }
            },
            (error)=>failure(error)
        )
    }

    chatMessagesObserver = (chatId, success, failure)=>{
        db.collection("chatMessage").where("chatId", "==", chatId)
        .onSnapshot((snap)=>{
            if (snap.docs) {
                success(snap.docs.map((doc)=>extractDataFromDoc(doc)))
            } else { success([]) }
        }, (error)=>{failure(error)})
    }
}

class FirestoreDBSQL {
    userInfo = (phone)=>{
        return new Promise((success, failure)=>{
            db.collection('userInfo')
            .where('phone', '==', phone)
            .get().then(
                (snap)=>{
                    success(extractDataFromDoc(snap.docs.pop()))
                },
                (error)=>failure(error)
            )
        })
    }

    userChats = (userId) => {
        return new Promise((success, failure)=>{
            db.collection('chatUsers')
            .where('user', '==', db.collection('userInfo').doc(userId))
            .get().then(
                (snap)=>{
                    const chatIds = snap.docs.map((doc)=>doc.data().chat.id)
                    const query = db.collection('chatInfo')
                    const reqs = chatIds.map((chatId)=>query.doc(chatId).get())
                    Promise.all(reqs).then((docs)=>{
                        success(docs.map((doc)=>extractDataFromDoc(doc)))
                    })
                },
                (error)=>{
                    failure(error)
                }
            )
        })
    }

    chatMessages = (chatId) => {
        return new Promise((success, failure)=>{
            db.collection('chatMessages')
            .where('chat', '==', db.collection('chatInfo').doc(chatId))
            .get().then(
                (snap)=>{
                    const messageIds = snap.docs.map((doc)=>doc.data().message.id)
                    const query = db.collection('message')
                    const reqs = messageIds.map((messageId)=>query.doc(messageId).get())
                    Promise.all(reqs).then((docs)=>{
                        success(docs.map((doc)=>extractDataFromDoc(doc)))
                    })
                },
                (error)=>{
                    failure(error)
                }
            )
        })
    }
}

const instance = new FirestoreDBNoSQL();

const firestoreDB = () => instance;
export default firestoreDB;