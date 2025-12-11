import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bot, Send, ShoppingCart, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Context & API
import apiGemini from '../api/apiGemini';
import apiProduct, { ProductData } from '../api/apiProduct';
import { useCart } from '../context/CartContext';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  bg: '#f9fafb',
  white: '#ffffff',
  text: '#111827',
  gray: '#e5e7eb',
  aiBubble: '#eff6ff',
  userBubble: '#3b82f6',
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  products?: ProductData[];
}

export default function AiAssistant() {
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Xin chào! Tôi là trợ lý AI. Bạn muốn tìm món gì hôm nay? (Ví dụ: Món nào cay, món chay, hay món tráng miệng...)', sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductData[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await apiProduct.getAllProducts();
        setAllProducts(res.results || []);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start();
      } catch (error) {
        console.log("AI failed to load products context");
      }
    };
    loadProducts();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await apiGemini.chatWithMenu(userMsg.text, allProducts);
      
      const suggestedProducts = allProducts.filter(p => aiResponse.product_ids?.includes(p.id));

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        sender: 'ai',
        products: suggestedProducts
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: Date.now().toString(), text: 'Xin lỗi, tôi gặp chút sự cố. Vui lòng thử lại.', sender: 'ai' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: ProductData) => {
    const imageUrl = product.image && product.image.length > 0 ? product.image[0].url : 'https://via.placeholder.com/400';
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: imageUrl
    });
  };

  const handleViewDetail = (id: number) => {
    setIsOpen(false); 
    router.push({ pathname: '/product-detail', params: { id } });
  };

  if (!allProducts.length) return null;

  return (
    <>
      {!isOpen && (
        <Animated.View style={[styles.fabContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => setIsOpen(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.fabGradient}
            >
                <Bot size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.botAvatar}>
                    <Bot size={20} color="white" />
                </View>
                <Text style={styles.headerTitle}>Trợ lý Ẩm thực AI</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
                ref={scrollViewRef}
                style={styles.chatBody} 
                contentContainerStyle={{ paddingBottom: 20 }}
                // CẬP NHẬT QUAN TRỌNG: Tự động cuộn xuống khi nội dung thay đổi
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <View key={msg.id} style={{ alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <View style={[
                    styles.bubble, 
                    msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                  ]}>
                    <Text style={[
                        styles.msgText, 
                        msg.sender === 'user' ? { color: 'white' } : { color: COLORS.text }
                    ]}>{msg.text}</Text>
                  </View>

                  {msg.products && msg.products.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
                        {msg.products.map(product => {
                            const imgUrl = product.image && product.image.length > 0 ? product.image[0].url : 'https://via.placeholder.com/400';
                            return (
                                <View key={product.id} style={styles.productCard}>
                                    <TouchableOpacity onPress={() => handleViewDetail(product.id)}>
                                        <Image source={{ uri: imgUrl }} style={styles.productImage} />
                                    </TouchableOpacity>
                                    <View style={styles.productInfo}>
                                        <Text numberOfLines={2} style={styles.productName}>{product.name}</Text>
                                        <Text style={styles.productPrice}>{Number(product.price).toLocaleString('vi-VN')}đ</Text>
                                        
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity 
                                                style={styles.detailBtn}
                                                onPress={() => handleViewDetail(product.id)}
                                            >
                                                <Text style={styles.detailText}>Chi tiết</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.addBtn}
                                                onPress={() => handleAddToCart(product)}
                                            >
                                                <ShoppingCart size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )
                        })}
                    </ScrollView>
                  )}
                </View>
              ))}
              {isLoading && (
                  <View style={styles.loadingBubble}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={{marginLeft: 8, fontSize: 12, color: '#6b7280'}}>Đang suy nghĩ...</Text>
                  </View>
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                placeholder="Hỏi về món ăn..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && { backgroundColor: COLORS.gray }]} 
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={20} color={inputText.trim() ? "white" : "#9ca3af"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 90, 
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  chatBody: {
    flex: 1,
    padding: 16,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      marginLeft: 4,
  },
  suggestionScroll: {
      marginTop: 8,
      marginBottom: 4,
  },
  productCard: {
      width: 140,
      backgroundColor: 'white',
      borderRadius: 12,
      marginRight: 10,
      borderWidth: 1,
      borderColor: COLORS.gray,
      overflow: 'hidden',
  },
  productImage: {
      width: '100%',
      height: 100,
      backgroundColor: '#f3f4f6',
  },
  productInfo: {
      padding: 8,
  },
  productName: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: 4,
      height: 32,
  },
  productPrice: {
      fontSize: 12,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 8,
  },
  actionRow: {
      flexDirection: 'row',
      gap: 6,
  },
  detailBtn: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
  },
  detailText: {
      fontSize: 10,
      fontWeight: '500',
      color: COLORS.text,
  },
  addBtn: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});