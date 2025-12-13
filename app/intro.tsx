import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router'; // Không cần dùng trực tiếp nữa
import { ArrowRight, ChevronRight, Gift, ShoppingBag, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; // 1. Import AuthContext

const slides = [
  {
    id: 1,
    title: 'Chào mừng đến TMP.MP',
    description: 'Trải nghiệm mua sắm thông minh và tiện lợi ngay trên điện thoại của bạn',
    icon: ShoppingBag,
    colors: ['#3b82f6', '#4f46e5'] as [string, string], 
    bgColor: '#eff6ff', 
  },
  {
    id: 2,
    title: 'Giao hàng siêu tốc',
    description: 'Đặt hàng nhanh chóng và nhận trong 30 phút với dịch vụ giao hàng cao cấp',
    icon: Zap,
    colors: ['#f97316', '#db2777'] as [string, string], 
    bgColor: '#fff7ed', 
  },
  {
    id: 3,
    title: 'Ưu đãi hấp dẫn',
    description: 'Tích điểm mỗi đơn hàng và nhận voucher giảm giá độc quyền hàng ngày',
    icon: Gift,
    colors: ['#a855f7', '#db2777'] as [string, string], 
    bgColor: '#faf5ff', 
  },
];

const { width } = Dimensions.get('window');

export default function IntroScreen() {
  // const router = useRouter(); 
  const { finishIntro } = useAuth(); // 2. Lấy hàm finishIntro
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 3. Cập nhật hàm hoàn thành
  const handleComplete = () => {
    finishIntro(); // Gọi hàm này để lưu trạng thái và chuyển trang
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleTouchStart = (e: any) => {
    setTouchStart(e.nativeEvent.pageX);
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.nativeEvent.pageX;
    const minSwipeDistance = 50;

    if (touchStart - endX > minSwipeDistance) {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    }

    if (touchStart - endX < -minSwipeDistance) {
      if (currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <View 
      style={[styles.container, { backgroundColor: slide.bgColor }]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={styles.safeAreaTop}>
        <TouchableOpacity 
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.contentContainer}>
        <Animated.View 
          style={[
            styles.iconWrapper,
            { transform: [{ translateY: floatAnim }] }
          ]}
        >
          <LinearGradient
            colors={slide.colors}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon size={80} color="white" />
            <View style={[styles.decorCircle, styles.decorTop]} />
            <View style={[styles.decorCircle, styles.decorBottom]} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.bottomContent}>
          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentSlide(index)}
                style={[
                  styles.dot,
                  index === currentSlide ? styles.activeDot : styles.inactiveDot,
                  index === currentSlide && { backgroundColor: slide.colors[0] }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            onPress={handleNext}
            activeOpacity={0.9}
            style={styles.buttonShadow}
          >
            <LinearGradient
              colors={slide.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButton}
            >
              <Text style={styles.buttonText}>
                {currentSlide === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}
              </Text>
              {currentSlide === slides.length - 1 ? (
                <ArrowRight size={20} color="white" />
              ) : (
                <ChevronRight size={20} color="white" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaTop: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  skipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  iconWrapper: {
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 100, 
    backgroundColor: 'transparent',
    width: 200, 
    height: 200,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'white',
    opacity: 0.2,
  },
  decorTop: {
    width: 60,
    height: 60,
    top: -10,
    right: -10,
  },
  decorBottom: {
    width: 40,
    height: 40,
    bottom: -5,
    left: -5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  bottomContent: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    padding: 4, 
  },
  activeDot: {
    width: 32,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#d1d5db',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 16,
    backgroundColor: 'white', 
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});