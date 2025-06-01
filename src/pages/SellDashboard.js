import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { Button, Container, Typography, TextField, Grid, Card, CardContent, CardMedia, Box } from '@mui/material';

export default function SellDashboard() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    image: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);
        
        // Fetch orders for these products
        const ordersQuery = query(collection(db, "orders"), where("sellerId", "==", currentUser.uid));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = [];
        ordersSnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ordersData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data: ", err);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setNewProduct(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, newProduct.image);
      const imageUrl = await getDownloadURL(storageRef);
      
      // 2. Add product to Firestore
      await addDoc(collection(db, "products"), {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        imageUrl,
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || currentUser.email,
        approved: false, // Needs admin approval
        createdAt: new Date()
      });
      
      // 3. Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        image: null
      });
      setShowAddForm(false);
      alert('Product submitted for approval');
    } catch (err) {
      console.error("Error adding product:", err);
      alert('Failed to add product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Seller Dashboard
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Your Products
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setShowAddForm(!showAddForm)}
          sx={{ mb: 2 }}
        >
          {showAddForm ? 'Cancel' : 'Add New Product'}
        </Button>
        
        {showAddForm && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <TextField
              label="Product Name"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              fullWidth
              required
              multiline
              rows={3}
              margin="normal"
            />
            <TextField
              label="Price (₹)"
              name="price"
              type="number"
              value={newProduct.price}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ margin: '16px 0' }}
              required
            />
            <Button type="submit" variant="contained" disabled={loading}>
              Submit Product
            </Button>
          </Box>
        )}
        
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
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
                  <Typography variant="body2" color={product.approved ? 'success.main' : 'warning.main'}>
                    {product.approved ? 'Approved' : 'Pending Approval'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Box>
        <Typography variant="h5" gutterBottom>
          Your Orders
        </Typography>
        {orders.length === 0 ? (
          <Typography>No orders yet</Typography>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item key={order.id} xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      Order for: {order.productName}
                    </Typography>
                    <Typography variant="body2">
                      Buyer: {order.buyerName}
                    </Typography>
                    <Typography variant="body2">
                      Phone: {order.buyerPhone}
                    </Typography>
                    <Typography variant="body2">
                      Address: {order.buyerAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Status: {order.status || 'Processing'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 1 }}
                      onClick={() => window.open(`tel:${order.buyerPhone}`)}
                    >
                      Contact Buyer
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}