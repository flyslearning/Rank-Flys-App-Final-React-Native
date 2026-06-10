import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import CachedRemoteImage from "../../components/CachedRemoteImage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { PaymentAPI, ContentType } from "../../api/payment.api";

const { width } = Dimensions.get("window");

const BLUE = "#2563EB";
const BLUE_DARK = "#1D4ED8";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const DARK = "#0F172A";
const MUTED = "#64748B";
const GREEN = "#16A34A";
const RED = "#DC2626";
const BORDER = "#E2E8F0";
const ORANGE = "#F97316";

const rupees = (paise: number) => `₹${Math.round((paise || 0) / 100)}`;

const getImageUrl = (item: any) => {
  if (!item?.image_url) return "";

  if (typeof item.image_url === "string") {
    return item.image_url.trim();
  }

  if (item.image_url?.Valid && item.image_url?.String) {
    return item.image_url.String;
  }

  return "";
};

export default function CheckoutScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();

  const {
    item,
    content_id,
    content_type,
  }: {
    item?: any;
    content_id?: string;
    content_type?: ContentType;
  } = route.params || {};

  const finalContentId = content_id || item?.id;
  const finalContentType: ContentType =
    content_type || item?.content_type || "mentorship_series";

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(18)).current;
  const couponScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0.4)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(move, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const imageUrl = getImageUrl(item);

  const originalPricePaise = Number(
    item?.original_price_paise || item?.price_paise || 0
  );

  const discountPricePaise = Number(
    item?.discount_price_paise || item?.price_paise || originalPricePaise || 0
  );

  const discountPercent = Number(item?.discount_percent || 0);

  const normalDiscount = Math.max(originalPricePaise - discountPricePaise, 0);

  const couponDiscountPaise = Number(
    appliedCoupon?.coupon_discount_paise ||
      appliedCoupon?.discount_paise ||
      appliedCoupon?.discount_amount_paise ||
      0
  );

  const payablePaise = useMemo(() => {
    if (appliedCoupon?.final_amount_paise !== undefined) {
      return Number(appliedCoupon.final_amount_paise);
    }

    if (appliedCoupon?.amount_paise !== undefined) {
      return Number(appliedCoupon.amount_paise);
    }

    return Math.max(discountPricePaise - couponDiscountPaise, 0);
  }, [appliedCoupon, discountPricePaise, couponDiscountPaise]);

  const hasAccess =
    item?.has_access === true || item?.has_access === 1 || item?.has_access === "true";

  const isFree =
    item?.is_free === true || item?.is_free === 1 || item?.is_free === "true";

  const contentLabel =
    finalContentType === "ebook_series"
      ? "Ebook Series"
      : finalContentType === "test_series"
      ? "Test Series"
      : "Mentorship Series";

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      Alert.alert("Coupon Required", "Please enter coupon code.");
      return;
    }

    if (!finalContentId || !finalContentType) {
      Alert.alert("Error", "Invalid course details.");
      return;
    }

    try {
      setCouponLoading(true);

      const res = await PaymentAPI.validateCoupon({
        content_id: finalContentId,
        content_type: finalContentType,
        coupon_code: code,
      });

      const data = res?.data || res;

      setAppliedCoupon({
        ...data,
        coupon_code: code,
      });

      Animated.sequence([
        Animated.spring(couponScale, {
          toValue: 1.04,
          useNativeDriver: true,
        }),
        Animated.spring(couponScale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error: any) {
      setAppliedCoupon(null);
      Alert.alert(
        "Invalid Coupon",
        error?.response?.data?.message ||
          error?.message ||
          "Coupon is invalid or expired."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const showSuccessAnimation = () => {
    setSuccessVisible(true);

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      navigation.goBack();
    }, 1700);
  };

  const handlePayNow = async () => {
    if (hasAccess) {
      Alert.alert("Already Purchased", "You already have access.");
      return;
    }

    if (isFree || payablePaise <= 0) {
      Alert.alert("Free Course", "This course is free.");
      return;
    }

    if (!finalContentId || !finalContentType) {
      Alert.alert("Error", "Invalid course details.");
      return;
    }

    try {
      setPayLoading(true);

      const orderRes = await PaymentAPI.createOrder({
        content_id: finalContentId,
        content_type: finalContentType,
        coupon_code: appliedCoupon?.coupon_code || undefined,
      });

      const order = orderRes?.data || orderRes;

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Rank Flys",
        description: item?.title || "Course Purchase",
        order_id: order.provider_order_id,
        prefill: {
          name: order?.user?.name || "",
          email: order?.user?.email || "",
          contact: order?.user?.phone || "",
        },
        theme: {
          color: BLUE,
        },
      };

      const paymentData: any = await RazorpayCheckout.open(options);

      await PaymentAPI.verify({
        provider_order_id: order.provider_order_id,
        provider_payment_id: paymentData.razorpay_payment_id,
        signature: paymentData.razorpay_signature,
      });

      showSuccessAnimation();
    } catch (error: any) {
      Alert.alert(
        "Payment Failed",
          "Payment cancelled or failed."
      );
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSub}>Secure payment</Text>
          </View>

          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={20} color={GREEN} />
          </View>
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: fade,
            transform: [{ translateY: move }],
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 150 + insets.bottom },
            ]}
          >
            <View style={styles.heroCard}>
              {imageUrl ? (
                <CachedRemoteImage
                    uri={imageUrl}
                    style={styles.heroImage}
                  />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <Ionicons name="school-outline" size={54} color={BLUE} />
                  <Text style={styles.heroPlaceholderText}>{contentLabel}</Text>
                </View>
              )}

              {discountPercent > 0 && !hasAccess && !isFree && (
                <View style={styles.heroDiscountBadge}>
                  <Text style={styles.heroDiscountText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>

            <View style={styles.titleCard}>
              <Text style={styles.courseTitle}>
                {item?.title || "Course"}
              </Text>

              {!!item?.description && (
                <Text style={styles.courseDesc}>
                  {item.description}
                </Text>
              )}

              <View style={styles.infoRow}>
                <InfoChip icon="lock-closed-outline" text="Secure Payment" />
                <InfoChip icon="flash-outline" text="Instant Access" />
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: couponScale }] }}>
              <View style={styles.couponCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Coupon Code</Text>
                    <Text style={styles.sectionSub}>Apply coupon to reduce amount</Text>
                  </View>

                  <View style={styles.couponIcon}>
                    <Ionicons name="ticket-outline" size={22} color={ORANGE} />
                  </View>
                </View>

                {appliedCoupon ? (
                  <View style={styles.appliedBox}>
                    <View style={styles.appliedLeft}>
                      <View style={styles.checkBubble}>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </View>

                      <View>
                        <Text style={styles.appliedText}>
                          {appliedCoupon.coupon_code}
                        </Text>
                        <Text style={styles.appliedSubText}>
                          Coupon applied successfully
                        </Text>
                      </View>
                    </View>

                    <Pressable onPress={removeCoupon} style={styles.removeBtn}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.couponRow}>
                    <View style={styles.inputWrap}>
                      <Ionicons name="pricetag-outline" size={18} color={MUTED} />
                      <TextInput
                        value={couponCode}
                        onChangeText={setCouponCode}
                        placeholder="Enter coupon"
                        autoCapitalize="characters"
                        placeholderTextColor="#94A3B8"
                        style={styles.couponInput}
                      />
                    </View>

                    <Pressable
                      style={styles.applyBtn}
                      onPress={applyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.applyText}>Apply</Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </Animated.View>

            <View style={styles.priceCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <Text style={styles.sectionSub}>Final amount calculated securely</Text>
                </View>

                <View style={styles.summaryIcon}>
                  <Ionicons name="receipt-outline" size={22} color={BLUE} />
                </View>
              </View>

              <PriceRow label="Original Price" value={rupees(originalPricePaise)} />

              {normalDiscount > 0 && (
                <PriceRow
                  label="Course Discount"
                  value={`- ${rupees(normalDiscount)}`}
                  green
                />
              )}

              {couponDiscountPaise > 0 && (
                <PriceRow
                  label="Coupon Discount"
                  value={`- ${rupees(couponDiscountPaise)}`}
                  green
                />
              )}

              <View style={styles.divider} />

              <View style={styles.totalBox}>
                <View>
                  <Text style={styles.totalLabel}>Final Payable</Text>
                  <Text style={styles.totalSub}>Inclusive of all discounts</Text>
                </View>

                <Text style={styles.totalValue}>{rupees(payablePaise)}</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: 16,
            },
          ]}
        >
          <View>
            <Text style={styles.bottomLabel}>Payable Amount</Text>
            <Text style={styles.bottomPrice}>{rupees(payablePaise)}</Text>
          </View>

          <Pressable
            style={[
              styles.payBtn,
              (payLoading || hasAccess) && styles.disabledBtn,
            ]}
            onPress={handlePayNow}
            disabled={payLoading || hasAccess}
          >
            {payLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.payText}>
                  {hasAccess ? "Purchased" : "Pay Now"}
                </Text>
                <Ionicons name="arrow-forward" size={19} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.successBackdrop}>
          <Animated.View
            style={[
              styles.successBox,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={58} color="#fff" />
            </View>

            <Text style={styles.successTitle}>Purchased Successfully!</Text>
            <Text style={styles.successText}>
              Your access has been unlocked.
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoChip({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={15} color={BLUE} />
      <Text style={styles.infoChipText}>{text}</Text>
    </View>
  );
}

function PriceRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, green && { color: GREEN }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
  },
  headerSub: {
    marginTop: 1,
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },
  secureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  heroCard: {
    height: width * 0.52,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: BORDER,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  heroPlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: BLUE,
  },
  heroDiscountBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: RED,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroDiscountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  titleCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 14,
    marginBottom: 14,
  },
  courseTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
    color: DARK,
  },
  courseDesc: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED,
    lineHeight: 21,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  infoChipText: {
    color: BLUE_DARK,
    fontSize: 12,
    fontWeight: "900",
  },
  couponCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  priceCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },
  sectionSub: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },
  couponIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 17,
    paddingHorizontal: 13,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "800",
    color: DARK,
  },
  applyBtn: {
    height: 52,
    paddingHorizontal: 19,
    borderRadius: 17,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    color: "#fff",
    fontWeight: "900",
  },
  appliedBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appliedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    flex: 1,
  },
  checkBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedText: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "900",
  },
  appliedSubText: {
    color: GREEN,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  removeText: {
    color: RED,
    fontWeight: "900",
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  priceLabel: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "700",
  },
  priceValue: {
    color: DARK,
    fontSize: 14,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 7,
  },
  totalBox: {
    marginTop: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: DARK,
    fontSize: 16,
    fontWeight: "900",
  },
  totalSub: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  totalValue: {
    color: BLUE,
    fontSize: 24,
    fontWeight: "900",
  },
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 2,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  bottomLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomPrice: {
    color: DARK,
    fontSize: 23,
    fontWeight: "900",
  },
  payBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 22,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    minWidth: 135,
  },
  disabledBtn: {
    backgroundColor: "#94A3B8",
  },
  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  successBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 28,
    alignItems: "center",
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },
  successText: {
    marginTop: 7,
    fontSize: 14,
    color: MUTED,
    fontWeight: "700",
    textAlign: "center",
  },
});