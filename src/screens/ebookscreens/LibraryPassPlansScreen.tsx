import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";

const { width } = Dimensions.get("window");

const BLUE = "#2563EB";
const BLUE2 = "#1D4ED8";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BG = "#FFFFFF";
const BORDER = "#E2E8F0";
const CARD = "#FFFFFF";
const SOFT_BG = "#F8FAFC";
const YELLOW = "#FEF3C7";
const GREEN = "#16A34A";

export default function LibraryPassPlansScreen({ route, navigation }: any) {
  const { goalClassId, bookId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [hasPass, setHasPass] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPlans();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.018,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 1900,
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();
    shineLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      shineLoop.stop();
    };
  }, [goalClassId]);

  const normalizePlansResponse = (raw: any) => {
    const data = raw?.data?.data || raw?.data || raw || {};

    const list = Array.isArray(data) ? data : data?.plans || [];

    const purchasedPlan =
      Array.isArray(list) && list.length
        ? list.find((p: any) => p?.is_purchased || p?.has_access)
        : null;

    return {
      plansList: Array.isArray(list) ? list : [],
      activePass: Boolean(data?.has_pass || purchasedPlan),
      expiry:
        data?.expires_at ||
        purchasedPlan?.expires_at ||
        selectedPlan?.expires_at ||
        null,
    };
  };

  const loadPlans = async () => {
    try {
      setLoading(true);

      const cached = await EbookDb.getLibraryPassPlans?.(goalClassId);
      if (Array.isArray(cached) && cached.length) {
        setPlans(cached);
        setSelectedPlan(cached[0]);
      }

      const res = await EbookAPI.getLibraryPassPlans(goalClassId);
      const { plansList, activePass, expiry } = normalizePlansResponse(res);

      await EbookDb.saveLibraryPassPlans?.(plansList);

      setPlans(plansList);
      setHasPass(activePass);
      setExpiresAt(expiry);

      if (plansList.length) {
        const purchased =
          plansList.find((p: any) => p?.is_purchased || p?.has_access) ||
          plansList[0];

        setSelectedPlan(purchased);
      }
    } catch (e: any) {
      console.log("Library pass plans error:", e?.response?.data || e?.message || e);
      Alert.alert("Error", "Library Pass plans load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (value?: string | null) => {
    if (!value) return "Active";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPrice = (plan: any) => {
    const pricePaise =
      Number(plan?.price_paise) ||
      Number(plan?.discount_price_paise) ||
      Number(plan?.amount_paise) ||
      0;

    if (pricePaise > 0) return pricePaise / 100;

    return Number(
      plan?.price_rupees ||
        plan?.price ||
        plan?.amount_rupees ||
        plan?.amount ||
        0
    );
  };

  const getOriginalPrice = (plan: any) => {
    const originalPaise = Number(plan?.original_price_paise || 0);
    if (originalPaise > 0) return originalPaise / 100;
    return Number(plan?.original_price_rupees || plan?.original_price || 0);
  };

  const getPlanName = (plan: any) =>
    plan?.plan_name ||
    plan?.name ||
    plan?.title ||
    plan?.pass_name ||
    "Yearly Library Pass";

  const getValidity = (plan: any) => {
    if (plan?.duration_days) return `${plan.duration_days} Days`;
    return (
      plan?.duration_text ||
      plan?.validity_text ||
      plan?.validity ||
      plan?.duration ||
      "1 Year"
    );
  };

  const getAccessType = (plan: any) =>
    plan?.access_type || plan?.accessType || plan?.type || "Full Ebook Access";

  const getDescription = (plan: any) =>
    plan?.description ||
    plan?.short_description ||
    plan?.details ||
    "Unlock all premium ebooks in your goal with one powerful pass.";

  const getFeatures = (plan: any) => {
    const apiFeatures =
      plan?.features ||
      plan?.benefits ||
      plan?.plan_features ||
      plan?.included_features ||
      [];

    if (Array.isArray(apiFeatures) && apiFeatures.length) {
      return apiFeatures
        .map((x: any) =>
          typeof x === "string" ? x : x?.title || x?.name || x?.text
        )
        .filter(Boolean);
    }

    return [
      "All premium ebooks unlocked",
      "Full page reading access",
      "One pass for complete preparation",
      "No need to buy every book separately",
      "Continue reading from saved progress",
      "Best for syllabus completion and revision",
    ];
  };

  const buyPass = () => {
    if (hasPass || selectedPlan?.is_purchased) {
      Alert.alert("Already Purchased", "Aapka Library Pass already active hai.");
      return;
    }

    if (!selectedPlan) {
      Alert.alert("Error", "Please select a plan first.");
      return;
    }

    const pricingId = selectedPlan.pricing_id;

    if (!pricingId) {
      Alert.alert("Error", "pricing_id missing hai.");
      return;
    }

    const pricePaise =
      Number(selectedPlan.price_paise) ||
      Number(selectedPlan.discount_price_paise) ||
      0;

    if (!pricePaise || pricePaise <= 0) {
      Alert.alert("Error", "Plan price missing hai.");
      return;
    }

    navigation.navigate("CheckoutScreen", {
      item: {
        ...selectedPlan,
        id: pricingId,
        content_id: pricingId,
        content_type: "library_pass",
        title: selectedPlan.title || "Library Pass",
        description: `${selectedPlan.duration_days || ""} days library access`,

        price_paise: pricePaise,
        original_price_paise:
          Number(selectedPlan.original_price_paise) || pricePaise,
        discount_price_paise: pricePaise,
        amount_paise: pricePaise,
        amount_rupees: pricePaise / 100,

        has_access: false,
        is_free: false,
      },
      content_id: pricingId,
      content_type: "library_pass",
      goal_class_id: goalClassId,
      book_id: bookId,
    });
  };

  const price = getPrice(selectedPlan);
  const originalPrice = getOriginalPrice(selectedPlan);
  const planName = getPlanName(selectedPlan);
  const validity = getValidity(selectedPlan);
  const accessType = getAccessType(selectedPlan);
  const description = getDescription(selectedPlan);
  const features = getFeatures(selectedPlan);
  const isPurchased = Boolean(hasPass || selectedPlan?.is_purchased);

  const shineMove = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, width],
  });

  const faqs = [
    {
      q: "Library Pass kya unlock karta hai?",
      a: "Ye pass selected goal/class ke eligible premium ebooks ko full access mode me unlock karta hai.",
    },
    {
      q: "Kya har book alag se buy karni padegi?",
      a: "Nahi. Library Pass lene ke baad eligible ebooks ke liye repeated payment ki zarurat nahi hogi.",
    },
    {
      q: "Validity kitni hogi?",
      a: isPurchased
        ? `Aapka pass ${formatExpiry(expiresAt)} tak active hai.`
        : `Is plan ki validity ${validity} hai. Validity API data ke hisaab se show hoti hai.`,
    },
    {
      q: "Purchase ke baad book kaise open hogi?",
      a: "Payment success ke baad Book Detail page par jaakar book directly open kar sakte ho.",
    },
  ];

  if (loading && plans.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.loader}>
          <ActivityIndicator color={BLUE} size="large" />
          <Text style={styles.loadingText}>Loading Library Pass...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Library Pass</Text>
          <Text style={styles.headerSub}>
            {isPurchased ? "Your pass is active" : "Premium ebook access"}
          </Text>
        </View>

        <Pressable onPress={loadPlans} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={19} color={BLUE} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isPurchased ? 115 + insets.bottom : 170 + insets.bottom },
        ]}
      >
        {isPurchased && (
          <LinearGradient
            colors={["#ECFDF5", "#FFFFFF"]}
            style={styles.purchasedTopCard}
          >
            <View style={styles.purchasedIconBox}>
              <Ionicons name="checkmark-circle" size={30} color={GREEN} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.purchasedTitle}>Already Purchased Pass</Text>
              <Text style={styles.purchasedSub}>
                Your Library Pass is active till {formatExpiry(expiresAt)}
              </Text>
            </View>
          </LinearGradient>
        )}

        <LinearGradient
          colors={
            isPurchased
              ? ["#ECFDF5", "#FFFFFF", "#F0FDF4"]
              : ["#EFF6FF", "#FFFFFF", "#FEFCE8"]
          }
          style={[styles.moviePass, isPurchased && styles.moviePassPurchased]}
        >
          <Animated.View
            style={[
              styles.shine,
              { transform: [{ translateX: shineMove }, { rotate: "18deg" }] },
            ]}
          />

          <View style={styles.circleLeft} />
          <View style={styles.circleRight} />
          <View style={styles.topWave} />
          <View style={styles.bottomWave} />

          <View style={styles.passTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.passSmall, isPurchased && { color: GREEN }]}>
                FLYS LEARNING
              </Text>
              <Text style={styles.passTitle}>
                {isPurchased ? "Active Books Pass" : "Premium Books Pass"}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.passIconBox,
                { transform: [{ translateY: floatAnim }] },
              ]}
            >
              <LinearGradient
                colors={isPurchased ? ["#DCFCE7", "#BBF7D0"] : ["#FEF3C7", "#FDE68A"]}
                style={styles.passIcon}
              >
                <Ionicons
                  name={isPurchased ? "shield-checkmark" : "library"}
                  size={30}
                  color={isPurchased ? "#15803D" : "#B45309"}
                />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.planName}>{planName}</Text>
          <Text style={styles.planDesc}>{description}</Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabelTop}>
                {isPurchased ? "Pass Status" : "Pass Price"}
              </Text>

              {isPurchased ? (
                <Text style={styles.activePriceText}>Active</Text>
              ) : (
                <View style={styles.priceWrap}>
                  <Text style={styles.bigPrice}>₹{price}</Text>
                  {originalPrice > price && (
                    <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                  )}
                </View>
              )}
            </View>

            <View
              style={[
                styles.validityPill,
                isPurchased && {
                  backgroundColor: "#ECFDF5",
                  borderColor: "#BBF7D0",
                },
              ]}
            >
              <Ionicons
                name={isPurchased ? "checkmark-circle-outline" : "calendar-outline"}
                size={15}
                color={isPurchased ? GREEN : BLUE}
              />
              <Text style={[styles.validityText, isPurchased && { color: GREEN }]}>
                {isPurchased ? `Till ${formatExpiry(expiresAt)}` : validity}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.accessPill,
              isPurchased && {
                backgroundColor: "#ECFDF5",
                borderColor: "#86EFAC",
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={18} color={GREEN} />
            <Text style={styles.accessPillText}>
              {isPurchased
                ? "Access Active: All eligible books unlocked"
                : `Access Type: ${accessType}`}
            </Text>
          </View>
        </LinearGradient>

        {!isPurchased && plans.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Pass</Text>

            {plans.map((plan) => {
              const active = selectedPlan?.pricing_id === plan.pricing_id;

              return (
                <Pressable
                  key={plan.pricing_id}
                  onPress={() => setSelectedPlan(plan)}
                  style={[styles.planOption, active && styles.planOptionActive]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{getPlanName(plan)}</Text>
                    <Text style={styles.optionSub}>
                      {getAccessType(plan)} • {getValidity(plan)}
                    </Text>
                  </View>

                  <Text style={styles.optionPrice}>₹{getPrice(plan)}</Text>

                  {active && (
                    <Ionicons name="checkmark-circle" size={22} color={BLUE} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>Plan Details</Text>
              <Text style={styles.sectionSub}>Premium pass information</Text>
            </View>

            <View
              style={[
                styles.liveBadge,
                isPurchased && {
                  backgroundColor: "#ECFDF5",
                  borderColor: "#BBF7D0",
                },
              ]}
            >
              <Ionicons
                name={isPurchased ? "checkmark-circle-outline" : "ticket-outline"}
                size={14}
                color={isPurchased ? GREEN : BLUE}
              />
              <Text style={[styles.liveText, isPurchased && { color: GREEN }]}>
                {isPurchased ? "Active Pass" : "Book Pass"}
              </Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <DetailCard icon="pricetag-outline" label="Plan Name" value={planName} />
            <DetailCard icon="shield-checkmark-outline" label="Access" value={accessType} />
            <DetailCard
              icon="calendar-outline"
              label={isPurchased ? "Expires On" : "Validity"}
              value={isPurchased ? formatExpiry(expiresAt) : validity}
            />
            <DetailCard
              icon={isPurchased ? "checkmark-circle-outline" : "cash-outline"}
              label={isPurchased ? "Status" : "Price"}
              value={isPurchased ? "Purchased" : `₹${price}`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you get</Text>

          <View style={styles.featureList}>
            {features.map((item: string, index: number) => (
              <Feature key={`${item}-${index}`} text={item} />
            ))}
          </View>
        </View>

        <LinearGradient colors={["#EFF6FF", "#FFFFFF"]} style={styles.premiumCard}>
          <Ionicons name="sparkles" size={30} color={BLUE} />
          <Text style={styles.premiumTitle}>Why this pass is better?</Text>
          <Text style={styles.premiumText}>
            One payment gives you complete ebook access like a premium subscription.
            Smooth reading, saved progress, and no repeated purchase for every book.
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Benefits</Text>

          <View style={styles.benefitBox}>
            <Benefit text="All eligible ebooks open in full mode" />
            <Benefit text="Best for study planning" />
            <Benefit text="Clean and premium reading experience" />
            <Benefit text="No separate payment for every premium book" />
            <Benefit text="Perfect for revision and syllabus completion" />
            <Benefit text="Simple one-pass access for serious students" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQs</Text>

          <View style={styles.faqList}>
            {faqs.map((item, index) => {
              const open = openFaq === index;

              return (
                <Pressable
                  key={item.q}
                  onPress={() => setOpenFaq(open ? null : index)}
                  style={[styles.faqCard, open && styles.faqCardOpen]}
                >
                  <View style={styles.faqTop}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={BLUE}
                    />
                  </View>

                  {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Important</Text>
          <Text style={styles.noteText}>
            {isPurchased
              ? `Aapka Library Pass active hai. Eligible premium books directly open ho jayengi. Expiry: ${formatExpiry(
                  expiresAt
                )}.`
              : "Ye pass selected goal/class ke eligible ebooks ko unlock karega. Purchase ke baad Book Detail page se books directly open ho jayengi."}
          </Text>
        </View>
      </ScrollView>

      {!!selectedPlan && (
        <View
          style={[
            styles.bottomBar,
            {
              bottom: Math.max(insets.bottom, 12),
            },
            isPurchased && styles.bottomBarPurchased,
          ]}
        >
          {isPurchased ? (
            <>
              <View style={styles.bottomPurchasedIcon}>
                <Ionicons name="checkmark-circle" size={28} color={GREEN} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.bottomPurchasedTitle}>
                  Already Purchased Pass
                </Text>
                <Text style={styles.bottomPurchasedSub}>
                  Active till {formatExpiry(expiresAt)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.bottomPriceBox}>
                <Text style={styles.bottomLabel}>Library Pass</Text>
                <Text style={styles.bottomPrice}>₹{price}</Text>
              </View>

              <Animated.View
                style={{ flex: 1.25, transform: [{ scale: pulseAnim }] }}
              >
                <Pressable
                  onPress={buyPass}
                  disabled={buying}
                  style={({ pressed }) => [
                    styles.buyBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <LinearGradient
                    colors={["#60A5FA", BLUE, BLUE2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buyGradient}
                  >
                    {buying ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="bag-handle-outline"
                          size={19}
                          color="#FFFFFF"
                        />
                        <Text style={styles.buyText}>Buy Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailCard({ icon, label, value }: any) {
  return (
    <LinearGradient colors={["#FFFFFF", "#F8FBFF"]} style={styles.detailCard}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={22} color={BLUE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {String(value || "-")}
      </Text>
    </LinearGradient>
  );
}

function Feature({ text }: any) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons name="checkmark-circle" size={21} color={BLUE} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Benefit({ text }: any) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>
        <Ionicons name="star" size={17} color="#F59E0B" />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
    color: MUTED,
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: DARK,
  },
  headerSub: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  purchasedTopCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  purchasedIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  purchasedTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#14532D",
  },
  purchasedSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    color: "#15803D",
  },
  moviePass: {
    borderRadius: 34,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: BLUE,
    shadowOpacity: 0.13,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  moviePassPurchased: {
    borderColor: "#BBF7D0",
    shadowColor: GREEN,
  },
  shine: {
    position: "absolute",
    top: -40,
    width: 80,
    height: 360,
    backgroundColor: "rgba(255,255,255,0.46)",
  },
  circleLeft: {
    position: "absolute",
    left: -18,
    top: "48%",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  circleRight: {
    position: "absolute",
    right: -18,
    top: "48%",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  topWave: {
    position: "absolute",
    top: -42,
    right: -50,
    width: width * 0.8,
    height: 95,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: "rgba(37,99,235,0.10)",
  },
  bottomWave: {
    position: "absolute",
    bottom: -44,
    left: -50,
    width: width * 0.8,
    height: 95,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: "rgba(245,158,11,0.13)",
  },
  passTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passSmall: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "900",
    color: BLUE,
  },
  passTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
  },
  passIconBox: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
  passIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dashedLine: {
    marginVertical: 17,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  planName: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: DARK,
  },
  planDesc: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: MUTED,
  },
  priceRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabelTop: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  bigPrice: {
    marginTop: 2,
    fontSize: 38,
    fontWeight: "900",
    color: DARK,
  },
  activePriceText: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "900",
    color: GREEN,
  },
  originalPrice: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  validityPill: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 165,
  },
  validityText: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },
  accessPill: {
    marginTop: 16,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessPillText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: "#166534",
  },
  section: {
    marginTop: 28,
  },
  sectionHead: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
  },
  sectionSub: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "900",
    color: BLUE,
  },
  planOption: {
    marginTop: 12,
    padding: 15,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planOptionActive: {
    borderColor: BLUE,
    backgroundColor: "#EFF6FF",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: DARK,
  },
  optionSub: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailCard: {
    width: (width - 46) / 2,
    minHeight: 128,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: BLUE,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: DARK,
  },
  featureList: {
    marginTop: 14,
  },
  featureCard: {
    marginBottom: 11,
    padding: 14,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    shadowColor: DARK,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: DARK,
  },
  premiumCard: {
    marginTop: 28,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: BLUE,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  premiumTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "900",
    color: DARK,
  },
  premiumText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: MUTED,
  },
  benefitBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 24,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  benefitRow: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: "#92400E",
  },
  faqList: {
    marginTop: 14,
  },
  faqCard: {
    marginBottom: 11,
    padding: 15,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  faqCardOpen: {
    backgroundColor: "#F8FBFF",
    borderColor: "#BFDBFE",
  },
  faqTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
    color: DARK,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "700",
    color: MUTED,
  },
  noteCard: {
    marginTop: 28,
    marginBottom: 24,
    padding: 18,
    borderRadius: 24,
    backgroundColor: SOFT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
  },
  noteText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: MUTED,
  },
  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    minHeight: 74,
    borderRadius: 28,
    backgroundColor: CARD,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: DARK,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  bottomBarPurchased: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  bottomPurchasedIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPurchasedTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#14532D",
  },
  bottomPurchasedSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },
  bottomPriceBox: {
    flex: 0.9,
    paddingLeft: 8,
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },
  bottomPrice: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
  },
  buyBtn: {
    height: 54,
    borderRadius: 19,
    overflow: "hidden",
  },
  buyGradient: {
    flex: 1,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});