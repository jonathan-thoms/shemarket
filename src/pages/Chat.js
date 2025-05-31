import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Container, Typography, List, ListItem, ListItemText, TextField, Button, Avatar, Box } from '@mui/material';

export default function Chat() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const chatsData = [];
        querySnapshot.forEach((doc) => {
          chatsData.push({ id: doc.id, ...doc.data() });
        });
        setChats(chatsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chats: ", err);
        setLoading(false);
      }
    };

    fetchChats();
  }, [currentUser]);

  useEffect(() => {
    let unsubscribe = null;
    
    if (activeChat) {
      unsubscribe = onSnapshot(
        collection(db, "chats", activeChat.id, "messages"),
        (snapshot) => {
          const messagesData = [];
          snapshot.forEach((doc) => {
            messagesData.push({ id: doc.id, ...doc.data() });
          });
          setMessages(messagesData.sort((a, b) => a.timestamp - b.timestamp));
        }
      );
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    try {
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        timestamp: new Date()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };

  const startNewChat = async (userId, userName) => {
    try {
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants.includes(userId) && chat.participants.includes(currentUser.uid)
      );
      
      if (existingChat) {
        setActiveChat(existingChat);
        return;
      }
      
      // Create new chat
      const chatRef = await addDoc(collection(db, "chats"), {
        participants: [currentUser.uid, userId],
        participantNames: [
          currentUser.displayName || currentUser.email,
          userName
        ],
        createdAt: new Date()
      });
      
      const newChat = {
        id: chatRef.id,
        participants: [currentUser.uid, userId],
        participantNames: [
          currentUser.displayName || currentUser.email,
          userName
        ]
      };
      
      setChats(prev => [...prev, newChat]);
      setActiveChat(newChat);
    } catch (err) {
      console.error("Error creating chat: ", err);
    }
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container sx={{ py: 4, display: 'flex', height: 'calc(100vh - 128px)' }}>
      <Box sx={{ width: 300, borderRight: '1px solid #ddd', pr: 2, mr: 2 }}>
        <Typography variant="h6" gutterBottom>
          Conversations
        </Typography>
        <List>
          {chats.map((chat) => {
            const otherParticipantIndex = chat.participants.findIndex(id => id !== currentUser.uid);
            const chatName = chat.participantNames[otherParticipantIndex];
            
            return (
              <ListItem 
                key={chat.id} 
                button 
                onClick={() => setActiveChat(chat)}
                selected={activeChat?.id === chat.id}
              >
                <ListItemText primary={chatName} />
              </ListItem>
            );
          })}
        </List>
      </Box>
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
              {messages.map((message) => (
                <Box 
                  key={message.id} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: message.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: message.senderId === currentUser.uid ? 'primary.main' : 'grey.300',
                      color: message.senderId === currentUser.uid ? 'white' : 'text.primary',
                      maxWidth: '70%'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {message.senderName}
                    </Typography>
                    <Typography variant="body1">{message.text}</Typography>
                    <Typography variant="caption" display="block" sx={{ textAlign: 'right' }}>
                      {new Date(message.timestamp?.toDate()).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', mt: 'auto' }}>
              <TextField
                fullWidth
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button 
                variant="contained" 
                sx={{ ml: 2 }}
                onClick={handleSendMessage}
              >
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
            Select a conversation or start a new one
          </Typography>
        )}
      </Box>
    </Container>
  );
}