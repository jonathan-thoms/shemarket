import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Container, Typography, Box, Card, CardMedia, CardContent } from '@mui/material';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleContactSeller = () => {
    navigate(`/chat?userId=${product.sellerId}`);
  };

  if (loading) return <Container>Loading...</Container>;
  if (!product) return <Container>Product not found</Container>;

  return (
    <Container sx={{ py: 4 }}>
      <Card>
        <CardMedia
          component="img"
          height="400"
          image={product.imageUrl}
          alt={product.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h4">
            {product.name}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            ₹{product.price}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {product.description}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Sold by: {product.sellerName}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={handleContactSeller}
          >
            Contact Seller
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}