import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Alert,
  Divider
} from '@mui/material';

export default function Profile() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || ''
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data: ", err);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateDoc(doc(db, "users", currentUser.uid), formData);
      setUserData(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error updating profile: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to register page after logout
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Profile
      </Typography>
      
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {editMode ? (
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            fullWidth
            required
            multiline
            rows={4}
            margin="normal"
          />
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ mt: 2, mr: 2 }}
            disabled={loading}
          >
            Save Changes
          </Button>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setEditMode(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6">Name: {userData?.name}</Typography>
          <Typography variant="body1">Email: {currentUser.email}</Typography>
          <Typography variant="body1">Phone: {userData?.phone}</Typography>
          <Typography variant="body1">Address: {userData?.address}</Typography>
          
          <Button 
            variant="contained" 
            sx={{ mt: 3, mr: 2 }}
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h6" gutterBottom>
          Account Actions
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{ mt: 1 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
}