import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Grid, Card, CardContent, CardMedia, Typography, Button, Container } from '@mui/material';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Error fetching products: ", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleOrder = (product) => {
    // Implement order functionality
    console.log("Order placed for:", product);
  };

  if (loading) {
    return <Container>Loading...</Container>;
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
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}