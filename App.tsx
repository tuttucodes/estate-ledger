import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./lib/supabase";
import { authService } from "./services/authService";
import { propertyService } from "./services/propertyService";
import { tenantService } from "./services/tenantService";
import { paymentService } from "./services/paymentService";
import { expenseService } from "./services/expenseService";
import { documentService } from "./services/documentService";
import { useAuthStore } from "./store/authStore";
import { useAppStore } from "./store/appStore";
import { AppButton, AppInput, EmptyState, Loader } from "./src/components/common";
import { notify, setupNotifications } from "./src/utils/notifications";
import { useOwnerDashboard } from "./hooks/useOwnerData";
import { useTenantData } from "./hooks/useTenantData";
import { useCurrency } from "./hooks/useCurrency";
import { PaymentMethod, UserRole } from "./types";

const queryClient = new QueryClient();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthScreen() {
  const { setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");

  const login = useMutation({
    mutationFn: () => authService.signIn(email.trim(), password),
    onSuccess: async () => {
      const profile = await authService.getCurrentProfile();
      setUser(profile);
    },
    onError: (e: Error) => Alert.alert("Login failed", e.message)
  });

  const signUp = useMutation({
    mutationFn: () => authService.signUp({ name: name.trim(), email: email.trim(), password, role }),
    onSuccess: async () => {
      const profile = await authService.getCurrentProfile();
      setUser(profile);
    },
    onError: (e: Error) => Alert.alert("Signup failed", e.message)
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Estate Ledger</Text>
      <Text style={styles.subtitle}>Login / Signup</Text>
      <AppInput placeholder="Name (for signup)" value={name} onChangeText={setName} />
      <AppInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <AppInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.row}>
        <AppButton label="Owner" onPress={() => setRole("owner")} disabled={role === "owner"} />
        <View style={{ width: 10 }} />
        <AppButton label="Tenant" onPress={() => setRole("tenant")} disabled={role === "tenant"} />
      </View>
      <AppButton label={login.isPending ? "Logging in..." : "Login"} onPress={() => login.mutate()} />
      <AppButton label={signUp.isPending ? "Creating..." : "Signup"} onPress={() => signUp.mutate()} />
    </SafeAreaView>
  );
}

function OwnerDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { formatAmount, currency } = useCurrency();
  const { propertiesQuery, paymentsQuery, expensesQuery } = useOwnerDashboard(user?.id);
  if (propertiesQuery.isLoading || paymentsQuery.isLoading || expensesQuery.isLoading) return <Loader />;

  const payments = paymentsQuery.data || [];
  const expenses = expensesQuery.data || [];
  const totalIncome = payments.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const pending = payments.filter((p: any) => p.status === "pending").length;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Owner Dashboard</Text>
      <Text>Currency: {currency}</Text>
      <Text>Total income: {formatAmount(totalIncome)}</Text>
      <Text>Total expenses: {formatAmount(totalExpenses)}</Text>
      <Text>Pending payments: {pending}</Text>
    </View>
  );
}

