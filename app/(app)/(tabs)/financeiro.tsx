import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';

// ⚠️ AJUSTE ESTES IMPORTS conforme a estrutura do seu projeto!
// Exemplo: 'api' é o seu cliente Axios. 'useAuth' é de onde você pega o ID da loja.
import api from '../../../src/api/api';
import * as AuthContext from '../../../src/api/contexts/AuthLojaContext';

/**
 * Compatibilidade com diferentes formas de exportação do módulo de autenticação:
 * - se o módulo exportar `useAuth` como named export, vamos chamá-lo;
 * - se o módulo exportar um Contexto como default, usamos React.useContext;
 * - caso contrário, retornamos um objeto vazio com `loja: undefined`.
 */
const useAuth = () => {
    const anyModule = AuthContext as any;
    try {
        if (typeof anyModule.useAuth === 'function') {
            return anyModule.useAuth();
        }
        if (anyModule.default) {
            return React.useContext(anyModule.default);
        }
    } catch (e) {
        // ignore and fallback
    }
    return { loja: undefined };
};

// --- Tipagens ---

interface RepasseFuturo {
  data: Date;
  valor: number;
}

// --- Funções Auxiliares ---

/**
 * Funcao CRUCIAL para garantir que a string do backend vire um numero valido.
 * 1. Remove espacos.
 * 2. Substitui virgula por ponto (necessario para Number()).
 */
const cleanValue = (value: string | number | undefined) => {
    if (typeof value === 'string') {
        return value.trim().replace(',', '.'); 
    }
    // Garante que qualquer coisa que nao seja string seja tratada como '0' se for nulo
    return String(value || '0').trim().replace(',', '.');
};

/**
 * Formata um número para o padrão monetário brasileiro (R$ X,XX)
 */
const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// --- Componente Principal ---

