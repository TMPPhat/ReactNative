import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  Clock,
  Flame,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import Context
import { CartDrawer } from '../components/CartDrawer';
import { useAuth } from '../context/AuthContext'; // Import AuthContext
import { useCart } from '../context/CartContext';

// Import API
import apiFavorite from '../api/apiFavorite'; // Import apiFavorite
import apiProduct, { ProductData } from '../api/apiProduct';
import apiReview, { ReviewData } from '../api/apiReview';

// Màu sắc chủ đạo
const COLORS = {
  primary: '#3b82f6',
  sale: '#e11d48', // Màu đỏ cho sale
  textLight: '#6b7280',
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart, getTotalItems } = useCart();
  const { user } = useAuth(); // Lấy user để xử lý yêu thích
  
  // Lấy ID sản phẩm
  const productId = Number(params.id);

  // --- State ---
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Favorite State
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteRowId, setFavoriteRowId] = useState<number | null>(null); // ID dòng trong bảng Favorites
  const [currentFavIds, setCurrentFavIds] = useState<number[]>([]); // Danh sách ID đang like

  // UI State
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- Helper: Tính giá sản phẩm ---
  const calculatePrice = (productData: ProductData) => {
    let finalPrice = Number(productData.price);
    let originalPrice = Number(productData.price);
    let hasDiscount = false;

    if (productData.is_on_sale) {
      const discountVal = Number(productData.discount_value);
      if (productData.discount_type === 'percent') {
        finalPrice = originalPrice * (1 - discountVal / 100);
        hasDiscount = true;
      } else if (productData.discount_type === 'amount') {
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
  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setIsLoading(true);
        if (!productId) return;

        // 1. Gọi API Product và Review
        const [productData, reviewsRes] = await Promise.all([
          apiProduct.getProductDetail(productId),
          apiReview.getReviewsByProductId(productId)
        ]);

        setProduct(productData);
        setReviews(reviewsRes.results || []);

        // 2. Kiểm tra trạng thái yêu thích (Nếu đã đăng nhập)
        if (user) {
            const favRes = await apiFavorite.getFavoritesByUser(user.id);
            if (favRes.results && favRes.results.length > 0) {
                const favData = favRes.results[0];
                setFavoriteRowId(favData.id);
                // Lấy danh sách ID sản phẩm từ mảng object
                const ids = favData.products.map((p: any) => p.id);
                setCurrentFavIds(ids);
                // Check xem sản phẩm hiện tại có trong list không
                setIsFavorite(ids.includes(productId));
            } else {
                // User chưa có dòng favorite nào
                setFavoriteRowId(null);
                setCurrentFavIds([]);
                setIsFavorite(false);
            }
        }

        // 3. Lấy sản phẩm liên quan
        const allProductsRes = await apiProduct.getAllProducts();
        const allProds = allProductsRes.results || [];
        
        const currentCategory = productData.category?.[0]?.value;
        const related = allProds.filter((p: ProductData) => 
          p.id !== productId && 
          p.category?.some(c => c.value === currentCategory)
        ).slice(0, 6); 

        setRelatedProducts(related);

      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin sản phẩm.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailData();
  }, [productId, user]);

  // --- Handle Favorite Toggle ---
  const handleToggleFavorite = async () => {
    if (!user) {
        Alert.alert("Yêu cầu", "Vui lòng đăng nhập để thêm vào yêu thích.");
        return;
    }

    try {
        let newIds = [];
        if (isFavorite) {
            // Nếu đang thích -> Bỏ thích (Xóa ID khỏi mảng)
            newIds = currentFavIds.filter(id => id !== productId);
        } else {
            // Nếu chưa thích -> Thêm thích (Thêm ID vào mảng)
            newIds = [...currentFavIds, productId];
        }

        // Cập nhật UI ngay lập tức (Optimistic update)
        setIsFavorite(!isFavorite);
        setCurrentFavIds(newIds);

        if (favoriteRowId) {
            // Update dòng cũ
            await apiFavorite.updateFavoriteList(favoriteRowId, newIds);
        } else {
            // Tạo dòng mới
            const newRow = await apiFavorite.createFavorite(user.id, newIds);
            setFavoriteRowId(newRow.id);
        }

    } catch (error) {
        console.error("Lỗi cập nhật yêu thích:", error);
        // Revert UI nếu lỗi
        setIsFavorite(!isFavorite);
        Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích.");
    }
  };

  // --- Helpers ---
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
    return (total / reviews.length).toFixed(1);
  };

  const getImageUrl = (imgArray: any) => {
    return imgArray && imgArray.length > 0 
      ? imgArray[0].url 
      : 'https://via.placeholder.com/800';
  };

  const handleAddToCart = () => {
    if (!product) return;
    const { finalPrice } = calculatePrice(product);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: finalPrice, 
        image: getImageUrl(product.image),
      });
    }
    setQuantity(1);
    setIsCartOpen(true); 
  };

  if (isLoading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
  }

  if (!product) return null;

  const categoryName = product.category && product.category.length > 0 ? product.category[0].value : 'Món ngon';
  const averageRating = calculateAverageRating();
  const description = product.description || `Món ${product.name} được chế biến từ nguyên liệu tươi ngon, hương vị đậm đà.`;

  const { finalPrice, originalPrice, hasDiscount } = calculatePrice(product);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header - Nổi trên cùng */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setIsCartOpen(true)}
            style={styles.iconButton}
          >
            <ShoppingCart size={24} color="#374151" />
            {getTotalItems() > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Product Image Section */}
        <LinearGradient
          colors={['#eff6ff', '#ffffff']}
          style={styles.imageSection}
        >
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: getImageUrl(product.image) }}
                style={styles.productImage}
                resizeMode="cover"
              />
              
              {hasDiscount && (
                 <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>
                      {product.discount_type === 'percent' 
                        ? `-${Math.round(Number(product.discount_value))}%` 
                        : 'SALE'}
                    </Text>
                 </View>
              )}

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{categoryName}</Text>
              </View>

              {/* Favorite Button (Updated) */}
              <TouchableOpacity 
                onPress={handleToggleFavorite}
                style={styles.favoriteButton}
              >
                <Heart 
                  size={24} 
                  color={isFavorite ? "#ef4444" : "#9ca3af"} 
                  fill={isFavorite ? "#ef4444" : "none"} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#ffedd5' }]}>
                <Flame size={20} color="#f97316" />
              </View>
              <Text style={styles.statLabel}>
                 {Number(product.sold_quantity || 0)} đã bán
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
                <Clock size={20} color="#22c55e" />
              </View>
              <Text style={styles.statLabel}>15-20 phút</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#fef9c3' }]}>
                <Award size={20} color="#eab308" />
              </View>
              <Text style={styles.statLabel}>Chất lượng</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Product Information */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <Text style={styles.ratingText}>{averageRating || 'N/A'}</Text>
                </View>
                <Text style={styles.reviewCount}>({reviews.length} đánh giá)</Text>
              </View>
            </View>
            
            <View style={{alignItems: 'flex-end'}}>
               <Text style={[styles.priceText, hasDiscount && {color: COLORS.sale}]}>
                 {finalPrice.toLocaleString('vi-VN')}đ
               </Text>
               {hasDiscount && (
                 <Text style={styles.originalPriceText}>
                   {originalPrice.toLocaleString('vi-VN')}đ
                 </Text>
               )}
            </View>
          </View>

          <LinearGradient
            colors={['#f9fafb', '#eff6ff']}
            style={styles.descriptionBox}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.pill} />
              <Text style={styles.sectionTitle}>Mô tả</Text>
            </View>
            <Text style={styles.descriptionText}>{description}</Text>
          </LinearGradient>

          <View style={styles.sizeSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.pill} />
              <Text style={styles.sectionTitle}>Kích thước</Text>
            </View>
            <View style={styles.sizeGrid}>
              {[
                { size: "S", label: "Nhỏ", extra: "" },
                { size: "M", label: "Vừa", extra: "+5k" },
                { size: "L", label: "Lớn", extra: "+10k" },
              ].map((item) => {
                const isSelected = selectedSize === item.size;
                return (
                  <TouchableOpacity
                    key={item.size}
                    onPress={() => setSelectedSize(item.size)}
                    style={[
                      styles.sizeCard,
                      isSelected && styles.sizeCardSelected
                    ]}
                  >
                    <Text style={[styles.sizeLabel, isSelected && styles.textSelected]}>
                      {item.size}
                    </Text>
                    <Text style={styles.sizeSubLabel}>{item.label}</Text>
                    {item.extra ? (
                      <Text style={styles.sizeExtra}>{item.extra}</Text>
                    ) : null}
                    
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <View style={styles.checkDot} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.pill} />
                <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
              </View>
              {reviews.length > 0 && (
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviews.length > 0 ? (
                reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                    <View style={styles.reviewUserRow}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.avatarText}>{(review.user_name || 'A').charAt(0)}</Text>
                    </View>
                    <Text style={styles.userName}>{review.user_name || 'Ẩn danh'}</Text>
                    <View style={styles.starsRow}>
                        {[...Array(Number(review.rating) || 5)].map((_, i) => (
                        <Star key={i} size={12} color="#facc15" fill="#facc15" />
                        ))}
                    </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewTime}>{review.date}</Text>
                </View>
                ))
            ) : (
                <Text style={{color: '#9ca3af', fontStyle: 'italic', marginTop: 8}}>Chưa có đánh giá nào.</Text>
            )}
          </View>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                <View style={styles.pill} />
                <Text style={styles.sectionTitle}>Sản phẩm liên quan</Text>
              </View>
              
              <View style={styles.relatedGrid}>
                {relatedProducts.map((relProduct) => {
                  const relPriceInfo = calculatePrice(relProduct);
                  const relImageUrl = getImageUrl(relProduct.image);

                  return (
                    <TouchableOpacity 
                      key={relProduct.id} 
                      style={styles.relatedCard}
                      onPress={() => router.push({ pathname: '/product-detail', params: { id: relProduct.id } })}
                    >
                      <View style={styles.relatedImageWrapper}>
                          <Image 
                            source={{ uri: relImageUrl }}
                            style={styles.relatedImage}
                          />
                          {relPriceInfo.hasDiscount && (
                             <View style={styles.relatedSaleBadge}>
                                <Text style={styles.relatedSaleBadgeText}>
                                  {relProduct.discount_type === 'percent' 
                                    ? `-${Math.round(Number(relProduct.discount_value))}%` 
                                    : 'SALE'}
                                </Text>
                             </View>
                          )}
                      </View>

                      <View style={styles.relatedInfo}>
                        <Text style={styles.relatedName} numberOfLines={1}>{relProduct.name}</Text>
                        
                        <View style={styles.relatedPriceRow}>
                            <Text style={[styles.relatedPrice, relPriceInfo.hasDiscount && {color: COLORS.sale}]}>
                                {relPriceInfo.finalPrice.toLocaleString('vi-VN')}đ
                            </Text>
                            {relPriceInfo.hasDiscount && (
                                <Text style={styles.relatedOriginalPrice}>
                                    {relPriceInfo.originalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity 
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyButton}
            >
              <Minus size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity 
              onPress={() => setQuantity(quantity + 1)}
              style={styles.qtyButton}
            >
              <Plus size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRight}>
            <View style={{ alignItems: 'flex-end', marginRight: 16 }}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalPrice}>
                {(finalPrice * quantity).toLocaleString('vi-VN')}đ
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleAddToCart}
              style={styles.addToCartButton}
            >
              <LinearGradient
                colors={['#3b82f6', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <ShoppingCart size={20} color="white" style={{marginRight: 8}} />
                <Text style={styles.addToCartText}>Thêm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.8)', // Blur effect simulation
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
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
  scrollContent: {
    paddingTop: 0,
  },
  imageSection: {
    paddingTop: 100,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  imageContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 32,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 16,
    left: 16, 
    marginTop: 35,
    backgroundColor: COLORS.sale,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 2,
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statCard: {
    backgroundColor: 'white',
    width: '31%',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  originalPriceText: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  descriptionBox: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pill: {
    width: 4,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  sizeSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sizeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sizeCard: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sizeCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 2,
  },
  textSelected: {
    color: '#2563eb',
  },
  sizeSubLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sizeExtra: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  checkIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  reviewsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  reviewTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  relatedSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  relatedCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  relatedImageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedSaleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.sale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 2,
  },
  relatedSaleBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  relatedInfo: {
    paddingHorizontal: 4,
  },
  relatedName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  relatedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  relatedPrice: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  relatedOriginalPrice: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  qtyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  qtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 16,
  },
  totalLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginRight: 16,
  },
  addToCartButton: {
    flex: 1,
    maxWidth: 140,
    height: 48,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});