import { LinearGradient } from 'expo-linear-gradient';
import { History, QrCode, Upload } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- Dữ liệu giả lập ---
const recentScans = [
  { id: 1, type: 'Bàn số 5', time: '10 phút trước' },
  { id: 2, type: 'Thanh toán đơn #DH123', time: '1 giờ trước' },
  { id: 3, type: 'Bàn số 12', time: '2 giờ trước' },
];

// Màu sắc chủ đạo (Blue Theme)
const COLORS = {
  background: '#ffffff', // Nền trắng toàn màn hình
  primary: '#3b82f6',    // Xanh dương
  text: '#111827',       // Đen xám
  gray: '#f3f4f6',       // Xám nhạt cho nền input/button
  grayText: '#6b7280',   // Xám chữ
  border: '#e5e7eb',
  success: '#10b981',    // Xanh lá
};

export default function QRScannerScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Animation cho thanh quét
  const [scanAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isScanning) {
      startScanAnimation();
    } else {
      scanAnimation.setValue(0);
    }
  }, [isScanning]);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 0, // Reset ngay lập tức
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate QR scan after 2 seconds
    setTimeout(() => {
      setScanResult('TABLE_008');
      setIsScanning(false);
      Alert.alert("Quét thành công!", "Mã QR: TABLE_008");
    }, 2000);
  };

  const handleUploadImage = () => {
    Alert.alert("Thông báo", "Tính năng tải ảnh đang phát triển");
  };

  const translateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Chiều cao vùng quét
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={['#3b82f6', '#4f46e5']}
            style={styles.iconGradient}
          >
            <QrCode size={32} color="white" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
        <Text style={styles.headerSubtitle}>
          Quét mã QR để đặt bàn hoặc thanh toán
        </Text>
      </View>

      {/* Scanner Card Area */}
      <View style={styles.scannerCard}>
        {/* QR Frame Container */}
        <View style={styles.qrFrameContainer}>
          {/* 4 Corner Markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Center Content */}
          <View style={styles.qrContent}>
            {isScanning ? (
              <View style={styles.scanningArea}>
                {/* Camera Preview Simulation (Black background) */}
                <View style={styles.cameraPreview} />
                {/* Scan Line Animation */}
                <Animated.View 
                  style={[
                    styles.scanLine, 
                    { transform: [{ translateY }] }
                  ]} 
                />
              </View>
            ) : (
              <QrCode size={80} color="#d1d5db" />
            )}
          </View>
        </View>

        {/* Status Text */}
        <Text style={styles.statusTitle}>
          {isScanning ? 'Đang quét...' : 'Sẵn sàng quét'}
        </Text>
        <Text style={styles.statusSubtitle}>
          {isScanning 
            ? 'Đưa mã QR vào khung hình' 
            : 'Đưa camera vào mã QR để quét tự động'}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={handleStartScan}
            disabled={isScanning}
          >
            <LinearGradient
              colors={['#3b82f6', '#4f46e5']}
              style={styles.scanButtonGradient}
            >
              <Text style={styles.scanButtonText}>
                {isScanning ? 'Đang xử lý...' : 'Bắt đầu quét'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUploadImage}
          >
            <Upload size={20} color="#374151" style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>Tải ảnh QR lên</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Scans */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <History size={20} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={styles.recentTitle}>Quét gần đây</Text>
        </View>

        <View style={styles.recentList}>
          {recentScans.map((scan) => (
            <View key={scan.id} style={styles.recentItem}>
              <View style={styles.recentIconContainer}>
                <QrCode size={20} color="#4b5563" />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{scan.type}</Text>
                <Text style={styles.recentTime}>{scan.time}</Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Xem</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      
      {/* Spacer for bottom tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // Gray 50 background overall like image
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: 'white', // White background for header part only if needed, or transparent
  },
  iconWrapper: {
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.grayText,
    textAlign: 'center',
  },
  scannerCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  qrFrameContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  // Corner Styles
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#3b82f6',
    borderWidth: 4,
    borderRadius: 8,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 24 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 24 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 24 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 24 },
  
  qrContent: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningArea: {
    width: 180, 
    height: 180, 
    overflow: 'hidden',
    borderRadius: 16,
    position: 'relative',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1f2937', // Simulated camera preview
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    top: 0,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.grayText,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  scanButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  recentTime: {
    fontSize: 12,
    color: COLORS.grayText,
  },
  viewButton: {
    backgroundColor: '#eff6ff', // Light blue bg
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});