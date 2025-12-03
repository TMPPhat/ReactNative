import { useRouter } from 'expo-router';
import { Check, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- Import Context & Components ---
import { useCart } from '../../components/CartContext';
import { CartDrawer } from '../../components/CartDrawer';

// --- Định nghĩa kiểu dữ liệu ---
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
}

// --- Dữ liệu giả lập ---
const allProducts: Product[] = [
  { id: 1, name: 'Cà phê sữa đá', price: 35000, category: 'Đồ uống', image: 'coffee drink' },
  { id: 2, name: 'Trà sữa trân châu', price: 45000, category: 'Đồ uống', image: 'bubble tea' },
  { id: 3, name: 'Nước ép cam', price: 40000, category: 'Đồ uống', image: 'orange juice' },
  { id: 4, name: 'Smoothie dâu', price: 50000, category: 'Đồ uống', image: 'strawberry smoothie' },
  { id: 5, name: 'Bánh mì thịt', price: 25000, category: 'Đồ ăn', image: 'vietnamese sandwich' },
  { id: 6, name: 'Phở bò', price: 55000, category: 'Đồ ăn', image: 'pho noodles' },
  { id: 7, name: 'Cơm gà', price: 45000, category: 'Đồ ăn', image: 'chicken rice' },
  { id: 8, name: 'Bún bò Huế', price: 50000, category: 'Đồ ăn', image: 'bun bo hue' },
  { id: 9, name: 'Tiramisu', price: 45000, category: 'Tráng miệng', image: 'tiramisu cake' },
  { id: 10, name: 'Bánh flan', price: 20000, category: 'Tráng miệng', image: 'flan dessert' },
  { id: 11, name: 'Chè thái', price: 30000, category: 'Tráng miệng', image: 'che thai dessert' },
  { id: 12, name: 'Kem dừa', price: 35000, category: 'Tráng miệng', image: 'coconut ice cream' },
];

const categories = ['Tất cả', 'Đồ uống', 'Đồ ăn', 'Tráng miệng'];

// Màu sắc chủ đạo
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  bg: '#f9fafb',
  white: '#ffffff',
  gray: '#f3f4f6',
  placeholder: '#9ca3af',
  red: '#ef4444',
  border: '#e5e7eb',
};

export default function ProductsScreen() {
  const router = useRouter();
  const { addToCart, getTotalItems } = useCart();
  
  // --- State ---
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // State cho bộ lọc nâng cao
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under30' | '30-50' | 'above50'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'name'>('default');

  // --- Filter & Sort Logic ---
  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      // Lọc theo Category
      const matchesCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
      
      // Lọc theo Search
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Lọc theo Price Range
      const matchesPriceRange =
        priceRange === 'all' ||
        (priceRange === 'under30' && product.price < 30000) ||
        (priceRange === '30-50' && product.price >= 30000 && product.price <= 50000) ||
        (priceRange === 'above50' && product.price > 50000);

      return matchesCategory && matchesSearch && matchesPriceRange;
    });

    // Sắp xếp
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [selectedCategory, searchQuery, priceRange, sortBy]);

  // --- Handlers ---
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: `https://source.unsplash.com/400x400/?${product.image}`
    });
  };

  const handleProductClick = (product: Product) => {
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  const resetFilters = () => {
    setSelectedCategory('Tất cả'); // Reset danh mục
    setPriceRange('all');
    setSortBy('default');
  };

  return (
    <View style={styles.container}>
      {/* --- Header Fixed --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Sản phẩm</Text>
          
          {/* Cart Button */}
          <TouchableOpacity 
            onPress={() => setIsCartOpen(true)}
            style={styles.cartButton}
          >
            <ShoppingCart size={24} color="#374151" />
            {getTotalItems() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Search Bar & Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.placeholder} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor={COLORS.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, (priceRange !== 'all' || sortBy !== 'default' || selectedCategory !== 'Tất cả') && styles.filterButtonActive]} 
            onPress={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal size={20} color={(priceRange !== 'all' || sortBy !== 'default' || selectedCategory !== 'Tất cả') ? COLORS.white : "#6b7280"} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Horizontal Scroll */}
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
              >
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* --- Products Grid --- */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultCount}>
          {filteredProducts.length} sản phẩm
        </Text>

        <View style={styles.grid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productCard}
              onPress={() => handleProductClick(product)}
              activeOpacity={0.9}
            >
              {/* Product Image */}
              <View style={styles.imageWrapper}>
                <Image 
                  source={{ uri: `https://source.unsplash.com/400x400/?${product.image}` }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{product.category}</Text>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>
                  {product.price.toLocaleString('vi-VN')}đ
                </Text>
                
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddToCart(product)}
                >
                  <Text style={styles.addButtonText}>Thêm vào giỏ</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spacer for bottom tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- Cart Drawer Modal --- */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* --- Filter Modal (Updated) --- */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
            {/* Backdrop Area - Tap to close */}
            <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                onPress={() => setIsFilterOpen(false)} 
            />
            
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Bộ lọc & Sắp xếp</Text>
                    <TouchableOpacity 
                        style={styles.closeModalButton}
                        onPress={() => setIsFilterOpen(false)}
                    >
                        <X size={20} color="#374151" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                    {/* NEW: Category Section in Modal */}
                    <View style={styles.filterSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIndicator} />
                            <Text style={styles.sectionTitle}>Danh mục</Text>
                        </View>
                        <View style={styles.chipContainer}>
                            {categories.map((cat) => (
                                <TouchableOpacity 
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    style={[
                                        styles.filterChip, 
                                        selectedCategory === cat && styles.filterChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterChipText, 
                                        selectedCategory === cat && styles.filterChipTextActive
                                    ]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Price Range Section */}
                    <View style={styles.filterSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIndicator} />
                            <Text style={styles.sectionTitle}>Khoảng giá</Text>
                        </View>
                        <View style={styles.chipContainer}>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('all')}
                                style={[styles.filterChip, priceRange === 'all' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === 'all' && styles.filterChipTextActive]}>Tất cả</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('under30')}
                                style={[styles.filterChip, priceRange === 'under30' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === 'under30' && styles.filterChipTextActive]}>Dưới 30k</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('30-50')}
                                style={[styles.filterChip, priceRange === '30-50' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === '30-50' && styles.filterChipTextActive]}>30k - 50k</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('above50')}
                                style={[styles.filterChip, priceRange === 'above50' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === 'above50' && styles.filterChipTextActive]}>Trên 50k</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sort By Section */}
                    <View style={styles.filterSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIndicator} />
                            <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
                        </View>
                        <View style={styles.sortOptions}>
                            {[
                                { key: 'default', label: 'Mặc định' },
                                { key: 'price-low', label: 'Giá thấp đến cao' },
                                { key: 'price-high', label: 'Giá cao đến thấp' },
                                { key: 'name', label: 'Tên A-Z' },
                            ].map((option) => (
                                <TouchableOpacity 
                                    key={option.key}
                                    onPress={() => setSortBy(option.key as any)}
                                    style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                                >
                                    <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                                        {option.label}
                                    </Text>
                                    {sortBy === option.key && <Check size={18} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        onPress={resetFilters}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetButtonText}>Xóa bộ lọc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setIsFilterOpen(false)}
                        style={styles.applyButton}
                    >
                        <Text style={styles.applyButtonText}>Áp dụng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cartButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.gray,
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
    borderColor: COLORS.white,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryList: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  scrollContent: {
    padding: 20,
  },
  resultCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.gray,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4b5563',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIndicator: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff', // blue-50
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  sortOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  sortOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});