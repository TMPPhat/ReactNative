import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Context
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Import Component
import { CartDrawer } from '../components/CartDrawer';

// Import API
import apiFavorite from '../api/apiFavorite';
import apiProduct, { ProductData } from '../api/apiProduct';

// Màu sắc chủ đạo
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  bg: '#f9fafb',
  white: '#ffffff',
  text: '#111827',
  textLight: '#6b7280',
  red: '#ef4444',
  gray: '#f3f4f6',
  sale: '#e11d48',
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, getTotalItems } = useCart(); // Lấy thêm getTotalItems

  const [favoriteProducts, setFavoriteProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // State cho giỏ hàng

  // --- Helper: Tính giá sản phẩm (Copy từ ProductsScreen) ---
  const calculatePrice = (product: ProductData) => {
    let finalPrice = Number(product.price);
    let originalPrice = Number(product.price);
    let hasDiscount = false;

    if (product.is_on_sale) {
      const discountVal = Number(product.discount_value);
      if (product.discount_type === 'percent') {
        finalPrice = originalPrice * (1 - discountVal / 100);
        hasDiscount = true;
      } else if (product.discount_type === 'amount') {
        finalPrice = originalPrice - discountVal;
        hasDiscount = true;
      }
    }
    
    return {
      finalPrice: Math.max(0, finalPrice),
      originalPrice: originalPrice,
      hasDiscount: hasDiscount
    };
  };

  const fetchFavorites = async () => {
    if (!user) {
        setIsLoading(false);
        setRefreshing(false);
        return;
    }

    try {
      // 1. Lấy danh sách yêu thích của User
      const favRes = await apiFavorite.getFavoritesByUser(user.id);
      
      // Nếu user chưa có danh sách yêu thích nào
      if (!favRes.results || favRes.results.length === 0) {
        setFavoriteProducts([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Lấy danh sách ID sản phẩm từ dòng kết quả đầu tiên
      // (Giả sử mỗi user chỉ có 1 dòng trong bảng favorite_products chứa list sp)
      const favItem = favRes.results[0];
      const productIds = favItem.products.map((p: any) => p.id);

      if (productIds.length === 0) {
          setFavoriteProducts([]);
          setIsLoading(false);
          setRefreshing(false);
          return;
      }

      // 2. Lấy tất cả sản phẩm để map thông tin (Ảnh, giá...)
      // Lưu ý: Cách tốt hơn là dùng filter id__in nếu API hỗ trợ, hoặc fetch detail từng món.
      // Với Baserow free và số lượng ít, fetch all rồi filter ở client vẫn ổn.
      const prodRes = await apiProduct.getAllProducts();
      const allProducts = prodRes.results || [];

      // 3. Lọc ra các sản phẩm có trong danh sách yêu thích
      const filteredParams = allProducts.filter((p: ProductData) => productIds.includes(p.id));
      
      setFavoriteProducts(filteredParams);

    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleProductClick = (product: ProductData) => {
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  const handleAddToCart = (product: ProductData) => {
    const imageUrl = product.image && product.image.length > 0 
      ? product.image[0].url 
      : 'https://via.placeholder.com/400';
    
    const { finalPrice } = calculatePrice(product);

    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: imageUrl
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.header}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>
            
            {/* Cart Button */}
            <TouchableOpacity 
              onPress={() => setIsCartOpen(true)}
              style={styles.cartButton}
            >
              <ShoppingCart size={24} color="white" />
              {getTotalItems() > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      {isLoading ? (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
      ) : (
        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {favoriteProducts.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Heart size={64} color="#d1d5db" style={styles.icon} />
                    <Text style={styles.emptyText}>Chưa có sản phẩm yêu thích</Text>
                    <Text style={styles.emptySubText}>Hãy thả tim các món ngon bạn thích nhé!</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {favoriteProducts.map((product) => {
                        const imageUrl = product.image && product.image.length > 0 
                            ? product.image[0].url 
                            : 'https://via.placeholder.com/400';
                        
                        const { finalPrice, originalPrice, hasDiscount } = calculatePrice(product);

                        return (
                            <TouchableOpacity 
                                key={product.id} 
                                style={styles.productCard}
                                onPress={() => handleProductClick(product)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.imageWrapper}>
                                    <Image 
                                        source={{ uri: imageUrl }} 
                                        style={styles.productImage} 
                                        resizeMode="cover" 
                                    />
                                    {/* Sale Badge */}
                                    {hasDiscount && (
                                        <View style={styles.saleBadge}>
                                            <Text style={styles.saleBadgeText}>SALE</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {product.name}
                                    </Text>
                                    
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.productPrice, hasDiscount && {color: COLORS.sale}]}>
                                            {finalPrice.toLocaleString('vi-VN')}đ
                                        </Text>
                                        {hasDiscount && (
                                            <Text style={styles.originalPrice}>
                                                {originalPrice.toLocaleString('vi-VN')}đ
                                            </Text>
                                        )}
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={styles.addButton}
                                        onPress={() => handleAddToCart(product)}
                                    >
                                        <ShoppingCart size={16} color="white" style={{marginRight: 4}} />
                                        <Text style={styles.addButtonText}>Thêm</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Cart Drawer Component */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
      paddingBottom: 16,
  },
  headerContent: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 20, 
      marginTop: 10 
  },
  backButton: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: 'rgba(255,255,255,0.2)', 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  
  // Cart Button Styles
  cartButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.red,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  scrollContent: { padding: 20 },
  
  emptyCard: { 
      backgroundColor: 'white', 
      borderRadius: 20, 
      padding: 40, 
      alignItems: 'center', 
      width: '100%', 
      marginTop: 40,
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 4, 
      elevation: 2 
  },
  icon: { marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center' },

  // Grid Styles (Giống Product Screen)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray,
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.sale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
    height: 40,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});