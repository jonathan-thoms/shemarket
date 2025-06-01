import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Box,
  TextField,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch products and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsQuery = query(
          collection(db, "products"), 
          where("sellerId", "==", currentUser.uid)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        
        // Fetch orders
        const ordersQuery = query(
          collection(db, "orders"), 
          where("sellerId", "==", currentUser.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        
      } catch (err) {
        setError('Error fetching data: ' + err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Real-time updates for orders
  useEffect(() => {
    if (!currentUser) return;

    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewProduct(prev => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate inputs
      if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.image) {
        throw new Error('All fields are required');
      }

      // Upload image
      const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}`);
      await uploadBytes(storageRef, newProduct.image);
      const imageUrl = await getDownloadURL(storageRef);

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        imageUrl,
        sellerId: currentUser.uid,
        sellerName: currentUser.name || currentUser.email,
        approved: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form and show success
      setNewProduct({
        name: '',
        description: '',
        price: '',
        image: null
      });
      setShowAddForm(false);
      setSuccess('Product submitted for approval');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
      console.error("Error adding product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setSuccess('Order status updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update order: ' + err.message);
      console.error("Error updating order:", err);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Seller Dashboard
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Products Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Your Products</Typography>
          <Button 
            variant="contained" 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            {showAddForm ? 'Cancel' : 'Add New Product'}
          </Button>
        </Box>
        
        {showAddForm && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, p: 3, border: '1px solid #ddd', borderRadius: 1 }}>
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
              inputProps={{ min: 1, step: 0.01 }}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <input
                accept="image/*"
                type="file"
                onChange={handleImageChange}
                id="product-image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="product-image-upload">
                <Button variant="outlined" component="span">
                  Upload Product Image
                </Button>
              </label>
              {newProduct.image && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {newProduct.image.name}
                </Typography>
              )}
            </Box>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Product'}
            </Button>
          </Box>
        )}
        
        <Grid container spacing={3}>
          {products.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No products found</Typography>
            </Grid>
          ) : (
            products.map((product) => (
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{product.price.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={product.approved ? 'success.main' : 'warning.main'}
                      sx={{ mt: 1 }}
                    >
                      {product.approved ? 'Approved' : 'Pending Approval'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
      
      {/* Orders Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Your Orders ({orders.length})</Typography>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="all">All Orders</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {filteredOrders.length === 0 ? (
          <Typography>No orders found</Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredOrders.map((order) => (
              <Grid item key={order.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={order.productImage || "https://via.placeholder.com/200"}
                    alt={order.productName}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6">
                      {order.productName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Buyer:</strong> {order.buyerName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {order.buyerPhone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Address:</strong> {order.buyerAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Status:</strong> {order.status || 'Pending'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => window.open(`tel:${order.buyerPhone}`)}
                      >
                        Contact Buyer
                      </Button>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="processing">Processing</MenuItem>
                          <MenuItem value="shipped">Shipped</MenuItem>
                          <MenuItem value="delivered">Delivered</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
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