import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Grid, Card, CardContent, CardMedia, Typography, Button, Container, Alert } from '@mui/material';


export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch approved products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("approved", "==", true));
        const querySnapshot = await getDocs(q);
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching products');
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleOrder = async (product) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }
      const userData = userDoc.data();

      // Create order document
      await addDoc(collection(db, "orders"), {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.imageUrl,
        buyerId: currentUser.uid,
        buyerName: userData.name || currentUser.email,
        buyerPhone: userData.phone,
        buyerAddress: userData.address,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        status: "pending",
        createdAt: new Date()
      });

      alert('Order placed successfully!');
    } catch (err) {
      setError('Failed to place order: ' + err.message);
      console.error("Order error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Products
      </Typography>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={product.imageUrl || "https://via.placeholder.com/200"}
                alt={product.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  ₹{product.price}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Sold by: {product.sellerName}
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => handleOrder(product)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Order Now'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}