const Financeiro = () => {
    // --- States ---
    const { loja } = useAuth(); // Assume que o ID da loja é pego do contexto
    
    const [loading, setLoading] = useState(false);
    const [saldoDisponivel, setSaldoDisponivel] = useState(0);
    const [saldoACaminho, setSaldoACaminho] = useState(0);
    const [repassesFuturos, setRepassesFuturos] = useState<RepasseFuturo[]>([]);
    const [totalComissao, setTotalComissao] = useState(0);
    const [comissaoId, setComissaoId] = useState<string | null>(null);
    const [contaDestino, setContaDestino] = useState('Não definida');
    const [taxaEntrega, setTaxaEntrega] = useState('0.00'); // Mantido como string para exibir formatado

    // --- Lógica de Fetch de Dados (Onde a mágica acontece) ---
    
    const fetchDadosFinanceiros = useCallback(async () => {
        // Use 2 como fallback, mas o ideal é que loja.id seja válido
        const lojaId = loja?.id || 2; 

        if (!lojaId) return;

        setLoading(true);

        try {
            // 1. Busca os dados do SALDO (Endpoint corrigido: /api/financeiro/saldo/...)
            const saldoResponse = await api.get(`/api/financeiro/saldo/${lojaId}`);
            
            const saldoDisponivelString = saldoResponse.data.saldo_disponivel;
            const saldoACaminhoString = saldoResponse.data.saldo_acaminho;
            
            // 2. Limpeza e Conversão Robusta:
            const saldoDisponivelRaw = Number(cleanValue(saldoDisponivelString));
            const saldoACaminhoRaw = Number(cleanValue(saldoACaminhoString));

            // 3. Define o Estado: Verifica se a conversao deu NaN e usa 0 se falhar
            const finalSaldoDisponivel = isNaN(saldoDisponivelRaw) ? 0 : saldoDisponivelRaw;
            const finalSaldoACaminho = isNaN(saldoACaminhoRaw) ? 0 : saldoACaminhoRaw; // Este deve ser 9.78!
            
            setSaldoDisponivel(finalSaldoDisponivel);
            setSaldoACaminho(finalSaldoACaminho); 
            
            // LOG PARA DEBUG: VERIFIQUE NO CONSOLE DO SEU APP!
            console.log('Dados do Backend Lidos:', saldoResponse.data);
            console.log('Valor final Saldo a Caminho (DEVE SER 9.78):', finalSaldoACaminho); 

            // 4. Repasses Futuros
            const repasses = saldoResponse.data.repasses_futuros || [];
            
            const repassesFormatados = repasses.map((repasse: { data: string, valor: string }) => ({
                ...repasse,
                data: new Date(repasse.data), 
                valor: Number(cleanValue(repasse.valor)) || 0, 
            }));

            setRepassesFuturos(repassesFormatados);
            
            // 5. Comissões Pendentes (Ajuste o endpoint se necessario)
            const comissoesResponse = await api.get(`/api/payments/comissoes-pendentes/${lojaId}`);
            const { valorPendente, comissaoId: fetchedComissaoId } = comissoesResponse.data;

            setTotalComissao(Number(cleanValue(valorPendente)) || 0);
            setComissaoId(fetchedComissaoId ?? null);

            // 6. Taxa de Entrega (Ajuste o endpoint se necessario)
            const lojaResponse = await api.get(`/api/lojas/${lojaId}`); 
            setTaxaEntrega(Number(cleanValue(lojaResponse.data.taxa_entrega || '0')).toFixed(2));
            
            // 7. Conta Destino
            if(saldoResponse.data.contaDestino) {
                setContaDestino(saldoResponse.data.contaDestino);
            }

        } catch (err) {
            console.log("Erro ao carregar financeiro:", err);
            Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
        }

        setLoading(false);
    }, [loja?.id]);

    // --- Efeito para Carregar Dados ---
    
    useEffect(() => {
        fetchDadosFinanceiros();
    }, [fetchDadosFinanceiros]);

    // --- Renderização ---
    
    if (!loja?.id) {
        return <View style={styles.container}><Text>Aguardando dados da loja...</Text></View>;
    }

    const totalSaldo = saldoDisponivel + saldoACaminho;
    
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text>Carregando dados financeiros...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Financeiro</Text>
            <Text style={styles.headerSubtitle}>Acompanhe seus ganhos e pagamentos</Text>

            {/* CARD DE SALDO TOTAL (Estilo baseado na imagem 9da820.jpg) */}
            <View style={styles.saldoCard}>
                <Text style={styles.saldoCardLabel}>Saldo Total</Text>
                <Text style={styles.saldoCardValue}>{formatCurrency(totalSaldo)}</Text>
                <Text style={styles.saldoCardNextTransfer}>
                    Próxima transferência: {contaDestino.split('•').pop() ? `para ${contaDestino}` : 'A definir'}
                </Text>
            </View>

            {/* SEU SALDO DETALHADO */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seu Saldo Detalhado</Text>
                
                <View style={styles.row}>
                    <Text>Disponível para Repasse (Hoje)</Text>
                    <Text style={styles.valueAvailable}>{formatCurrency(saldoDisponivel)}</Text>
                </View>
                
                <View style={styles.row}>
                    <Text>A Caminho do Seu Banco</Text>
                    {/* Aqui o R$ 9,78 deve aparecer */}
                    <Text style={styles.valueInTransit}>{formatCurrency(saldoACaminho)}</Text> 
                </View>

                <Text style={styles.subSectionTitle}>Repasses Futuros (Estimativa)</Text>
                {repassesFuturos.length > 0 ? (
                    repassesFuturos.map((repasse, index) => (
                        <View key={index} style={styles.row}>
                            <Text>Deve chegar em {repasse.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}.</Text>
                            <Text>{formatCurrency(repasse.valor)}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.subSectionText}>Nenhum repasse futuro no momento.</Text>
                )}

                <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Saldo Total (Disponível + Futuro)</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totalSaldo)}</Text>
                </View>
            </View>

            {/* COMISSÕES DA PLATAFORMA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Comissões da Plataforma</Text>
                <Text style={styles.subSectionText}>
                    Valor a ser pago à plataforma referente aos pedidos em Dinheiro e Pix (10% do valor total).
                </Text>
                <View style={styles.commissionValueContainer}>
                    <Text style={styles.commissionLabel}>Valor Pendente</Text>
                    <Text style={styles.commissionValue}>{formatCurrency(totalComissao)}</Text>
                </View>
                
                {totalComissao > 0 && (
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Efetuar Pagamento da Comissão</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            {/* CONFIGURAR TAXA DE ENTREGA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configurar Taxa de Entrega</Text>
                <Text style={styles.subSectionText}>Taxa atual: {formatCurrency(Number(taxaEntrega))}</Text>
                <TouchableOpacity style={styles.buttonSmall}>
                    <Text style={styles.buttonTextSmall}>Atualizar Taxa</Text>
                </TouchableOpacity>
            </View>
            
             <View style={{ height: 50 }} /> {/* Padding extra no final */}
        </ScrollView>
    );
};

// --- Estilos (Simplificado) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 15,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 5,
    },
    headerSubtitle: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        marginBottom: 5,
    },
    subSectionText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    totalRow: {
        borderTopWidth: 2,
        borderTopColor: '#333',
        marginTop: 10,
        paddingTop: 10,
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#4CAF50',
    },
    valueAvailable: {
        color: '#4CAF50',
    },
    valueInTransit: {
        color: '#FFA500', 
        fontWeight: 'bold',
    },
    commissionValueContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    commissionLabel: {
        fontSize: 16,
        color: '#FF4500',
    },
    commissionValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF4500',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saldoCard: {
        backgroundColor: '#E8F5E9',
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
        borderLeftWidth: 5,
        borderLeftColor: '#4CAF50',
    },
    saldoCardLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
    },
    saldoCardValue: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginVertical: 5,
    },
    saldoCardNextTransfer: {
        fontSize: 14,
        color: '#2E7D32',
    },
    buttonSmall: {
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default Financeiro;