/*
 * Copyright ©️ 2024 Sebastian Delmont <sd@ham2k.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable no-shadow */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { TextInput } from 'react-native-paper'
import { TextInput as NativeTextInput, Platform } from 'react-native'
import { useThemedStyles } from '../../styles/tools/useThemedStyles'

const LEFT_TRIM_REGEX = /^\s+/
const SPACES_REGEX = /\s/g
const ONLY_SPACES_REGEX = /^\s+$/g
const NOT_NUMBER_WITH_SIGNS_REGEX = /[^0-9+-]/g
const NOT_NUMBER_WITH_SIGNS_AND_PERIODS_REGEX = /[^0-9+-,.]/g
const SIGN_AFTER_A_DIGIT_REGEX = /([\d,.])[+-]/g

export default function ThemedTextInput (props) {
  const {
    style, themeColor, textStyle,
    label, placeholder, value, error,
    onChangeText, onChange, onSubmitEditing, onSpace, onFocus, onBlur,
    innerRef, focusedRef,
    fieldId,
    multiline,
    uppercase, trim, noSpaces, periodToSlash, numeric, decimal, rst,
    keyboard
  } = props
  const themeStyles = useThemedStyles()
  const [originalValue, setOriginalValue] = useState(value)

  const alternateInnerRef = useRef()
  const actualInnerRef = innerRef ?? alternateInnerRef

  useEffect(() => {
    setOriginalValue(`${value}`)
  }, [value])

  const handleChange = useCallback((event) => {
    let { text } = event.nativeEvent
    let spaceAdded = false

    if (multiline) {
      // We cannot do any transformations on multiline inputs
    } else {
      // Lets check if what changed was the addition of a space
      if ((text !== originalValue) && (text.replace(SPACES_REGEX, '') === originalValue)) {
        spaceAdded = true
      } else if (text.match(ONLY_SPACES_REGEX) && originalValue !== '') { // or a space replacing the entire value
        spaceAdded = true
        text = originalValue
      }

      text = text.replace(LEFT_TRIM_REGEX, '')

      if (uppercase) {
        text = text.toUpperCase()
      }
      if (trim) {
        text = text.trim()
      }
      if (noSpaces) {
        text = text.replace(SPACES_REGEX, '')
      }
      if (periodToSlash) {
        text = text.replaceAll('.', '/')
      }
      if (numeric) {
        text = text.replace(NOT_NUMBER_WITH_SIGNS_REGEX, '').replace(SIGN_AFTER_A_DIGIT_REGEX, '$1')
      }
      if (decimal) {
        text = text.replace(NOT_NUMBER_WITH_SIGNS_AND_PERIODS_REGEX, '').replace(SIGN_AFTER_A_DIGIT_REGEX, '$1')
      }
      if (rst) {
        text = text.replace(NOT_NUMBER_WITH_SIGNS_REGEX, '')
      }
      event.nativeEvent.text = text

      actualInnerRef.current.setNativeProps({ text })
    }

    onChangeText && onChangeText(text)
    onChange && onChange({ ...event, fieldId, ref: actualInnerRef })
    if (spaceAdded) {
      onSpace && onSpace({ nativeEvent: { key: ' ', target: event?.nativeEvent?.target } })
    }
  }, [
    originalValue,
    fieldId, actualInnerRef,
    multiline, uppercase, noSpaces, periodToSlash, numeric, decimal, trim, rst,
    onChangeText, onChange, onSpace
  ])

  const [currentSelection, setCurrentSelection] = useState({})
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (focusedRef && isFocused && !multiline) {
      focusedRef.current = {
        onNumberKey: (number) => {
          if (!isFocused) return

          let { start, end } = currentSelection

          if (!start && !end) {
            // If selection position is unknown, we assume the cursor is at the end of the string
            start = originalValue.length
            end = originalValue.length
          }

          const newValue = originalValue.substring(0, start) + number + originalValue.substring(end)

          handleChange && handleChange({ nativeEvent: { text: newValue, target: actualInnerRef.current._nativeTag } })

          if (originalValue.length === start && originalValue.length === end) {
            // Cursor was at the end of the original value
            // Since the handleChange method might modify the value, and does not cause
            // a call to onSelectionChange, we need to mark the current selection state as 'unknown'
            setCurrentSelection({})
          } else {
            setCurrentSelection({ start: start + 1, end: end + 1 })
          }
        }
      }
    }
  }, [currentSelection, fieldId, focusedRef, handleChange, isFocused, originalValue, actualInnerRef, multiline])

  const handleSelectionChange = useCallback((event) => {
    const { nativeEvent: { selection: { start, end } } } = event

    setCurrentSelection({ start, end })
  }, [])

  const handleFocus = useCallback((event) => {
    setIsFocused(true)
    onFocus && onFocus({ ...event, ref: actualInnerRef })
  }, [onFocus, actualInnerRef])

  const handleBlur = useCallback((event) => {
    setIsFocused(false)
    onBlur && onBlur({ ...event, ref: actualInnerRef.current })
  }, [onBlur, actualInnerRef])

  const colorStyles = useMemo(() => {
    return {
      paperInput: {
        color: themeColor ? themeStyles.theme.colors[themeColor] : themeStyles.theme.colors.onBackground,
        backgroundColor: themeStyles.theme.colors.background
      },
      nativeInput: {
        color: themeColor ? themeStyles.theme.colors[themeColor] : themeStyles.theme.colors.onBackground
      },
      selectionColor: themeColor ? themeStyles.theme.colors[`${themeColor}Light`] : themeStyles.theme.colors.primaryLight,
      cursorColor: themeColor ? themeStyles.theme.colors[`${themeColor}`] : themeStyles.theme.colors.primary
    }
  }, [themeStyles, themeColor])

  const keyboardOptions = useMemo(() => {
    const dumbDownKeyboardProps = {
      autoCapitalize: uppercase ? 'characters' : 'none',
      autoComplete: 'off',
      autoCorrect: false,
      disableFullScreenUI: false,
      enterKeyHint: 'send',
      importantForAutofill: 'no',
      inputMode: undefined,
      spellCheck: false,
      textContentType: 'none',

      // Try to match the keyboard appearance to the theme, but not on iPad because there seems to be a bug there.
      keyboardAppearance: (themeStyles.isDarkMode && Platform.OS === 'ios' && !Platform.isPad) ? 'dark' : 'light'

      // On Android, "visible-password" would enable numbers in the keyboard, and disable autofill
      // but it has serious lag issues https://github.com/facebook/react-native/issues/35735
      // keyboardType: 'visible-password',
      // secureTextEntry: Platform.OS === 'android'
      // textContentType: Platform.OS === 'android' ? 'password' : 'none',
    }

    if (keyboard === 'dumb') {
      return dumbDownKeyboardProps
    } else if (keyboard === 'numbers') {
      return {
        ...dumbDownKeyboardProps,
        keyboardType: 'numbers-and-punctuation'
      }
    } else {
      return {
        keyboardAppearance: (themeStyles.isDarkMode && Platform.OS === 'ios' && !Platform.isPad) ? 'dark' : 'light'
      }
    }
  }, [keyboard, themeStyles.isDarkMode, uppercase])

  const renderInput = useCallback((props) => {
    return (
      <NativeTextInput
        {...keyboardOptions}

        {...props}

        ref={actualInnerRef}

        value={value || ''}
        placeholder={placeholder || ''}
        style={[
          colorStyles.nativeInput,
          props.style,
          {
            fontFamily: themeStyles.fontFamily
            // fontSize: themeStyles.normalFontSize * 4,
            // lineHeight: themeStyles.normalFontSize * 5
          },
          textStyle
        ]}
        allowFontScaling={false}
        placeholderTextColor={themeStyles.theme.colors.onBackgroundLighter}
        cursorColor={colorStyles.cursorColor}
        selectionColor={colorStyles.sectionColor}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={false} // Prevent keyboard from hiding
        onChange={handleChange}
        onChangeText={undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
      />
    )
  }, [
    value, keyboardOptions, actualInnerRef, placeholder, colorStyles, themeStyles, textStyle,
    onSubmitEditing, handleFocus, handleBlur, handleChange, handleSelectionChange
  ])

  return (
    <TextInput
      {...props}
      style={[
        colorStyles.paperInput,
        {
          paddingHorizontal: props.dense ? themeStyles.halfSpace : themeStyles.oneSpace,
          fontSize: themeStyles.normalFontSize * themeStyles.fontScale, // For some reason, this component does take into consideration `fontScale` so we have to multiply it ourselves
          lineHeight: themeStyles.normalFontSize * themeStyles.fontScale * 1.2, // For some reason, this component does take into consideration `fontScale` so we have to multiply it ourselves
          fontFamily: themeStyles.fontFamily
        },
        style
      ]}
      maxFontSizeMultiplier={1} // This affects the size of the label
      textColor={colorStyles.paperInput.color}
      selectionColor={colorStyles.paperInput.color}
      underlineColor={colorStyles.paperInput.color}
      activeUnderlineColor={colorStyles.paperInput.color}
      mode={'flat'}
      underlineStyle={{
        borderRadius: 30
      }}
      value={value || ' '}
      label={label}
      placeholder={placeholder || ''}
      render={renderInput}
      error={error}
    />
  )
}
