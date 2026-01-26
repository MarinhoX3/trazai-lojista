"use client";

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// Nota: Estes imports dependem da estrutura do seu projeto local
import api from "../../src/api/api";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "";

const storeCategories = [
  { id: "", name: "Selecione uma categoria" },
  { id: "Acessórios", name: "Acessórios" },
  { id: "Pet Shop", name: "Pet Shop" },
  { id: "Mercearia", name: "Mercearia" },
  { id: "Moda", name: "Moda" },
  { id: "Casa & Decoração", name: "Casa & Decoração" },
  { id: "Serviços", name: "Serviços" },
  { id: "Eletrônicos", name: "Eletrônicos" },
  { id: "Beleza", name: "Beleza" },
  { id: "Saúde", name: "Saúde" },
  { id: "Variedades", name: "Variedades" },
];

export default function RegisterStore() {
  const router = useRouter();

  // ESTADOS DO FORMULÁRIO
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [telefoneContato, setTelefoneContato] = useState("");
  const [whatsapps, setWhatsapps] = useState([{ numero: "", descricao: "", ativo: true }]);
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [categoria, setCategoria] = useState(storeCategories[0].id);
  const [logo, setLogo] = useState<any>(null);
  
  // ESTADOS DE CONTROLO
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // FUNÇÕES DE APOIO
  const buscarCep = async (valor: string) => {
    const limpa = valor.replace(/\D/g, "");
    setCep(limpa);
    if (limpa.length !== 8) return;
    try {
      const { data } = await axios.get(`https://viacep.com.br/ws/${limpa}/json/`);
      if (data.erro) return Alert.alert("CEP inválido");
      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
    } catch {
      Alert.alert("Erro", "Não foi possível procurar o CEP.");
    }
  };

  const usarLocalizacaoAtual = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Permissão negada", "Ative a localização nas definições do dispositivo.");
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      const geo = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const e = geo[0];
      setCep(e?.postalCode?.replace(/\D/g, "") || "");
      setRua(e?.street || "");
      setNumero(e?.name || "");
      setBairro(e?.district || "");
      setCidade(e?.city || "");
      setUf(e?.region || "");
      Alert.alert("Sucesso", "Morada preenchida automaticamente via GPS!");
    } finally {
      setLoadingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Aviso", "Precisamos de acesso à sua galeria.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setLogo(result.assets[0]);
  };

  const registrar = async () => {
    if (!email || !senha || !confirmSenha || !nomeLoja || !telefoneContato) {
      return Alert.alert("Campos Obrigatórios", "Por favor, preencha todos os dados básicos da loja.");
    }
    if (senha !== confirmSenha) return Alert.alert("Erro", "As palavras-passe não coincidem.");
    if (!lat || !lng) return Alert.alert("Localização", "Defina a localização da loja no mapa ou via GPS.");

    setLoading(true);
    try {
      const form = new FormData();
      form.append("email_login", email);
      form.append("senha", senha);
      form.append("nome_loja", nomeLoja);
      form.append("cnpj_cpf", cnpjCpf);
      form.append("telefone_contato", telefoneContato);
      form.append("endereco_loja", `${rua}, ${numero} - ${bairro}, ${cidade} - ${uf}`);
      form.append("whatsapps", JSON.stringify(whatsapps));
      form.append("latitude", String(lat));
      form.append("longitude", String(lng));
      form.append("categoria", categoria);

      if (logo) {
        const uri = logo.uri;
        const ext = uri.split(".").pop();
        form.append("logo", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: `logo.${ext}`,
          type: `image/${ext}`,
        } as any);
      }

      await api.post("/lojas", form, { headers: { "Content-Type": "multipart/form-data" } });
      Alert.alert("Sucesso", "A sua loja foi registada com sucesso!");
      router.replace("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ocorreu um erro ao registar a loja.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  // RENDERIZAÇÃO DE INPUTS PADRONIZADOS
  const renderInput = (label: string, icon: any, value: string, onChange: (t: string) => void, props?: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color="#94a3b8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#cbd5e1"
          {...props}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* CABEÇALHO PERSONALIZADO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Conta de Lojista</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECÇÃO LOGOTIPO */}
        <View style={styles.logoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.logoCircle}>
            {logo ? (
              <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={32} color="#94a3b8" />
                <Text style={styles.logoPlaceholderText}>Logo da Loja</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECÇÃO 1: ACESSO */}
        <Text style={styles.sectionTitle}>Dados de Acesso</Text>
        <View style={styles.card}>
          {renderInput("E-mail Profissional", "mail-outline", email, setEmail, { placeholder: "exemplo@loja.com", keyboardType: "email-address", autoCapitalize: "none" })}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderInput("Palavra-passe", "lock-closed-outline", senha, setSenha, { secureTextEntry: true, placeholder: "••••••" })}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {renderInput("Confirmar", "shield-checkmark-outline", confirmSenha, setConfirmSenha, { secureTextEntry: true, placeholder: "••••••" })}
            </View>
          </View>
        </View>

        {/* SECÇÃO 2: DADOS DO NEGÓCIO */}
        <Text style={styles.sectionTitle}>Sobre o Negócio</Text>
        <View style={styles.card}>
          {renderInput("Nome Fantasia", "business-outline", nomeLoja, setNomeLoja, { placeholder: "Nome da loja no app" })}
          {renderInput("CNPJ ou CPF", "document-text-outline", cnpjCpf, setCnpjCpf, { placeholder: "Documento oficial", keyboardType: "numeric" })}
          {renderInput("Telefone de Contacto", "call-outline", telefoneContato, setTelefoneContato, { placeholder: "(00) 00000-0000", keyboardType: "phone-pad" })}
          
          <Text style={styles.label}>Categoria de Atuação</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
              {storeCategories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* SECÇÃO 3: WHATSAPPS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Contactos WhatsApp</Text>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setWhatsapps([...whatsapps, { numero: "", descricao: "", ativo: true }])}
          >
            <Ionicons name="add-circle" size={18} color="#16a34a" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {whatsapps.map((w, index) => (
          <View key={index} style={styles.whatsCard}>
            <View style={styles.whatsHeader}>
              <TouchableOpacity 
                onPress={() => {
                  const clone = [...whatsapps];
                  clone[index].ativo = !clone[index].ativo;
                  setWhatsapps(clone);
                }}
                style={[styles.statusBadge, { backgroundColor: w.ativo ? '#dcfce7' : '#f1f5f9' }]}
              >
                <View style={[styles.statusDot, { backgroundColor: w.ativo ? '#22c55e' : '#94a3b8' }]} />
                <Text style={[styles.statusText, { color: w.ativo ? '#166534' : '#64748b' }]}>
                  {w.ativo ? 'Ativo' : 'Inativo'}
                </Text>
              </TouchableOpacity>
              {whatsapps.length > 1 && (
                <TouchableOpacity onPress={() => setWhatsapps(whatsapps.filter((_, i) => i !== index))}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.whatsInput}
              placeholder="Número (Ex: 5511999999999)"
              keyboardType="phone-pad"
              value={w.numero}
              onChangeText={(txt) => {
                const clone = [...whatsapps];
                clone[index].numero = txt;
                setWhatsapps(clone);
              }}
            />
            <TextInput
              style={[styles.whatsInput, { marginTop: 8 }]}
              placeholder="Descrição (Ex: Equipa de Vendas)"
              value={w.descricao}
              onChangeText={(txt) => {
                const clone = [...whatsapps];
                clone[index].descricao = txt;
                setWhatsapps(clone);
              }}
            />
          </View>
        ))}

        {/* SECÇÃO 4: LOCALIZAÇÃO */}
        <Text style={styles.sectionTitle}>Localização da Loja</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={[styles.gpsBtn, loadingLocation && { opacity: 0.7 }]} 
            onPress={usarLocalizacaoAtual}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.gpsBtnText}>Obter via GPS</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {renderInput("CEP", "map-outline", cep, buscarCep, { keyboardType: "numeric", maxLength: 8 })}
          {renderInput("Morada / Rua", "pin-outline", rua, setRua)}
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderInput("Número", "home-outline", numero, setNumero)}
            </View>
            <View style={{ flex: 1.5, marginLeft: 8 }}>
              {renderInput("Bairro", "layers-outline", bairro, setBairro)}
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 2, marginRight: 8 }}>
              {renderInput("Cidade", "location-outline", cidade, setCidade)}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              {renderInput("UF", "flag-outline", uf, setUf, { autoCapitalize: "characters", maxLength: 2 })}
            </View>
          </View>
        </View>

        {/* BOTÃO DE SUBMISSÃO */}
        <TouchableOpacity 
          style={[styles.mainBtn, loading && { opacity: 0.7 }]} 
          onPress={registrar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainBtnText}>Registar Loja</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Ao prosseguir, concorda com a nossa política de privacidade.
        </Text>

      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 20, 
    paddingHorizontal: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  backBtn: { padding: 4 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // Logotipo
  logoSection: { alignItems: 'center', marginBottom: 24 },
  logoCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  logoPreview: { width: 100, height: 100, borderRadius: 50 },
  logoPlaceholder: { alignItems: 'center' },
  logoPlaceholderText: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  cameraBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 5, 
    backgroundColor: '#2563eb', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },

  // Cards e Secções
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginTop: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },

  // Inputs
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginLeft: 2 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    paddingHorizontal: 12 
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, fontSize: 14, color: '#1e293b' },
  
  pickerWrapper: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 44, justifyContent: 'center' },
  picker: { width: '100%', color: '#1e293b' },

  // WhatsApp
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  addBtnText: { marginLeft: 4, color: '#16a34a', fontWeight: '700', fontSize: 11 },
  whatsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  whatsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  whatsInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 40, fontSize: 14, color: '#1e293b' },

  // Localização
  gpsBtn: { 
    backgroundColor: '#0ea5e9', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 44, 
    borderRadius: 12 
  },
  gpsBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 13 },

  // Submissão
  mainBtn: { 
    backgroundColor: '#16a34a', 
    height: 52, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2
  },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerNote: { textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 24 },
});