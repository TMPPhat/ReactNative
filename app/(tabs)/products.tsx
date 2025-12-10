import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- Import Context & Components ---
import { CartDrawer } from '../../components/CartDrawer';
import { useCart } from '../../context/CartContext';

// --- Import APIs ---
import apiCategory, { CategoryData } from '../../api/apiCategory';
import apiProduct, { ProductData } from '../../api/apiProduct';

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
  sale: '#e11d48', // Màu đỏ cho giá giảm
};

export default function ProductsScreen() {
  const router = useRouter();
  const { addToCart, getTotalItems } = useCart();
  
  // Lấy tham số từ navigation
  const params = useLocalSearchParams();
  
  // --- Data State ---
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Filter State ---
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // State cho bộ lọc nâng cao
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'under50' | '50-100' | 'above100'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'name'>('default');

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

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiProduct.getAllProducts(),
        apiCategory.getAllCategories()
      ]);

      setProducts(productsRes.results || []);
      setCategories(categoriesRes.results || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Xử lý Params ---
  useEffect(() => {
    if (params.category) {
      const categoryName = Array.isArray(params.category) ? params.category[0] : params.category;
      if (categoryName !== selectedCategory) {
        setSelectedCategory(categoryName);
      }
      router.setParams({ category: undefined });
    }
    
    if (params.openFilter === 'true') {
      setIsFilterOpen(true);
      router.setParams({ openFilter: undefined });
    }
  }, [params.category, params.openFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Filter & Sort Logic ---
  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      // Dùng giá sau khi giảm để lọc khoảng giá (thực tế hơn)
      const { finalPrice } = calculatePrice(product);

      // Lọc theo Category
      const matchesCategory = selectedCategory === 'Tất cả' || 
        product.category?.some(cat => cat.value === selectedCategory);
      
      // Lọc theo Search
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Lọc theo Price Range
      const matchesPriceRange =
        priceRange === 'all' ||
        (priceRange === 'under50' && finalPrice < 50000) ||
        (priceRange === '50-100' && finalPrice >= 50000 && finalPrice <= 100000) ||
        (priceRange === 'above100' && finalPrice > 100000);

      return matchesCategory && matchesSearch && matchesPriceRange;
    });

    // Sắp xếp
    if (sortBy === 'price-low') {
      result.sort((a, b) => calculatePrice(a).finalPrice - calculatePrice(b).finalPrice);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => calculatePrice(b).finalPrice - calculatePrice(a).finalPrice);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  // --- Handlers ---
  const handleAddToCart = (product: ProductData) => {
    const imageUrl = product.image && product.image.length > 0 
      ? product.image[0].url 
      : 'https://via.placeholder.com/400';

    // Tính giá thực tế (sau giảm giá) để thêm vào giỏ
    const { finalPrice } = calculatePrice(product);

    addToCart({
      id: product.id,
      name: product.name,
      price: finalPrice, // Sử dụng giá đã giảm
      image: imageUrl
    });
  };

  const handleProductClick = (product: ProductData) => {
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  const resetFilters = () => {
    setSelectedCategory('Tất cả');
    setPriceRange('all');
    setSortBy('default');
  };

  return (
    <View style={styles.container}>
      {/* --- Header Fixed --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Thực đơn</Text>
          
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
              placeholder="Tìm món ngon..."
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
            <TouchableOpacity
                onPress={() => setSelectedCategory('Tất cả')}
                style={[
                  styles.categoryChip,
                  selectedCategory === 'Tất cả' && styles.categoryChipActive
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === 'Tất cả' && styles.categoryTextActive
                ]}>
                  Tất cả
                </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.name && styles.categoryChipActive
                ]}
              >
                <Text style={{marginRight: 4}}>{cat.image}</Text> 
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.name && styles.categoryTextActive
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* --- Products Grid --- */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{marginTop: 10, color: COLORS.textLight}}>Đang tải thực đơn...</Text>
        </View>
      ) : (
        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
        >
            <View style={styles.resultHeader}>
              <Text style={styles.resultCount}>
                Tìm thấy {filteredProducts.length} món
              </Text>
              {(selectedCategory !== 'Tất cả' || searchQuery) && (
                 <TouchableOpacity onPress={() => {setSelectedCategory('Tất cả'); setSearchQuery('');}}>
                    <Text style={{color: COLORS.primary, fontSize: 13}}>Xem tất cả</Text>
                 </TouchableOpacity>
              )}
            </View>

            <View style={styles.grid}>
            {filteredProducts.map((product) => {
                const imageUrl = product.image && product.image.length > 0 
                    ? product.image[0].url 
                    : 'https://via.placeholder.com/400';
                
                const catName = product.category && product.category.length > 0 
                    ? product.category[0].value 
                    : '';

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
                        <Image 
                          source={{ uri: imageUrl }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        {/* Sale Badge bên Trái */}
                        {hasDiscount && (
                           <View style={styles.saleBadge}>
                              <Text style={styles.saleBadgeText}>
                                {product.discount_type === 'percent' 
                                  ? `-${Math.round(Number(product.discount_value))}%` 
                                  : 'SALE'}
                              </Text>
                           </View>
                        )}

                        {/* Category Badge bên Phải */}
                        {catName ? (
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{catName}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        
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
                          onPress={() => handleAddToCart(product)}
                        >
                          <Text style={styles.addButtonText}>Thêm</Text>
                        </TouchableOpacity>
                    </View>
                    </TouchableOpacity>
                );
            })}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* --- Cart Drawer Modal --- */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* --- Filter Modal --- */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
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
                    {/* Category Section */}
                    <View style={styles.filterSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIndicator} />
                            <Text style={styles.sectionTitle}>Danh mục</Text>
                        </View>
                        <View style={styles.chipContainer}>
                            <TouchableOpacity 
                                onPress={() => setSelectedCategory('Tất cả')}
                                style={[
                                    styles.filterChip, 
                                    selectedCategory === 'Tất cả' && styles.filterChipActive
                                ]}
                            >
                                <Text style={[
                                    styles.filterChipText, 
                                    selectedCategory === 'Tất cả' && styles.filterChipTextActive
                                ]}>Tất cả</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity 
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.name)}
                                    style={[
                                        styles.filterChip, 
                                        selectedCategory === cat.name && styles.filterChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterChipText, 
                                        selectedCategory === cat.name && styles.filterChipTextActive
                                    ]}>
                                        {cat.name}
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
                                onPress={() => setPriceRange('under50')}
                                style={[styles.filterChip, priceRange === 'under50' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === 'under50' && styles.filterChipTextActive]}>Dưới 50k</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('50-100')}
                                style={[styles.filterChip, priceRange === '50-100' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === '50-100' && styles.filterChipTextActive]}>50k - 100k</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setPriceRange('above100')}
                                style={[styles.filterChip, priceRange === 'above100' && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterChipText, priceRange === 'above100' && styles.filterChipTextActive]}>Trên 100k</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#6b7280',
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
  // NEW STYLES FOR SALE BADGE
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
    color: COLORS.text,
    marginBottom: 4,
    height: 40,
  },
  // UPDATED PRICE STYLES
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
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
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
    backgroundColor: '#eff6ff',
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