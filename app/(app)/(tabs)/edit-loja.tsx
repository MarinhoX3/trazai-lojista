"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView, // Mantido no import para o Platform.OS
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  TouchableOpacity,
  Modal,
  Switch,
  StatusBar, // Adicionado
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Linking } from "react-native";

// Importações de Contextos e API
import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

// =======================================================
// TIPOS
// =======================================================

type WhatsappEntry = {
  id?: number;
  id_loja?: number;
  numero_whatsapp: string;
  nome_vendedor?: string | null;
  descricao?: string | null;
  ativo?: 0 | 1;
};

// =======================================================
// COMPONENTE PRINCIPAL
// =======================================================

export default function EditLojaScreen() {
  const router = useRouter();
  const { loja, token, logout } = useAuthLoja();

  // --- ESTADOS PRINCIPAIS DA LOJA ---
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  // --- ESTADOS WHATSAPP ---
  const [whatsapps, setWhatsapps] = useState<WhatsappEntry[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [modalWaVisible, setModalWaVisible] = useState(false);
  const [waEditing, setWaEditing] = useState<WhatsappEntry | null>(null);
  const [waNumero, setWaNumero] = useState("");
  const [waNomeVendedor, setWaNomeVendedor] = useState("");
  const [waDescricao, setWaDescricao] = useState("");
  const [waAtivo, setWaAtivo] = useState(true);
  const [savingWa, setSavingWa] = useState(false);
  const [originalWaNumero, setOriginalWaNumero] = useState(''); 

  // =======================================================
  // FUNÇÕES AUXILIARES
  // =======================================================

  const handleGoBack = () => {
    router.back();
  };

  const HeaderBar = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  // =======================================================
  // EFEITOS (useEffect)
  // =======================================================

  useEffect(() => {
    if (!loja?.id) {
      setLoading(false);
      return;
    }

    const lojaId = loja.id;

    const loadLoja = async () => {
      try {
        const res = await api.get(`/lojas/${lojaId}`);
        const { nome_loja, telefone_contato, endereco_loja, url_logo, pix_key } =
          res.data;

        setNome(nome_loja || "");
        setTelefone(telefone_contato || "");
        setEndereco(endereco_loja || "");
        setPixKey(pix_key || "");
        setLogoAtualUrl(url_logo);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados da loja.");
      } finally {
        setLoading(false);
      }
    };

    const loadWhatsapps = async () => {
      try {
        setWaLoading(true);
        const res = await api.get(`/lojas/${lojaId}/whatsapps`);
        setWhatsapps(Array.isArray(res.data) ? res.data : []);
      } catch {
        setWhatsapps([]);
      } finally {
        setWaLoading(false);
      }
    };

    loadLoja();
    loadWhatsapps();
  }, [loja?.id]);

  // =======================================================
  // FUNÇÕES DE LÓGICA
  // =======================================================

  // --- IMAGEM / LOGO ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) setLogo(result.assets[0]);
  };

  // --- ATUALIZAÇÃO DA LOJA ---
  const handleUpdate = async () => {
    // 🔒 Verificação de segurança para garantir que loja.id existe antes de prosseguir.
    if (!loja?.id) {
      Alert.alert("Erro", "ID da loja não encontrado.");
      return;
    }

    const formData = new FormData();
    formData.append("nome_loja", nome);
    formData.append("telefone_contato", telefone);
    formData.append("endereco_loja", endereco);
    formData.append("pix_key", pixKey);

    if (logo) {
      const uri = logo.uri;
      const ext = uri.split(".").pop();
      formData.append("logo", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        type: `image/${ext}`,
        name: `logo.${ext}`,
      } as any);
    }

    try {
      setLoading(true);
      await api.put(`/lojas/${loja.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Sucesso", "Dados atualizados!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA WHATSAPP (MODAL, SALVAR, EXCLUIR) ---

  const openAddWaModal = () => {
    setWaEditing(null);
    setWaNumero("");
    setWaNomeVendedor("");
    setWaDescricao("");
    setWaAtivo(true);
    setOriginalWaNumero(''); // Limpa o original para criação
    setModalWaVisible(true);
  };

  const openEditWaModal = (w: WhatsappEntry) => {
    const rawNumber = w.numero_whatsapp || "";
    let displayWaNumero = rawNumber;

    // Se o número for o formato DDI+DDD+N (12 ou 13 dígitos) e começar com '55',
    // removemos o DDI para a visualização no campo de texto.
    if (rawNumber.startsWith('55') && rawNumber.length >= 12 && rawNumber.length <= 13) {
        displayWaNumero = rawNumber.substring(2);
    }
    
    setWaEditing(w); 
    setWaNumero(displayWaNumero); 
    setWaNomeVendedor(w.nome_vendedor || ""); 
    setWaDescricao(w.descricao || ""); 
    setWaAtivo(w.ativo === 1); 
    setOriginalWaNumero(rawNumber.replace(/\D/g, '')); // ARMAZENA O ORIGINAL (LIMPO)
    setModalWaVisible(true); 
  };

  const saveWhatsapp = async () => {
    // 1. Limpa o número de caracteres não numéricos do campo de entrada
    let cleanNumero = waNumero.trim().replace(/\D/g, ''); 

    if (!cleanNumero) {
      Alert.alert("Erro", "Informe um número de WhatsApp.");
      return;
    }

    // 2. Garante o DDI (55)
    if (cleanNumero.length === 11 && !cleanNumero.startsWith('55')) {
      cleanNumero = `55${cleanNumero}`;
    }
    
    if (!loja?.id && !waEditing) {
      Alert.alert("Erro", "Dados da loja não disponíveis para adicionar contato.");
      return;
    }

    // 3. Prepara o payload APENAS com nome/descrição/ativo
    const payload: any = {
      nome_vendedor: waNomeVendedor.trim() || null,
      descricao: waDescricao.trim() || null,
      ativo: waAtivo ? 1 : 0,
    };
    
    // 4. LÓGICA CHAVE CONTRA O BUG DE UNICIDADE DO SERVIDOR (APENAS NA EDIÇÃO):
    if (waEditing) {
        // Se o número formatado for DIFERENTE do número original salvo no banco,
        // então e SÓ entao, incluímos o campo numero_whatsapp no payload de UPDATE.
        if (cleanNumero !== originalWaNumero) {
            payload.numero_whatsapp = cleanNumero;
        }
    } else {
      // Se for CRIAÇÃO, o número é sempre obrigatório.
      payload.numero_whatsapp = cleanNumero;
    }
    
    try {
      setSavingWa(true);
      let successMessage = "";

      if (waEditing) {
        // UPDATE: Endpoint corrigido para /lojas/whatsapp/{id}
        const res = await api.put(`/lojas/whatsapp/${waEditing.id}`, payload);
        
        setWhatsapps(prev => prev.map(w => (w.id === waEditing.id ? res.data : w)));
        successMessage = "Contato atualizado com sucesso!";
      } else {
        // CREATE
        const res = await api.post(`/lojas/${loja!.id}/whatsapps`, payload);
        setWhatsapps(prev => [res.data, ...prev]);
        successMessage = "Novo contato salvo!";
      }

      setModalWaVisible(false);
      Alert.alert("Sucesso", successMessage);

    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar. O servidor rejeitou o número.");
    } finally {
      setSavingWa(false);
    }
  };

  const deleteWhatsapp = (id?: number) => {
    if (!id) return;

    Alert.alert("Excluir", "Deseja excluir este contato?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            // DELETE: Endpoint corrigido para /lojas/whatsapp/{id}
            await api.delete(`/lojas/whatsapp/${id}`);
            setWhatsapps((prev) => prev.filter((w) => w.id !== id));
            Alert.alert("Sucesso", "Contato excluído."); 
          } catch {
            Alert.alert("Erro", "Não foi possível excluir.");
          }
        },
      },
    ]);
  };

  const toggleAtivo = async (entry: WhatsappEntry) => {
    try {
      // PUT Toggle: Endpoint corrigido para /lojas/whatsapp/{id}
      const res = await api.put(`/lojas/whatsapp/${entry.id}`, {
        ...entry,
        ativo: entry.ativo ? 0 : 1,
      });

      setWhatsapps((prev) =>
        prev.map((w) => (w.id === entry.id ? res.data : w))
      );
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar.");
    }
  };

  // --- AÇÕES DIVERSAS ---
  const handleConnectStripe = () => {
    Alert.alert("Ação", "Configurar Pagamentos (Stripe) - Implementar.");
  };

  const handleContactSupport = () => {
    Alert.alert("Ação", "Falar com Suporte - Implementar.");
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  };

  // --- PROPRIEDADES DERIVADAS ---
  const displayImageUri =
    logo?.uri ||
    (logoAtualUrl
      ? `${ASSET_BASE_URL}/${logoAtualUrl}?t=${Date.now()}`
      : undefined);

  // =======================================================
  // RENDERIZAÇÃO (JSX)
  // =======================================================

  // Exibição de loading inicial
  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Carregando dados da loja...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* 1. HEADER FIXO (RESOLVE BRIGA COM BARRA DO CELULAR) */}
      <HeaderBar title="Configurações da Loja" onBack={handleGoBack} /> 

      <KeyboardAwareScrollView
        enableOnAndroid
        extraHeight={120}
        extraScrollHeight={80}
        keyboardOpeningTime={0}
        contentContainerStyle={styles.scrollContent}
      >
        {/* LOGO DA LOJA */}
        <Pressable onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
          <Text style={styles.imagePickerText}>Tocar para alterar o logo</Text>
        </Pressable>

        {/* CAMPOS PRINCIPAIS */}
        <Text style={styles.label}>Nome da Loja</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Telefone de Contato</Text>
        <TextInput
          style={styles.input}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Endereço da Loja</Text>
        <TextInput
          style={styles.input}
          value={endereco}
          onChangeText={setEndereco}
          multiline
        />

        <Text style={styles.label}>Chave PIX</Text>
        <TextInput
          style={styles.input}
          value={pixKey}
          onChangeText={setPixKey}
          placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
        />

        {/* BOTÃO SALVAR */}
        <View style={styles.buttonContainer}>
          <Button title="Salvar Alterações" onPress={handleUpdate} />
        </View>

        {/* SEPARADOR */}
        <View style={styles.divider} />

        {/* WHATSAPP LISTA */}
        <View style={styles.waHeader}>
          <Text style={styles.sectionTitle}>Contatos WhatsApp</Text>

          <Pressable style={styles.addWaButton} onPress={openAddWaModal}>
            <Ionicons name="add-circle-outline" size={22} color="#007BFF" />
            <Text style={styles.addWaText}>Adicionar</Text>
          </Pressable>
        </View>

        {/* LISTA DE WHATSAPPS */}
        {waLoading ? (
          <ActivityIndicator />
        ) : whatsapps.length === 0 ? (
          <Text style={{ textAlign: "center", marginVertical: 10 }}>
            Nenhum contato cadastrado.
          </Text>
        ) : (
          whatsapps.map((item) => (
            <View key={item.id} style={styles.waCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.waName}>
                  {item.nome_vendedor || "Atendente"}
                </Text>
                <Text style={styles.waNumber}>{item.numero_whatsapp}</Text>
                {!!item.descricao && (
                  <Text style={styles.waDesc}>{item.descricao}</Text>
                )}
              </View>

              <View style={styles.waActions}>
                <Switch
                  value={item.ativo === 1}
                  onValueChange={() => toggleAtivo(item)}
                />

                <TouchableOpacity
                  onPress={() => openEditWaModal(item)}
                  style={styles.iconBtn}
                >
                  <Ionicons name="create-outline" size={20} color="#444" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteWhatsapp(item.id)}
                  style={styles.iconBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#D00" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* DIVISOR */}
        <View style={styles.divider} />

        {/* PAGAMENTOS */}
        <Text style={styles.sectionTitle}>Pagamentos Online</Text>
        <Text style={styles.sectionDescription}>
          Conecte-se para receber pagamentos online.
        </Text>

        <Button
          title={stripeLoading ? "Aguarde..." : "Configurar Pagamentos"}
          onPress={handleConnectStripe}
          disabled={stripeLoading}
          color="#6772E5"
        />

        {/* AJUDA */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push("/ajuda" as any)}
        >
          <Ionicons name="help-circle-outline" size={24} color="#16A34A" />
          <Text style={styles.helpButtonText}>Central de Ajuda</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* SUPORTE */}
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color="#2563EB" />
          <Text style={styles.supportButtonText}>Falar com Suporte</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <View style={styles.logoutButtonContainer}>
          <Button title="Sair (Logout)" color="red" onPress={handleLogout} />
        </View>
      </KeyboardAwareScrollView>

      {/* ======================= MODAL ADD/EDIT WHATSAPP ======================= */}
      <Modal visible={modalWaVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {waEditing ? "Editar contato" : "Adicionar contato"}
            </Text>

            {/* NOME DO VENDEDOR */}
            <Text style={styles.labelSmall}>Nome do Vendedor (opcional)</Text>
            <TextInput
              style={styles.input}
              value={waNomeVendedor}
              onChangeText={setWaNomeVendedor}
              placeholder="Ex: Atendimento, João, Suporte"
              placeholderTextColor="#888"
            />

            {/* NÚMERO */}
            <Text style={styles.labelSmall}>Número WhatsApp *</Text>
            <TextInput
              style={styles.input}
              value={waNumero}
              onChangeText={setWaNumero}
              placeholder="Ex: 85996574629 ou 5585996574629"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />

            {/* DESCRIÇÃO */}
            <Text style={styles.labelSmall}>Descrição (opcional)</Text>
            <TextInput
              style={styles.input}
              value={waDescricao}
              onChangeText={setWaDescricao}
              placeholder="Ex: Financeiro, Vendas, Suporte"
              placeholderTextColor="#888"
            />

            {/* ATIVO SWITCH */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 10,
              }}
            >
              <Text style={{ marginRight: 10 }}>Ativo</Text>
              <Switch value={waAtivo} onValueChange={setWaAtivo} />
            </View>

            {/* BOTÕES */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: "#ddd" }]}
                onPress={() => setModalWaVisible(false)}
              >
                <Text>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: "#007BFF" }]}
                onPress={saveWhatsapp}
                disabled={savingWa}
              >
                {savingWa ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>
                    {waEditing ? "Salvar" : "Adicionar"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =======================================================
// ESTILOS
// =======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  /* ========================= HEADER CUSTOM ========================= */
  headerContainer: {
    // Altura adaptada para a barra de status do Android e iOS
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50, 
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    // Usamos padding para centralizar, já que o backButton é posicionado absolutamente
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    left: 15,
    zIndex: 10,
    paddingRight: 15,
  },
  /* ========================= FIM HEADER CUSTOM ===================== */

  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    marginBottom: 6,
  },
  imagePickerText: {
    textAlign: "center",
    color: "#007BFF",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  labelSmall: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: 6,
    marginBottom: 12,
  },
  divider: {
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
    textAlign: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  helpButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#16A34A",
    marginLeft: 12,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  supportButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 12,
  },
  logoutButtonContainer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  /* ========================= WHATSAPP LIST ========================= */
  waHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addWaButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addWaText: {
    marginLeft: 6,
    color: "#007BFF",
    fontWeight: "600",
  },
  waCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  waName: {
    fontSize: 16,
    fontWeight: "700",
  },
  waNumber: {
    color: "#333",
    marginTop: 4,
  },
  waDesc: {
    color: "#666",
    marginTop: 4,
  },
  waActions: {
    flexDirection: 'row', 
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  iconBtn: {
    padding: 6,
    marginLeft: 6, 
  },
  /* ========================= MODAL ========================= */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "92%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
});