import React from "react"
import {
  Image,
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
import { SvgProps } from "react-native-svg"

import { useAppTheme } from "@/theme/context"

export type IconTypes = keyof typeof iconRegistry

type SvgComponent = React.FC<SvgProps>

function isSvgComponent(source: unknown): source is SvgComponent {
  return typeof source === "function"
}

type BaseIconProps = {
  /**
   * The name of the icon
   */
  icon: IconTypes

  /**
   * An optional tint color for the icon
   */
  color?: string

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number

  /**
   * Style overrides for the icon image
   */
  style?: StyleProp<ImageStyle>

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>
}

type PressableIconProps = Omit<TouchableOpacityProps, "style"> & BaseIconProps
type IconProps = Omit<ViewProps, "style"> & BaseIconProps

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity />
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {PressableIconProps} props - The props for the `PressableIcon` component.
 * @returns {JSX.Element} The rendered `PressableIcon` component.
 */
export function PressableIcon(props: PressableIconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...pressableProps
  } = props

  const { theme } = useAppTheme()
  const source = iconRegistry[icon]

  const $imageStyle: StyleProp<ImageStyle> = [
    $imageStyleBase,
    { tintColor: color ?? theme.colors.text },
    size !== undefined && { width: size, height: size },
    $imageStyleOverride,
  ]

  return (
    <TouchableOpacity {...pressableProps} style={$containerStyleOverride}>
      {isSvgComponent(source) ? (
        React.createElement(source, {
          width: size,
          height: size,
          color: color ?? theme.colors.text,
        })
      ) : (
        <Image style={$imageStyle} source={source} />
      )}
    </TouchableOpacity>
  )
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <View />, use `PressableIcon` if you want to react to input
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...viewProps
  } = props

  const { theme } = useAppTheme()
  const source = iconRegistry[icon]

  const $imageStyle: StyleProp<ImageStyle> = [
    $imageStyleBase,
    { tintColor: color ?? theme.colors.text },
    size !== undefined && { width: size, height: size },
    $imageStyleOverride,
  ]

  return (
    <View {...viewProps} style={$containerStyleOverride}>
      {isSvgComponent(source) ? (
        React.createElement(source, {
          width: size,
          height: size,
          color: color ?? theme.colors.text,
        })
      ) : (
        <Image style={$imageStyle} source={source} />
      )}
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PeopleGroupIcon: SvgComponent = require("@assets/icons/poeple-group-icon.svg").default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NotificationsIcon: SvgComponent = require("@assets/icons/notifications.svg").default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SearchIcon: SvgComponent = require("@assets/icons/search.svg").default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EditarIcon: SvgComponent = require("@assets/icons/editar.svg").default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdicionarIcon: SvgComponent = require("@assets/icons/adicionar.svg").default

export const iconRegistry = {
  editar: EditarIcon,
  adicionar: AdicionarIcon,
  back: require("@assets/icons/back.png"),
  swords: require("@assets/icons/swords.png"),
  bell: require("@assets/icons/bell.png"),
  vector: require("@assets/icons/vector.png"),
  chevron: require("@assets/icons/chevron.png"),
  search: SearchIcon,
  win: require("@assets/icons/win.png"),
  winSVG: require("@assets/icons/win.svg").default,
  desafioDeTempo: require("@assets/icons/desafio-de-tempo.svg").default,
  comunidade: require("@assets/icons/comunidade.svg").default,
  uploadIcone: require("@assets/icons/uploadIcone.svg").default,
  poepleGroupIcon: PeopleGroupIcon,
  notifications: NotificationsIcon,
  copy: require("@assets/icons/copy.png"),
  participantes: require("@assets/icons/participantes.svg").default,
  shareSvg: require("@assets/icons/share.svg").default,
  copySvg: require("@assets/icons/copy.svg").default,
  share: require("@assets/icons/share.png"),
  caretLeft: require("@assets/icons/caretLeft.png"),
  caretRight: require("@assets/icons/caretRight.png"),
  check: require("@assets/icons/check.png"),
  clap: require("@assets/icons/demo/clap.png"),
  community: require("@assets/icons/demo/community.png"),
  components: require("@assets/icons/demo/components.png"),
  debug: require("@assets/icons/demo/debug.png"),
  github: require("@assets/icons/demo/github.png"),
  heart: require("@assets/icons/demo/heart.png"),
  hidden: require("@assets/icons/hidden.png"),
  ladybug: require("@assets/icons/ladybug.png"),
  lock: require("@assets/icons/lock.png"),
  menu: require("@assets/icons/menu.png"),
  more: require("@assets/icons/more.png"),
  pin: require("@assets/icons/demo/pin.png"),
  podcast: require("@assets/icons/demo/podcast.png"),
  settings: require("@assets/icons/settings.png"),
  slack: require("@assets/icons/demo/slack.png"),
  view: require("@assets/icons/view.png"),
  x: require("@assets/icons/x.png"),
}

const $imageStyleBase: ImageStyle = {
  resizeMode: "contain",
}
