import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { updateUserData, getUserData } from "@/services/userService"
import type { LimiteConfig } from "@/services/userService"
import statisticsService from "@/services/statisticsService"
import screenTimeService from "@/services/screenTime"
import * as ImagePicker from "expo-image-picker"
import storage from "@react-native-firebase/storage"
import auth from "@react-native-firebase/auth"
import { SvgProps } from "react-native-svg"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdicionarIcon: React.FC<SvgProps> = require("@assets/icons/adicionar.svg").default

interface PerfilScreenProps extends AppStackScreenProps<"Perfil"> {}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({ navigation }) => {
  const { userData, setUserData, logout } = useAuth()

  const [photoURL, setPhotoURL] = useState(userData?.photoURL || "")
  const [dataNascimento, setDataNascimento] = useState(userData?.dataNascimento || "")
  const [descricao, setDescricao] = useState(userData?.descricao || "")
  const [limiteTelaAtivo, setLimiteTelaAtivo] = useState(
    userData?.configuracoes?.limite_tela_ativo || false,
  )
  const [limiteTelaMinutos, setLimiteTelaMinutos] = useState(
    userData?.configuracoes?.limite_tela_minutos || 60,
  )
  const [limiteAppsAtivo, setLimiteAppsAtivo] = useState(
    userData?.configuracoes?.bloqueio_apps || false,
  )
  const [notificacoes, setNotificacoes] = useState(
    userData?.configuracoes?.notificacoes ?? true,
  )
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (userData) {
      setPhotoURL(userData.photoURL || "")
      setDataNascimento(userData.dataNascimento || "")
      setDescricao(userData.descricao || "")
      setLimiteTelaAtivo(userData.configuracoes?.limite_tela_ativo || false)
      setLimiteTelaMinutos(userData.configuracoes?.limite_tela_minutos || 60)
      setLimiteAppsAtivo(userData.configuracoes?.bloqueio_apps || false)
      setNotificacoes(userData.configuracoes?.notificacoes ?? true)
    }
  }, [userData])

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permissionResult.granted) {
        Alert.alert("Permissão negada", "Você precisa permitir o acesso à galeria")
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error)
      Alert.alert("Erro", "Não foi possível selecionar a imagem")
    }
  }

  const removePhoto = () => {
    Alert.alert("Remover foto", "Deseja remover sua foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => {
          setSelectedImage(null)
          setPhotoURL("")
        },
      },
    ])
  }

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setIsUploading(true)
      const filename = `profile/${userData?.uid}/${Date.now()}.jpg`
      const storageRef = storage().ref(filename)
      await storageRef.putFile(uri)
      const downloadURL = await storageRef.getDownloadURL()
      return downloadURL
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      Alert.alert("Erro", "Não foi possível fazer upload da imagem")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!userData) return
    try {
      setIsSaving(true)
      let newPhotoURL = photoURL
      if (selectedImage) {
        const uploadedURL = await uploadImage(selectedImage)
        if (uploadedURL) {
          newPhotoURL = uploadedURL
        } else {
          Alert.alert("Aviso", "Não foi possível fazer upload da imagem. As outras alterações serão salvas.")
        }
      }
      const success = await updateUserData(userData.uid, {
        photoURL: newPhotoURL,
        dataNascimento: dataNascimento.trim(),
        descricao: descricao.trim(),
        configuracoes: {
          ...userData.configuracoes,
          bloqueio_apps: limiteAppsAtivo,
          limite_tela_ativo: limiteTelaAtivo,
          limite_tela_minutos: limiteTelaMinutos,
          notificacoes,
        },
      })
      if (success) {
        // Sincroniza configuração de bloqueio no lado nativo
        const limites = userData.configuracoes?.limitesDeApps ?? []
        if (limiteAppsAtivo && limites.length > 0) {
          const appConfigs: Record<string, { limitMinutes: number; activeDays: string[] }> = {}
          for (const config of limites) {
            for (const pkg of config.appsComLimite) {
              if (!appConfigs[pkg] || config.limiteMinutos < appConfigs[pkg].limitMinutes) {
                appConfigs[pkg] = {
                  limitMinutes: config.limiteMinutos,
                  activeDays: Array.from(config.diasAtivos),
                }
              }
            }
          }
          await screenTimeService.configureAppBlocking(appConfigs, true)
        } else if (!limiteAppsAtivo) {
          await screenTimeService.configureAppBlocking({}, false)
        }

        const updatedUserData = await getUserData(userData.uid)
        if (updatedUserData) setUserData(updatedUserData)
        setSelectedImage(null)
        Alert.alert("Sucesso", "Perfil atualizado com sucesso!")
      } else {
        Alert.alert("Erro", "Não foi possível atualizar o perfil. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      Alert.alert("Erro", "Ocorreu um erro ao salvar as alterações")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = () => {
    const email = userData?.email
    if (!email) return
    Alert.alert("Resetar senha", "Enviaremos um email para recuperação de senha.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Enviar",
        onPress: async () => {
          try {
            await auth().sendPasswordResetEmail(email)
            Alert.alert("Email enviado", "Verifique sua caixa de entrada.")
          } catch (error) {
            console.error("Erro ao enviar email:", error)
            Alert.alert("Erro", "Não foi possível enviar o email de recuperação.")
          }
        },
      },
    ])
  }

  const handleDeleteStatistics = async () => {
    if (!userData) return
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja apagar TODAS as suas estatísticas? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar Tudo",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSaving(true)
              const deletedCount = await statisticsService.deleteAllUserStatistics(userData.uid)
              if (deletedCount === 0) {
                Alert.alert("Aviso", "Você não possui estatísticas para apagar.")
              } else if (deletedCount > 0) {
                Alert.alert(
                  "Sucesso",
                  `${deletedCount} ${deletedCount === 1 ? "estatística foi apagada" : "estatísticas foram apagadas"} com sucesso.`,
                )
              } else {
                Alert.alert("Erro", "Não foi possível apagar as estatísticas. Tente novamente.")
              }
            } catch (error) {
              console.error("Erro ao apagar estatísticas:", error)
              Alert.alert("Erro", "Ocorreu um erro ao apagar as estatísticas")
            } finally {
              setIsSaving(false)
            }
          },
        },
      ],
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Apagar conta",
      "Tem certeza? Esta ação é irreversível e todos os seus dados serão perdidos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: () => {} },
      ],
    )
  }

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout()
          navigation.reset({ index: 0, routes: [{ name: "BemVindo" }] })
        },
      },
    ])
  }

  const limitesDeApps: LimiteConfig[] = userData?.configuracoes?.limitesDeApps ?? []

  const handleEditLimite = (config: LimiteConfig) => {
    navigation.navigate("SelecionarAppsLimite" as any, {
      initialApps: config.appsComLimite,
      initialSites: config.sitesComLimite,
      editingConfig: config,
    })
  }

  const handleAddLimite = () => {
    navigation.navigate("SelecionarAppsLimite" as any, {})
  }

  const decreaseLimite = () =>
    setLimiteTelaMinutos((prev) => (prev <= 30 ? Math.max(2, prev - 2) : prev - 30))
  const increaseLimite = () =>
    setLimiteTelaMinutos((prev) => (prev < 30 ? Math.min(30, prev + 2) : Math.min(1440, prev + 30)))

  const formatMinutes = (min: number) => {
    const hours = Math.floor(min / 60)
    const mins = min % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const displayImage = selectedImage || photoURL || undefined

  return (
    <Screen preset="auto" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Configurações</Text>
        </View>

        {/* Foto de perfil */}
        <View style={styles.photoSection}>
          <View style={styles.avatarWrapper}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {userData?.nome?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.alterarFotoButton}
            onPress={pickImage}
            disabled={isUploading || isSaving}
          >
            <Text style={styles.alterarFotoText}>Alterar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={removePhoto} disabled={isUploading || isSaving}>
            <Text style={styles.removerFotoText}>Remover foto</Text>
          </TouchableOpacity>
        </View>

        {/* Dados básicos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados básicos</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nome</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{userData?.nome}</Text>
            </View>
          </View>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              value={dataNascimento}
              onChangeText={setDataNascimento}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#94A3B8"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              editable={!isSaving}
            />
          </View>

          <View style={[styles.field, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{userData?.email}</Text>
            </View>
            <Text style={styles.fieldHint}>o email não pode ser alterado</Text>
          </View>
        </View>

        {/* Sobre você */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre você</Text>
          <TextInput
            style={styles.textArea}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descrição"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={200}
            editable={!isSaving}
          />
        </View>

        {/* Limite de uso */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Limite de uso</Text>

          {/* Limite de tela diário */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelBox}>
              <Text style={styles.toggleLabel}>Limite de tela diário</Text>
            </View>
            <Switch value={limiteTelaAtivo} onValueChange={setLimiteTelaAtivo} editable={!isSaving} />
          </View>

          {/* Tempo permitido */}
          <View style={styles.tempoRow}>
            <View style={styles.tempoLabelBox}>
              <Text style={styles.toggleLabel}>Tempo permitido</Text>
              <Text style={styles.tempoHint}>
                Esse tempo é para toda a tela, para cada app configure abaixo
              </Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={decreaseLimite} style={styles.stepperBtn}>
                <Text style={styles.stepperBtnText}>{"<"}</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{formatMinutes(limiteTelaMinutos)}</Text>
              <TouchableOpacity onPress={increaseLimite} style={styles.stepperBtn}>
                <Text style={styles.stepperBtnText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Limite de uso de apps */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Limite de uso de apps</Text>
            <Switch value={limiteAppsAtivo} onValueChange={setLimiteAppsAtivo} editable={!isSaving} />
          </View>

          {/* Lista de limites configurados */}
          {limitesDeApps.map((config, index) => (
            <TouchableOpacity
              key={`${config.nome}-${index}`}
              style={styles.appLimitRow}
              onPress={() => handleEditLimite(config)}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <View style={styles.appLimitIconWrapper}>
                <Text style={styles.appLimitEmoji}>{config.emoji || "📱"}</Text>
              </View>
              <Text style={styles.appLimitName}>
                {config.nome || "Sem nome"}
                <Text style={styles.appLimitCount}>
                  {"  "}
                  {config.appsComLimite.length > 0 && `${config.appsComLimite.length} app${config.appsComLimite.length > 1 ? "s" : ""}`}
                  {config.appsComLimite.length > 0 && config.sitesComLimite.length > 0 && " · "}
                  {config.sitesComLimite.length > 0 && `${config.sitesComLimite.length} site${config.sitesComLimite.length > 1 ? "s" : ""}`}
                </Text>
              </Text>
              <Text style={styles.appLimitChevron}>{"›"}</Text>
            </TouchableOpacity>
          ))}

          {/* Adicionar novo limite */}
          <TouchableOpacity
            style={styles.addLimitRow}
            onPress={handleAddLimite}
            disabled={isSaving}
          >
            <AdicionarIcon width={20} height={20} />
            <Text style={styles.addLimitText}>Adicionar limite de app</Text>
          </TouchableOpacity>
        </View>

        {/* Notificações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notificações</Text>
          <View style={[styles.toggleRow, { marginBottom: 0 }]}>
            <Text style={styles.toggleLabel}>Permitir notificações</Text>
            <Switch value={notificacoes} onValueChange={setNotificacoes} editable={!isSaving} />
          </View>
        </View>

        {/* Outras opções */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outras opções</Text>

          <Button
            text="Resetar senha"
            onPress={handleResetPassword}
            style={styles.outlinedBtn}
            textStyle={styles.outlinedBtnText}
            disabled={isSaving}
          />

          <Button
            text="Sair da conta"
            onPress={handleLogout}
            style={styles.outlinedBtn}
            textStyle={styles.outlinedBtnText}
            disabled={isSaving}
          />

          <TouchableOpacity style={styles.deleteAccountLink} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Apagar conta</Text>
          </TouchableOpacity>
        </View>

        {/* Apagar estatísticas */}
        <Button
          text="Apagar Todas as Estatísticas"
          onPress={handleDeleteStatistics}
          style={styles.dangerButton}
          textStyle={styles.dangerButtonText}
          disabled={isSaving || isUploading}
        />

        {/* Salvar */}
        <Button
          text={isSaving ? "Salvando..." : "Salvar Alterações"}
          onPress={handleSave}
          style={styles.saveButton}
          disabled={isSaving || isUploading}
        />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#322D70",
  },
  // Photo
  photoSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#E0E7FF",
    marginBottom: 12,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#6881BA",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  alterarFotoButton: {
    backgroundColor: "#5B7BF0",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 6,
  },
  alterarFotoText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  removerFotoText: {
    color: "#888",
    fontSize: 13,
  },
  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#322D70",
    marginBottom: 14,
  },
  // Fields
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#322D70",
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  inputDisabled: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputDisabledText: {
    fontSize: 14,
    color: "#64748B",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    color: "#312E81",
    fontSize: 14,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    color: "#312E81",
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 14,
  },
  // Toggles
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  toggleLabelBox: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322D70",
  },
  // Tempo permitido
  tempoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  tempoLabelBox: {
    flex: 1,
    marginRight: 12,
  },
  tempoHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    lineHeight: 15,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperBtnText: {
    fontSize: 16,
    color: "#322D70",
    fontWeight: "600",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#322D70",
    minWidth: 40,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 14,
  },
  // App limits
  appLimitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  appLimitIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  appLimitEmoji: {
    fontSize: 16,
  },
  appLimitName: {
    flex: 1,
    fontSize: 14,
    color: "#322D70",
    fontWeight: "500",
  },
  appLimitCount: {
    fontSize: 12,
    color: "#6881BA",
    fontWeight: "400",
  },
  appLimitAction: {
    padding: 4,
  },
  appLimitChevron: {
    fontSize: 22,
    color: "#94A3B8",
    marginLeft: 4,
  },
  addLimitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  addLimitText: {
    fontSize: 14,
    color: "#6881BA",
    fontWeight: "500",
  },
  // Outras opções buttons
  outlinedBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginBottom: 10,
  },
  outlinedBtnText: {
    color: "#374151",
  },
  deleteAccountLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  deleteAccountText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  // Danger / Save
  dangerButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 12,
  },
  dangerButtonText: {
    color: "#DC2626",
  },
  saveButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
  },
})
