import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Search, ShoppingCart, TrendingUp } from 'lucide-react-native';
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

// --- Import Context & Components ---
import { CartDrawer } from '../../components/CartDrawer';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// --- Import API ---
import apiCategory, { CategoryData } from '../../api/apiCategory';
import apiProduct, { ProductData } from '../../api/apiProduct';

// Banner tĩnh
const banners = [
  { id: 1, title: 'Giảm 30%', subtitle: 'Cho đơn đầu tiên', colors: ['#fb923c', '#ec4899'] as const },
  { id: 2, title: 'Freeship', subtitle: 'Đơn từ 100k', colors: ['#60a5fa', '#06b6d4'] as const },
];

// Màu sắc chủ đạo
const COLORS = {
  primary: '#3b82f6',
  sale: '#e11d48', // Màu đỏ cho sale
  textLight: '#6b7280',
};

export default function HomeScreen() {
  const router = useRouter();
  
  // Contexts
  const { user } = useAuth();
  const { addToCart, getTotalItems } = useCart();

  // State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Helper: Tính giá sản phẩm ---
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

  // Hàm load dữ liệu
  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        apiCategory.getAllCategories(),
        apiProduct.getAllProducts()
      ]);

      setCategories(catRes.results || []);
      
      const allProducts = prodRes.results || [];
      // Lấy 4 sản phẩm đầu tiên làm nổi bật
      setFeaturedProducts(allProducts.slice(0, 4));

    } catch (error) {
      console.error("Lỗi tải trang chủ:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleProductClick = (product: ProductData) => {
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  const onAddToCart = (product: ProductData) => {
    const imageUrl = product.image && product.image.length > 0 
      ? product.image[0].url 
      : 'https://via.placeholder.com/400';

    // Thêm vào giỏ với giá đã giảm
    const { finalPrice } = calculatePrice(product);

    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: imageUrl
    });
  };

  // Điều hướng danh mục
  const handleCategoryPress = (categoryName: string) => {
    router.push({ 
      pathname: '/(tabs)/products', 
      params: { category: categoryName } 
    });
  };

  // Xem tất cả
  const handleSeeAllCategories = () => {
    router.push({ 
      pathname: '/(tabs)/products', 
      params: { openFilter: 'true' } 
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        
        {/* Header Gradient */}
        <LinearGradient
          colors={['#3b82f6', '#4f46e5']}
          style={styles.headerContainer}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.brandText}>{user?.name || 'Khách hàng'}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleOpenCart}
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

          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/products')} 
            style={styles.searchContainer}
          >
            <Search size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Banners */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerList}>
          {banners.map((banner, index) => (
            <LinearGradient
              key={banner.id}
              colors={banner.colors}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={[styles.bannerCard, index === 0 && { marginRight: 12 }]}
            >
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              <TouchableOpacity style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Chi tiết</Text>
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <TouchableOpacity onPress={handleSeeAllCategories} style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
             <ActivityIndicator size="small" color="#3b82f6" style={{padding: 20}} />
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => ( 
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.categoryItem} 
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={{ fontSize: 28 }}>{cat.image || '🍽️'}</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={20} color="#f97316" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Nổi bật</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')} style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
             <View style={{height: 200, justifyContent: 'center'}}>
                <ActivityIndicator size="large" color="#3b82f6" />
             </View>
          ) : (
            <View style={styles.productGrid}>
              {featuredProducts.map((product) => {
                const imageUrl = product.image && product.image.length > 0 
                  ? product.image[0].url 
                  : 'https://via.placeholder.com/400';
                
                // Tính toán giá
                const { finalPrice, originalPrice, hasDiscount } = calculatePrice(product);

                return (
                  <TouchableOpacity 
                    key={product.id} 
                    style={styles.productCard}
                    onPress={() => handleProductClick(product)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
                      
                      {/* Sale Badge */}
                      {hasDiscount && (
                         <View style={styles.saleBadge}>
                            <Text style={styles.saleBadgeText}>
                              {product.discount_type === 'percent' 
                                ? `-${Math.round(Number(product.discount_value))}%` 
                                : 'SALE'}
                            </Text>
                         </View>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      
                      {/* Price Row: Giá giảm + Giá gốc (nếu có) */}
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
                        onPress={() => onAddToCart(product)}
                      >
                        <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  brandText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: '#9ca3af',
  },
  bannerList: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  bannerCard: {
    width: 280,
    padding: 24,
    borderRadius: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeMoreText: {
    color: '#3b82f6',
    fontSize: 14,
    marginRight: 2,
  },
  categoryScroll: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
    marginRight: 16,
  },
  categoryIconContainer: {
    backgroundColor: 'white',
    width: 70, 
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    height: 32,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
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
    backgroundColor: '#f3f4f6',
  },
  // SALE BADGE STYLES
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.sale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
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
    color: '#111827',
    marginBottom: 4,
  },
  // PRICE ROW STYLES
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});