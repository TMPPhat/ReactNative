import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Search, ShoppingCart, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// SỬA ĐƯỜNG DẪN IMPORT (Dùng tương đối để tránh lỗi)
import { useCart } from '../../components/CartContext';
import { CartDrawer } from '../../components/CartDrawer';

// --- Dữ liệu giả lập ---
const categories = [
  { id: 1, name: 'Đồ uống', icon: '🥤' },
  { id: 2, name: 'Đồ ăn', icon: '🍔' },
  { id: 3, name: 'Tráng miệng', icon: '🍰' },
  { id: 4, name: 'Combo', icon: '🎁' },
];

const featuredProducts = [
  { id: 1, name: 'Cà phê sữa đá', price: 35000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400' },
  { id: 2, name: 'Trà sữa trân châu', price: 45000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1558981396-5fcf84bdf14d?w=400' },
  { id: 3, name: 'Bánh mì thịt', price: 25000, category: 'Đồ ăn', image: 'https://images.unsplash.com/photo-1634421133373-c1f9652a208d?w=400' },
  { id: 4, name: 'Phở bò', price: 55000, category: 'Đồ ăn', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400' },
];

const banners = [
  { id: 1, title: 'Giảm 30%', subtitle: 'Cho đơn đầu tiên', colors: ['#fb923c', '#ec4899'] as const }, // orange-400 to pink-500
  { id: 2, title: 'Freeship', subtitle: 'Đơn từ 100k', colors: ['#60a5fa', '#06b6d4'] as const }, // blue-400 to cyan-500
];

export default function HomeScreen() {
  const router = useRouter();
  
  // State quản lý hiển thị Giỏ hàng
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Hook lấy dữ liệu giỏ hàng
  const { addToCart, getTotalItems } = useCart();

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleProductClick = (product: any) => {
    // Chuyển sang trang chi tiết sản phẩm với ID
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  const onAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Gradient */}
        <LinearGradient
          colors={['#3b82f6', '#4f46e5']}
          style={styles.headerContainer}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greetingText}>Xin chào,</Text>
              <Text style={styles.brandText}>TMP.MP Shop</Text>
            </View>
            
            {/* Cart Button */}
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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput 
              placeholder="Tìm kiếm sản phẩm..." 
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>
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
            <TouchableOpacity style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryIconContainer}>
                  <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={20} color="#f97316" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Nổi bật</Text>
            </View>
            <TouchableOpacity style={styles.seeMoreBtn}>
              <Text style={styles.seeMoreText}>Xem tất cả</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.productGrid}>
            {featuredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => handleProductClick(product)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price.toLocaleString('vi-VN')}đ</Text>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => onAddToCart(product)}
                  >
                    <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cart Drawer Component */}
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
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
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    width: '23%',
  },
  categoryIconContainer: {
    backgroundColor: 'white',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
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
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f3f4f6',
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
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
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