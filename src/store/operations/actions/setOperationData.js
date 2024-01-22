import { bandForFrequency } from '@ham2k/lib-operation-data'
import { actions, selectOperation } from '../operationsSlice'
import { refHandlers } from '../../../screens/OperationScreen/activities'
import debounce from 'debounce'
import { saveOperation } from './operationsFS'
import { filterRefs, findRef, refsToString } from '../../../tools/refTools'

function debounceableDispatch (dispatch, action) {
  return dispatch(action())
}
const debouncedDispatch = debounce(debounceableDispatch, 2000)

const refTypeTitles = {
  potaActivation: 'POTA',
  sotaActivation: 'SOTA',
  iotaActivation: 'IOTA',
  botaActivation: 'BOTA',
  wwffActivation: 'WWFF',
  contest: 'Contest'
}

export const setOperationData = (data) => async (dispatch, getState) => {
  const { uuid } = data
  const operation = selectOperation(uuid)(getState()) ?? {}

  if (data.power) data.power = parseInt(data.power, 10)

  if (data.freq) {
    data.band = bandForFrequency(data.freq)
  } else if (data.band) {
    data.freq = undefined
  }

  if (data.refs) {
    const newRefs = []
    for (const ref of data.refs) {
    // await Promise.all(
    //   data.refs.map(async (ref) => {
      if (refHandlers[ref.type] && refHandlers[ref.type].decorateRef) {
        newRefs.push(await dispatch(refHandlers[ref.type].decorateRef(ref)))
      } else {
        newRefs.push(ref)
      }
    }
    // })
    // )
    data.refs = newRefs
  }

  if (data.description) {
    data.title = data.description
    data.subtitle = ''
  } else if (data.refs && !operation.description) {
    const pota = findRef(data, 'potaActivation')
    if (pota) {
      if (pota.ref) {
        data.title = `at ${refsToString(data.refs, 'potaActivation', { limit: 2 })}`
        data.subtitle = filterRefs(data, 'potaActivation').map(ref => ref.name).filter(x => x).join(', ')
      } else {
        data.title = 'at New POTA'
        data.subtitle = ''
      }
    } else {
      data.title = `at ${data.refs.map(ref => ref.ref || refTypeTitles[ref.type] || ref.type).join(', ')}`
      data.subtitle = ''
    }
  }

  if (!operation.title && (!data.title || data.title === 'at ')) {
    data.title = 'General Operation'
    data.subtitle = ''
  }

  if (!operation.grid && !data.grid && data.refs) {
    const pota = findRef(data, 'potaActivation')
    if (pota?.grid) {
      data.grid = pota.grid
    }
  }

  await dispatch(actions.setOperation(data))
  const savedOperation = selectOperation(uuid)(getState()) ?? {}
  return debouncedDispatch(dispatch, () => saveOperation(savedOperation))
}
