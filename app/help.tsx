import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  bg: '#f9fafb',
  text: '#111827',
  textLight: '#6b7280',
};

export default function HelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trợ giúp & Hỗ trợ</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Liên hệ hỗ trợ</Text>
          <Text style={styles.infoText}>Email: support@tmpmp.com</Text>
          <Text style={styles.infoText}>Hotline: 1900-xxxx</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Giờ làm việc</Text>
          <Text style={styles.infoText}>Thứ 2 - Chủ nhật: 8:00 - 22:00</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 0 : 0, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: Platform.OS === 'android' ? 40 : 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  content: { padding: 20, gap: 16 },
  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textLight, marginBottom: 4 },
});