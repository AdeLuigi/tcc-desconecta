import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { createGroup, type GroupType } from "@/services/groupService"
import storage from "@react-native-firebase/storage"
import { Ionicons } from "@expo/vector-icons"

const Logo = require("@assets/images/logo2.png")

export type CriterioRanking =
  | "menorTempoTotal"
  | "menorTempoAppsEspecificos"
  | "atividadesOffline"

const CRITERIO_TO_GROUP_TYPE: Record<CriterioRanking, GroupType> = {
  menorTempoTotal: "screenTime",
  menorTempoAppsEspecificos: "screenTimeForApps",
  atividadesOffline: "checkin",
}

const CRITERIOS: { value: CriterioRanking; label: string }[] = [
  { value: "menorTempoTotal", label: "Menor tempo de tela total" },
  { value: "menorTempoAppsEspecificos", label: "Menor tempo em apps específicos" },
  { value: "atividadesOffline", label: "Atividades offline postadas" },
]

interface SelecionarCriterioGrupoScreenProps
  extends AppStackScreenProps<"SelecionarCriterioGrupo"> {}

export const SelecionarCriterioGrupoScreen: React.FC<
  SelecionarCriterioGrupoScreenProps
> = ({ navigation, route }) => {
  const { userData } = useAuth()
  const { tipoGrupo, groupName, groupDescription, selectedImageUri, dataLimite } =
    route.params

  const [criterio, setCriterio] = useState<CriterioRanking>("menorTempoTotal")
  const [isCreating, setIsCreating] = useState(false)

  const isDesafio = tipoGrupo === "desafioTempo"
  const pageTitle = isDesafio ? "Criar desafio de grupo" : "Criar comunidade"

  const uploadGroupImage = async (uri: string): Promise<string | null> => {
    try {
      const filename = `groups/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const reference = storage().ref(filename)
      await reference.putFile(uri)
      return await reference.getDownloadURL()
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      return null
    }
  }

  const handleCreate = async () => {
    // If "menorTempoAppsEspecificos" is selected, navigate to the app/site selection screen
    if (criterio === "menorTempoAppsEspecificos") {
      navigation.navigate("SelecionarAppsDesafio", {
        tipoGrupo,
        groupName,
        groupDescription,
        selectedImageUri,
        dataLimite,
      })
      return
    }

    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado para criar um grupo")
      return
    }

    setIsCreating(true)
    try {
      let photoURL = ""
      if (selectedImageUri) {
        const uploaded = await uploadGroupImage(selectedImageUri)
        if (uploaded) {
          photoURL = uploaded
        } else {
          Alert.alert("Aviso", "Não foi possível fazer upload da imagem. O grupo será criado sem foto.")
        }
      }

      const groupId = await createGroup(
        groupName,
        groupDescription,
        photoURL,
        userData.uid,
        dataLimite,
        criterio,
        CRITERIO_TO_GROUP_TYPE[criterio],
      )

      if (groupId) {
        Alert.alert("Sucesso!", "Grupo criado com sucesso!", [
          { text: "OK", onPress: () => navigation.navigate("HomeDinamica") },
        ])
      } else {
        Alert.alert("Erro", "Não foi possível criar o grupo")
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
      Alert.alert("Erro", "Ocorreu um erro ao criar o grupo")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
          <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title card — mesmos estilos de CriarNovoGrupoScreen */}
        <View style={styles.titleCard}>
          <Icon icon="poepleGroupIcon" size={24} color="#322D70" />
          <Text style={styles.pageTitle}>{pageTitle}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Escolha o critério de rankeamento do grupo</Text>

          {CRITERIOS.map((item) => {
            const selected = criterio === item.value
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setCriterio(item.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Botões fixos no rodapé */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, isCreating && styles.nextButtonDisabled]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>
              {criterio === "menorTempoAppsEspecificos" ? "Próximo" : "Criar"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#322D70",
  },
  scrollContent: {
    flex: 1,
  },
  titleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    marginRight: 16,
    marginTop: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    textAlign: "center",
    color: "#322D70",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionCardSelected: {
    borderColor: "#6881BA",
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#6881BA",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6881BA",
  },
  optionLabel: {
    fontSize: 15,
    color: "#475569",
    fontWeight: "500",
    flex: 1,
  },
  optionLabelSelected: {
    color: "#322D70",
    fontWeight: "700",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  backButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  nextButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#7BC1DC",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})
