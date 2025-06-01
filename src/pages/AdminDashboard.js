import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'; // Added 'doc' import
import { deleteDoc } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box } from '@mui/material';

export default function AdminDashboard() {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending products
        const productsQuery = query(collection(db, "products"), where("approved", "==", false));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = [];
        productsSnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setPendingProducts(productsData);
        
        // Fetch all users
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = [];
        usersSnapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveProduct = async (productId) => {
  try {
    await updateDoc(doc(db, "products", productId), {
      approved: true
    });
    setPendingProducts(prev => prev.filter(p => p.id !== productId));
  } catch (err) {
    console.error("Error approving product:", err);
  }
};

const handleRejectProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, "products", productId));
    setPendingProducts(prev => prev.filter(p => p.id !== productId));
  } catch (err) {
    console.error("Error rejecting product:", err);
  }
};

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Pending Product Approvals ({pendingProducts.length})
        </Typography>
        
        {pendingProducts.length === 0 ? (
          <Typography>No products pending approval</Typography>
        ) : (
          <Grid container spacing={3}>
            {pendingProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.imageUrl || "https://via.placeholder.com/200"}
                    alt={product.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      ₹{product.price}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Seller: {product.sellerName}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => handleApproveProduct(product.id)}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleRejectProduct(product.id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      <Box>
        <Typography variant="h5" gutterBottom>
          Registered Users ({users.length})
        </Typography>
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item key={user.id} xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2">{user.email}</Typography>
                  <Typography variant="body2">Phone: {user.phone}</Typography>
                  <Typography variant="body2">Address: {user.address}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {user.isSeller ? 'Seller' : 'Buyer'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}