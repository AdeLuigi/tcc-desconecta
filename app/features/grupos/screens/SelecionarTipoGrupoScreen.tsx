import React, { useState } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
const Logo = require("@assets/images/logo2.png")

type GroupTypeOption = "desafioTempo" | "comunidade"

interface SelecionarTipoGrupoScreenProps extends AppStackScreenProps<"SelecionarTipoGrupo"> {}

export const SelecionarTipoGrupoScreen: React.FC<SelecionarTipoGrupoScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<GroupTypeOption>("desafioTempo")

  const handleNext = () => {
    navigation.navigate("CriarNovoGrupo", { tipoGrupo: selectedType })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
    <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
        <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleCard}>
          <Icon icon="poepleGroupIcon" size={24} color="#322D70" />
          <Text style={styles.pageTitle}>Criar novo grupo</Text>
        </View>

        <Text style={styles.subtitle}>Escolha o tipo de grupo que deseja criar</Text>

        <TouchableOpacity
          style={[styles.optionCard, selectedType === "desafioTempo" && styles.optionCardSelected]}
          onPress={() => setSelectedType("desafioTempo")}
          activeOpacity={0.85}
        >
          <View style={styles.optionHeaderRow}>
            <Icon icon="desafioDeTempo" size={18} color="#6881BA" />
          </View>
         <View style={{marginRight: 8,marginLeft:8, }}>
          <Text style={styles.optionTitle}>Desafio de tempo</Text>
           <Text style={styles.optionDescription}>
            Uma competicao unica com data de inicio e termino. Os membros participam e competem
            dentro do prazo especificado para alcancar o topo do ranking.
          </Text>
         </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, selectedType === "comunidade" && styles.optionCardSelected]}
          onPress={() => setSelectedType("comunidade")}
          activeOpacity={0.85}
        >
          <View style={styles.optionHeaderRow}>
            <Icon icon="comunidade" size={18} color="#6881BA" />
           
          </View>
           <View style={{marginRight: 8,marginLeft:8, }}>
             <Text style={styles.optionTitle}>Comunidade</Text>
            <Text style={styles.optionDescription}>
              E uma comunidade continua para promover responsabilidade e um tempo de tela saudavel no
              dia a dia. As classificacoes sao rastreadas semanalmente, mensalmente e anualmente.
          </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Proximo</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7E7E7",
  },
  header: {
    height: 56,
    backgroundColor: "#322D70",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 20,
    letterSpacing: 1,
    fontWeight: "700",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  titleCard: {
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 12,
    color: "#322D70",
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    color: "#322D70",
    fontSize: 16,
    marginVertical: 20,
    fontWeight: "800",
  },
  optionCard: {
    backgroundColor: "#F4F4F4",
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    padding: 16,
    marginBottom: 14,
  },
    pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  optionCardSelected: {
    borderColor: "#6881BA",
    borderWidth: 2,
  },
  optionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#322D70",
  },
  optionDescription: {
    fontSize: 16,
    color: "#6881BA",
    fontWeight: "500",
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#E7E7E7",
  },
  cancelButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#DD7075",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
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
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
})
