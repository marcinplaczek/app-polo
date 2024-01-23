/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { setOperationData } from '../../../store/operations'
import { Text, TextInput } from 'react-native-paper'
import { ActivitySettingsDialog } from '../components/ActivitySettingsDialog'
import { replaceRefs, stringToRefs } from '../../../tools/refTools'

const ACTIVITY = {
  key: 'wwff',
  comingSoon: true,
  icon: 'flower',
  name: 'World Wide Flora & Fauna',
  shortName: 'WWFF',
  infoURL: 'https://wwff.co/',
  exchangeShortLabel: 'W2W',
  huntingType: 'wwff',
  activationType: 'wwffActivation',
  description: (operation) => 'COMING SOON!',
  descriptionPlaceholder: 'Enter WWWF reference'
}

export function ThisActivitySettingsDialog (props) {
  const { styles, operation } = props

  const dispatch = useDispatch()

  const handleChange = useCallback((value) => {
    let refs
    if (value) {
      refs = stringToRefs(ACTIVITY.activationType, value, { regex: ACTIVITY.referenceRegex })
    } else {
      refs = []
    }

    dispatch(setOperationData({ uuid: operation.uuid, refs: replaceRefs(operation?.refs, ACTIVITY.activationType, refs) }))
  }, [dispatch, operation])

  return (
    <ActivitySettingsDialog
      {...props}
      icon={ACTIVITY.icon}
      title={ACTIVITY.name}
      info={ACTIVITY.infoURL}
      removeOption={true}
      value={operation[ACTIVITY.operationAttribute]}
      onChange={handleChange}
      content={({ value, setValue }) => (
        <>
          <Text variant="bodyMedium">Enter the reference for the location being activated in this operation</Text>
          <TextInput
            style={[styles.input, { marginTop: styles.oneSpace }]}
            textStyle={styles.nativeInput}
            label={'WWFF Reference'}
            placeholder={'...'}
            mode={'flat'}
            value={value}
            onChangeText={(text) => setValue(text)}
          />
          <Text variant="bodyMedium" style={{ color: styles.theme.colors.primary }}>NOT FUNCTIONAL YET, FOR TESTING PURPOSES ONLY</Text>
        </>
      )}
    />
  )
}

const ThisActivity = {
  ...ACTIVITY,
  MainExchangePanel: null,
  OptionalExchangePanel: null,
  SettingsDialog: ThisActivitySettingsDialog
}

export default ThisActivity