function PropertiesScreen() {
  const user = useAuthStore((s) => s.user)!;
  const selectedPropertyId = useAppStore((s) => s.selectedPropertyId);
  const setSelectedPropertyId = useAppStore((s) => s.setSelectedPropertyId);
  const queryClient = useQueryClient();
  const { propertiesQuery } = useOwnerDashboard(user.id);
  const [propertyName, setPropertyName] = useState("");
  const [location, setLocation] = useState("");
  const [unitName, setUnitName] = useState("");
  const [tenantUserId, setTenantUserId] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [dueDate, setDueDate] = useState("5");

  const addProperty = useMutation({
    mutationFn: () => propertyService.createProperty(user.id, propertyName.trim(), location.trim()),
    onSuccess: () => {
      setPropertyName("");
      setLocation("");
      queryClient.invalidateQueries({ queryKey: ["owner-properties", user.id] });
    }
  });

  const addUnit = useMutation({
    mutationFn: () => propertyService.createUnit(selectedPropertyId!, unitName.trim()),
    onSuccess: () => {
      setUnitName("");
      Alert.alert("Unit added");
    }
  });

  const assignTenant = useMutation({
    mutationFn: async () => {
      if (!selectedPropertyId) throw new Error("Select property first.");
      const units = await propertyService.listUnits(selectedPropertyId);
      if (!units.length) throw new Error("Create unit first.");
      const tenant = await tenantService.createTenant(tenantUserId.trim(), units[0].id);
      await tenantService.createRentAgreement(tenant.id, Number(rentAmount), Number(dueDate), new Date().toISOString());
    },
    onSuccess: () => {
      setTenantUserId("");
      setRentAmount("");
      Alert.alert("Tenant assigned + rent agreement created");
    },
    onError: (e: Error) => Alert.alert("Error", e.message)
  });

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Properties</Text>
      <AppInput placeholder="Property name" value={propertyName} onChangeText={setPropertyName} />
      <AppInput placeholder="Location" value={location} onChangeText={setLocation} />
      <AppButton label="Create Property" onPress={() => addProperty.mutate()} />

      <Text style={styles.subtitle}>Your properties</Text>
      {!propertiesQuery.data?.length ? (
        <EmptyState message="No properties yet" />
      ) : (
        propertiesQuery.data.map((p: any) => (
          <View key={p.id} style={styles.card}>
            <Text>{p.name}</Text>
            <Text>{p.location}</Text>
            <AppButton label="Select" onPress={() => setSelectedPropertyId(p.id)} disabled={selectedPropertyId === p.id} />
          </View>
        ))
      )}

      <Text style={styles.subtitle}>Add Unit (selected property)</Text>
      <AppInput placeholder="Unit name" value={unitName} onChangeText={setUnitName} />
      <AppButton label="Add Unit" onPress={() => addUnit.mutate()} disabled={!selectedPropertyId} />

      <Text style={styles.subtitle}>Assign Tenant + Agreement</Text>
      <AppInput placeholder="Tenant user id" value={tenantUserId} onChangeText={setTenantUserId} />
      <AppInput placeholder="Rent amount" value={rentAmount} onChangeText={setRentAmount} keyboardType="numeric" />
      <AppInput placeholder="Due day (1-28)" value={dueDate} onChangeText={setDueDate} keyboardType="numeric" />
      <AppButton label="Assign + Create Agreement" onPress={() => assignTenant.mutate()} />
    </ScrollView>
  );
}

function OwnerPaymentsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const { formatAmount } = useCurrency();
  const { paymentsQuery } = useOwnerDashboard(user.id);
  const queryClient = useQueryClient();

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      paymentService.updatePaymentStatus(id, status),
    onSuccess: async (_, variables) => {
      await notify("Payment updated", `Payment ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["owner-payments", user.id] });
    }
  });

  if (paymentsQuery.isLoading) return <Loader />;
  if (!paymentsQuery.data?.length) return <EmptyState message="No payments found" />;

  return (
    <FlatList
      style={styles.screen}
      data={paymentsQuery.data}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: any) => (
        <View style={styles.card}>
          <Text>Amount: {formatAmount(item.amount)}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Method: {item.method}</Text>
          <AppButton label="Approve" onPress={() => setStatus.mutate({ id: item.id, status: "approved" })} />
          <AppButton label="Reject" onPress={() => setStatus.mutate({ id: item.id, status: "rejected" })} />
        </View>
      )}
    />
  );
}

function ExpensesScreen() {
  const user = useAuthStore((s) => s.user)!;
  const { formatAmount } = useCurrency();
  const { expensesQuery } = useOwnerDashboard(user.id);
  const selectedPropertyId = useAppStore((s) => s.selectedPropertyId);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const addExpense = useMutation({
    mutationFn: () => {
      const parsed = Number(amount);
      if (!selectedPropertyId) throw new Error("Select property first");
      if (!parsed || parsed <= 0) throw new Error("Invalid amount");
      return expenseService.addExpense(selectedPropertyId, category.trim(), parsed, notes.trim());
    },
    onSuccess: () => {
      setCategory("");
      setAmount("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["owner-expenses", user.id] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message)
  });

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Expenses</Text>
      <AppInput placeholder="Category" value={category} onChangeText={setCategory} />
      <AppInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <AppInput placeholder="Notes" value={notes} onChangeText={setNotes} />
      <AppButton label="Add Expense" onPress={() => addExpense.mutate()} />

      <Text style={styles.subtitle}>Expense list</Text>
      {(expensesQuery.data || []).map((e: any) => (
        <View key={e.id} style={styles.card}>
          <Text>{e.category}</Text>
          <Text>{formatAmount(e.amount)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function DocumentsScreen() {
  const user = useAuthStore((s) => s.user)!;
  const selectedPropertyId = useAppStore((s) => s.selectedPropertyId);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  const pickAndUpload = async () => {
    if (!selectedPropertyId) return Alert.alert("Select property first.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      await documentService.uploadDocument({ propertyId: selectedPropertyId, userId: user.id, fileBlob: blob });
      const latest = await documentService.listDocumentsForOwner(user.id);
      setDocuments(latest);
      Alert.alert("Document uploaded");
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    documentService
      .listDocumentsForOwner(user.id)
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, [user.id]);

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Documents</Text>
      <Text>Upload document + OCR placeholder metadata</Text>
      <AppButton label={uploading ? "Uploading..." : "Upload Document"} onPress={pickAndUpload} disabled={uploading} />
      <Text style={styles.subtitle}>Uploaded documents</Text>
      {documents.length === 0 ? <EmptyState message="No documents yet." /> : null}
      {documents.map((doc) => (
        <View key={doc.id} style={styles.card}>
          <Text numberOfLines={1}>{doc.file_url}</Text>
          <Text>{JSON.stringify(doc.extracted_data)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function TenantDashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user)!;
  const { formatAmount, currency } = useCurrency();
  const { agreementQuery, paymentsQuery } = useTenantData(user.id);
  if (agreementQuery.isLoading || paymentsQuery.isLoading) return <Loader />;
  const rent = agreementQuery.data?.rent_amount ?? 0;
  const paid = (paymentsQuery.data || [])
    .filter((p: any) => p.status === "approved")
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const due = Math.max(rent - paid, 0);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Tenant Dashboard</Text>
      <Text>Currency: {currency}</Text>
      <Text>Rent: {formatAmount(rent)}</Text>
      <Text>Due amount: {formatAmount(due)}</Text>
      <AppButton label="Pay via UPI" onPress={() => navigation.navigate("TenantPay", { amount: due })} disabled={!due} />
    </View>
  );
}

function TenantPayScreen({ route, navigation }: any) {
  const amount = route.params?.amount ?? 0;
  const user = useAuthStore((s) => s.user)!;
  const { tenantQuery } = useTenantData(user.id);
  const [ownerUpi, setOwnerUpi] = useState<{ upi_id?: string | null; name?: string } | null>(null);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [utrId, setUtrId] = useState("");
  const [manualAmount, setManualAmount] = useState(String(amount || ""));
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);

  const submitPayment = useMutation({
    mutationFn: async () => {
      const parsedAmount = Number(manualAmount);
      if (!parsedAmount || parsedAmount <= 0) throw new Error("Amount must be greater than 0.");
      if ((method === "upi" || method === "bank") && !utrId.trim()) throw new Error("UTR required for UPI/bank.");
      const payment = await paymentService.submitPayment({
        tenantId: tenantQuery.data.id,
        amount: parsedAmount,
        method,
        utrId: utrId.trim()
      });
      let screenshotUrl: string | undefined;
      if (screenshotBlob) screenshotUrl = await documentService.uploadPaymentScreenshot(user.id, payment.id, screenshotBlob);
      if (screenshotUrl) await supabase.from("payments").update({ screenshot_url: screenshotUrl }).eq("id", payment.id);
      await notify("Payment submitted", "Your payment proof is pending owner approval.");
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      navigation.navigate("TenantHistory");
    },
    onError: (e: Error) => Alert.alert("Submit failed", e.message)
  });

  const pickScreenshot = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });
    if (result.canceled) return;
    const res = await fetch(result.assets[0].uri);
    setScreenshotBlob(await res.blob());
  };

  const openUpi = async () => {
    const upi = ownerUpi?.upi_id;
    const payeeName = ownerUpi?.name || "Owner";
    if (!upi) {
      Alert.alert("UPI missing", "Owner has not configured UPI ID yet.");
      return;
    }
    const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(payeeName)}&am=${manualAmount}&cu=INR`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) return Alert.alert("UPI app not found");
    await Linking.openURL(url);
  };

  useEffect(() => {
    tenantService
      .getOwnerForTenantUser(user.id)
      .then(setOwnerUpi)
      .catch(() => setOwnerUpi(null));
  }, [user.id]);

  if (tenantQuery.isLoading) return <Loader />;

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Submit Payment Proof</Text>
      <Text>Current amount: {formatAmount(Number(manualAmount || "0"))}</Text>
      <AppInput value={manualAmount} onChangeText={setManualAmount} keyboardType="numeric" placeholder="Amount" />
      <View style={styles.row}>
        <AppButton label="UPI" onPress={() => setMethod("upi")} disabled={method === "upi"} />
        <AppButton label="Bank" onPress={() => setMethod("bank")} disabled={method === "bank"} />
        <AppButton label="Cash" onPress={() => setMethod("cash")} disabled={method === "cash"} />
      </View>
      {(method === "upi" || method === "bank") && (
        <AppInput placeholder="UTR ID" value={utrId} onChangeText={setUtrId} autoCapitalize="none" />
      )}
      <AppButton label="Open UPI App" onPress={openUpi} disabled={method !== "upi"} />
      <AppButton label="Upload Screenshot" onPress={pickScreenshot} />
      <AppButton label={submitPayment.isPending ? "Submitting..." : "Submit Proof"} onPress={() => submitPayment.mutate()} />
    </ScrollView>
  );
}

