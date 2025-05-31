import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import SellIcon from '@mui/icons-material/Store';
import ProfileIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const [value, setValue] = React.useState('home');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(`/${newValue}`);
  };

  if (currentUser?.email === "admin@shemarket.com") {
    return null; // Hide bottom nav for admin
  }

  return (
    <BottomNavigation 
      sx={{ 
        width: '100%', 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000
      }} 
      value={value} 
      onChange={handleChange}
    >
      <BottomNavigationAction
        label="Home"
        value=""
        icon={<HomeIcon />}
      />
      <BottomNavigationAction
        label="Sell"
        value="sell"
        icon={<SellIcon />}
      />
      <BottomNavigationAction
        label="Profile"
        value="profile"
        icon={<ProfileIcon />}
      />
      <BottomNavigationAction
        label="Chat"
        value="chat"
        icon={<ChatIcon />}
      />
    </BottomNavigation>
  );
}