import React, { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, ScrollView } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import { updateUserData, getUserData } from "@/services/userService"
import * as ImagePicker from 'expo-image-picker'
import storage from '@react-native-firebase/storage'

interface PerfilScreenProps extends AppStackScreenProps<"Perfil"> {}

export const PerfilScreen: React.FC<PerfilScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { userData, setUserData } = useAuth()
  
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || "")
  const [descricao, setDescricao] = useState(userData?.descricao || "")
  const [bloqueioApps, setBloqueioApps] = useState(userData?.configuracoes?.bloqueio_apps || false)
  const [limiteTelaMinutos, setLimiteTelaMinutos] = useState(String(userData?.configuracoes?.limite_tela_minutos || 180))
  const [notificacoes, setNotificacoes] = useState(userData?.configuracoes?.notificacoes ?? true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (userData) {
      setPhotoURL(userData.photoURL || "")
      setDescricao(userData.descricao || "")
      setBloqueioApps(userData.configuracoes?.bloqueio_apps || false)
      setLimiteTelaMinutos(String(userData.configuracoes?.limite_tela_minutos || 180))
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
        mediaTypes: ['images'],
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
    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado")
      return
    }

    try {
      setIsSaving(true)
      
      let newPhotoURL = photoURL

      // Se tiver uma nova imagem selecionada, faz upload
      if (selectedImage) {
        const uploadedURL = await uploadImage(selectedImage)
        if (uploadedURL) {
          newPhotoURL = uploadedURL
        } else {
          Alert.alert("Aviso", "Não foi possível fazer upload da imagem. As outras alterações serão salvas.")
        }
      }

      // Valida o limite de tela
      const limiteMinutos = parseInt(limiteTelaMinutos, 10)
      if (isNaN(limiteMinutos) || limiteMinutos < 0) {
        Alert.alert("Erro", "O limite de tela deve ser um número válido")
        return
      }

      // Atualiza os dados no Firestore
      const success = await updateUserData(userData.uid, {
        photoURL: newPhotoURL,
        descricao: descricao.trim(),
        configuracoes: {
          bloqueio_apps: bloqueioApps,
          limite_tela_minutos: limiteMinutos,
          notificacoes: notificacoes,
        },
      })

      if (success) {
        // Atualiza os dados locais
        const updatedUserData = await getUserData(userData.uid)
        if (updatedUserData) {
          setUserData(updatedUserData)
        }

        Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ])
        setSelectedImage(null)
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

  const displayImage = selectedImage || photoURL || undefined

  return (
    <Screen preset="auto" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            Editar Perfil
          </Text>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              onPress={pickImage}
              style={styles.avatarTouchable}
              disabled={isUploading || isSaving}
            >
              <View style={styles.avatar}>
                {displayImage ? (
                  <Image 
                    source={{ uri: displayImage }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.placeholderAvatar}>
                    <Text style={styles.placeholderText}>
                      {userData?.nome?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.cameraIcon}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cameraEmoji}>📷</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHint}>
              Toque para alterar a foto
            </Text>
          </View>

          {/* Informações básicas */}
          <View style={styles.infoCard}>
            {/* Nome */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nome</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>{userData?.nome}</Text>
              </View>
              <Text style={styles.hint}>
                O nome não pode ser alterado
              </Text>
            </View>

            {/* Email */}
            <View style={[styles.fieldContainer, { marginBottom: 0 }]}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>{userData?.email}</Text>
              </View>
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.infoCard}>
            <View style={[styles.fieldContainer, { marginBottom: 0 }]}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.textArea}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                maxLength={200}
                editable={!isSaving}
              />
              <Text style={styles.charCount}>
                {descricao.length}/200 caracteres
              </Text>
            </View>
          </View>

          {/* Configurações */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Configurações</Text>

            {/* Bloqueio de Apps */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.label}>Bloqueio de apps</Text>
                <Text style={styles.toggleHint}>
                  Bloquear acesso a apps específicos
                </Text>
              </View>
              <Switch
                value={bloqueioApps}
                onValueChange={setBloqueioApps}
                editable={!isSaving}
              />
            </View>

            {/* Limite de Tela */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Limite de tela (minutos/dia)</Text>
              <TextInput
                style={styles.input}
                value={limiteTelaMinutos}
                onChangeText={setLimiteTelaMinutos}
                placeholder="180"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                editable={!isSaving}
              />
              <Text style={styles.hint}>
                {Math.floor(parseInt(limiteTelaMinutos || "0") / 60)}h {parseInt(limiteTelaMinutos || "0") % 60}min por dia
              </Text>
            </View>

            {/* Notificações */}
            <View style={[styles.toggleContainer, { marginBottom: 0 }]}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.label}>Notificações</Text>
                <Text style={styles.toggleHint}>
                  Receber alertas e lembretes
                </Text>
              </View>
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                editable={!isSaving}
              />
            </View>
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <Button
              text={isSaving ? "Salvando..." : "Salvar Alterações"}
              onPress={handleSave}
              style={styles.button}
              disabled={isSaving || isUploading}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  content: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 32,
    alignSelf: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#E0E7FF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  placeholderAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#6881BA",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#322D70",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cameraEmoji: {
    fontSize: 20,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#6881BA",
  },
  infoCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 16,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322D70",
    marginBottom: 8,
  },
  inputDisabled: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputDisabledText: {
    fontSize: 15,
    color: "#64748B",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#312E81",
    fontSize: 15,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#312E81",
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 15,
  },
  hint: {
    fontSize: 12,
    color: "#6881BA",
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    color: "#6881BA",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleHint: {
    fontSize: 12,
    color: "#6881BA",
    marginTop: 4,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
  configLink: {
    paddingVertical: 12,
    alignItems: "center",
  },
  configLinkText: {
    fontSize: 15,
    color: "#6881BA",
    fontWeight: "600",
  },
})