function TenantHistoryScreen() {
  const user = useAuthStore((s) => s.user)!;
  const { formatAmount } = useCurrency();
  const { paymentsQuery } = useTenantData(user.id);
  if (paymentsQuery.isLoading) return <Loader />;
  if (!paymentsQuery.data?.length) return <EmptyState message="No payment history." />;
  return (
    <FlatList
      style={styles.screen}
      data={paymentsQuery.data}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: any) => (
        <View style={styles.card}>
          <Text>Amount: {formatAmount(item.amount)}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Method: {item.method}</Text>
        </View>
      )}
    />
  );
}

function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [upiId, setUpiId] = useState(user?.upi_id || "");
  const [saving, setSaving] = useState(false);
  const { currency, setCurrency, usdToInr } = useCurrency();

  const saveUpi = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await authService.updateUpiId(user.id, upiId);
      setUser(updated);
      Alert.alert("Saved", "UPI ID updated.");
    } catch (e: any) {
      Alert.alert("Failed", e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setUpiId(user?.upi_id || "");
  }, [user?.upi_id]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Profile</Text>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Text>Role: {user?.role}</Text>
      <Text style={styles.subtitle}>Currency</Text>
      <Text>Live USD/INR: {usdToInr.toFixed(2)}</Text>
      <View style={styles.row}>
        <AppButton label="INR" onPress={() => setCurrency("INR")} disabled={currency === "INR"} />
        <AppButton label="USD" onPress={() => setCurrency("USD")} disabled={currency === "USD"} />
      </View>
      {user?.role === "owner" && (
        <>
          <Text style={styles.subtitle}>Owner UPI ID</Text>
          <AppInput
            placeholder="e.g. name@upi"
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />
          <AppButton label={saving ? "Saving..." : "Save UPI ID"} onPress={saveUpi} disabled={saving} />
        </>
      )}
      <AppButton
        label="Logout"
        onPress={async () => {
          await authService.signOut();
          setUser(null);
        }}
      />
    </View>
  );
}

function OwnerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Payments" component={OwnerPaymentsScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function TenantTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="TenantHome" component={TenantDashboardScreen} options={{ title: "Dashboard" }} />
      <Tab.Screen name="TenantPay" component={TenantPayScreen} options={{ title: "Pay Rent" }} />
      <Tab.Screen name="TenantHistory" component={TenantHistoryScreen} options={{ title: "Payments" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, setUser, loading, setLoading } = useAuthStore();
  const role = useMemo(() => user?.role, [user?.role]);

  useEffect(() => {
    setupNotifications();
    authService
      .getCurrentProfile()
      .then((profile) => setUser(profile))
      .finally(() => setLoading(false));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        return;
      }
      const profile = await authService.getCurrentProfile();
      setUser(profile);
    });

    return () => subscription.unsubscribe();
  }, [setLoading, setUser]);

  if (loading) return <Loader />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        ) : role === "owner" ? (
          <RootStack.Screen name="Owner" component={OwnerTabs} />
        ) : (
          <RootStack.Screen name="Tenant" component={TenantTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: "#f7f9fb" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#191c1e" },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 10, color: "#191c1e" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, gap: 6 }
});
