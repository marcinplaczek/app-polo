/* eslint-disable react/no-unstable-nested-components */
/*
 * Copyright ©️ 2024 Sebastian Delmont <sd@ham2k.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ScrollView } from 'react-native'
import { List, Menu, Text } from 'react-native-paper'
import DocumentPicker from 'react-native-document-picker'
import RNFetchBlob from 'react-native-blob-util'
import Share from 'react-native-share'

import { dataExportOptions, generateExportsForOptions, importADIFIntoOperation, loadOperation, selectOperation, selectOperationCallInfo } from '../../../store/operations'
import { loadQSOs, selectQSOs } from '../../../store/qsos'
import { selectSettings, setSettings } from '../../../store/settings'
import { useThemedStyles } from '../../../styles/tools/useThemedStyles'
import { buildTitleForOperation } from '../OperationScreen'
import { reportError, trackEvent } from '../../../distro'
import { Ham2kListSection } from '../../components/Ham2kListSection'
import { Ham2kListItem } from '../../components/Ham2kListItem'

export default function OperationDataScreen (props) {
  const { navigation, route } = props
  const styles = useThemedStyles()

  const dispatch = useDispatch()
  const operation = useSelector(state => selectOperation(state, route.params.operation))
  const qsos = useSelector(state => selectQSOs(state, operation?.uuid))
  const ourInfo = useSelector(state => selectOperationCallInfo(state, operation?.uuid))
  const settings = useSelector(selectSettings)

  useEffect(() => { // When starting, make sure all operation data is loaded
    dispatch(loadQSOs(route.params.operation))
    dispatch(loadOperation(route.params.operation))
  }, [route.params.operation, dispatch])

  useEffect(() => {
    let options = { title: 'Operation Data' }
    if (operation?.stationCall) {
      options = {
        subTitle: buildTitleForOperation({ operatorCall: operation.operatorCall, stationCall: operation.stationCall, title: operation.title, userTitle: operation.userTitle })
      }
    } else {
      options = { subTitle: 'New Operation' }
    }
    options.rightMenuItems = <DataScreenMenuItems {...{ operation, settings, styles, dispatch }} />

    navigation.setOptions(options)
  }, [dispatch, navigation, operation, settings, styles])

  const readyToExport = useMemo(() => {
    return ourInfo.call && operation.qsoCount > 0
  }, [operation.qsoCount, ourInfo.call])

  const exportOptions = useMemo(() => dataExportOptions({ operation, qsos, settings, ourInfo }), [operation, ourInfo, qsos, settings])

  const handleExports = useCallback(({ options }) => {
    options.forEach((option) => {
      trackEvent('export_operation', {
        export_type: [option.exportType ?? option.handler.key, option.format].join('.'),
        qso_count: operation.qsoCount,
        duration_minutes: Math.round((operation.startOnMillisMax - operation.startOnMillisMin) / (1000 * 60)),
        refs: (option.operationData?.refs || []).map(r => r.type).join(',')
      })
    })
    dispatch(generateExportsForOptions(operation.uuid, options)).then((paths) => {
      if (paths?.length > 0) {
        Share.open({
          urls: paths.map(p => `file://${p}`),
          type: 'text/plain' // There is no official mime type for our files
        }).then((x) => {
          console.info('Shared', x)
        }).catch((e) => {
          console.info('Sharing Error', e)
        }).finally(() => {
          // Deleting these file causes GMail on Android to fail to attach it
          // So for the time being, we're leaving them in place.
          // dispatch(deleteExport(path))
        })
      }
    })
  }, [dispatch, operation])

  const handleImportADIF = useCallback(() => {
    DocumentPicker.pickSingle({ mode: 'import', copyTo: 'cachesDirectory' }).then(async (file) => {
      const filename = decodeURIComponent(file.fileCopyUri.replace('file://', ''))
      const count = await dispatch(importADIFIntoOperation(filename, operation))
      trackEvent('import_adif', {
        import_count: count,
        qso_count: operation.qsoCount,
        refs: (operation.refs || []).map(r => r.type).join(',')
      })
      RNFetchBlob.fs.unlink(filename)
    }).catch((error) => {
      if (error.indexOf('cancelled') >= 0) {
        // ignore
      } else {
        reportError('Error importing ADIF', error)
      }
    })
  }, [dispatch, operation])

  return (
    <ScrollView style={{ flex: 1 }}>
      <Ham2kListSection title={'Export QSOs'}>
        <Ham2kListItem
          title="Export All Files"
          left={() => <List.Icon style={{ marginLeft: styles.oneSpace * 2 }} icon="share" />}
          onPress={() => readyToExport && handleExports({ options: exportOptions })}
          style={{ opacity: readyToExport ? 1 : 0.5 }}
          disabled={!readyToExport}
        />
        {exportOptions.map((option) => (
          <Ham2kListItem
            key={option.fileName}
            title={option.exportTitle}
            description={option.fileName}
            left={() => <List.Icon style={{ marginLeft: styles.oneSpace * 2 }} icon={option.handler.icon} />}
            onPress={() => readyToExport && handleExports({ options: [option] })}
            descriptionStyle={option.devMode ? { color: styles.colors.devMode } : {}}
            titleStyle={option.devMode ? { color: styles.colors.devMode } : {}}
            style={{ opacity: readyToExport ? 1 : 0.5 }}
            disabled={!readyToExport}
          />
        ))}
      </Ham2kListSection>

      <Ham2kListSection title={'Import QSOs'}>
        <Ham2kListItem
          title="Add QSOs from ADIF file"
          left={() => <List.Icon style={{ marginLeft: styles.oneSpace * 2 }} icon="file-import-outline" />}
          onPress={() => handleImportADIF()}
        />
      </Ham2kListSection>
    </ScrollView>
  )
}

function DataScreenMenuItems ({ operation, settings, styles, dispatch, online, setShowMenu }) {
  const hideAndRun = useCallback((action) => {
    setShowMenu(false)
    setTimeout(() => action(), 10)
  }, [setShowMenu])

  return (
    <>
      <Text style={{ marginHorizontal: styles.oneSpace * 2, marginVertical: styles.oneSpace * 1, ...styles.text.bold }}>
        Export Settings
      </Text>
      <Menu.Item
        leadingIcon="file-code-outline"
        trailingIcon={settings.useCompactFileNames ? 'check-circle-outline' : 'circle-outline'}
        onPress={() => { hideAndRun(() => dispatch(setSettings({ useCompactFileNames: !settings.useCompactFileNames }))) }}
        title={'Use compact file names'}

      />
    </>
  )
}
