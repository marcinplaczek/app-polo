/*
 * Copyright ©️ 2024 Sebastian Delmont <sd@ham2k.com>
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { addRuntimeMessage } from '../store/runtime'
import { activateEnabledExtensions, registerExtension } from './registry'

import CountryFilesExtension from './core/countryFiles'
import DevModeExtension from './core/devMode'
import ADIFExtension from './core/adif'
import POTAExtension from './activities/pota/POTAExtension'
import SOTAExtension from './activities/sota/SOTAExtension'
import GMAExtension from './activities/gma/GMAExtension'
import WWFFExtension from './activities/wwff/WWFFExtension'
import FDExtension from './activities/fd/FDExtension'
import WFDExtension from './activities/wfd/WFDExtension'
import CustomExtension from './activities/custom/CustomExtension'
import WWBOTAExtension from './activities/wwbota/WWBOTAExtension'
import ECAExtension from './activities/eca/ECAExtension'
import ELAExtension from './activities/ela/ELAExtension'
import SiOTAExtentsion from './activities/siota/SiOTAExtension'
import CallNotesExtension from './data/call-notes/CallNotesExtension'
import CallHistoryExtension from './data/call-history/CallHistoryExtension'
import QRZExtension from './data/qrz/QRZExtension'
import HamDBExtension from './data/hamdb/HamDBExtension'
import HamQTHExtension from './data/hamqth/HamQTHExtension'
import SatellitesExtension from './activities/satellites/SatellitesExtension'

import NYQPExtension from './contests/nyqp/NYQPExtension'

import RadioCommands from './commands/RadioCommands'
import TimeCommands from './commands/TimeCommands'
import DebuggingCommands from './commands/DebuggingCommands'
import OperatorCommands from './commands/OperatorCommands'
import MiscCommands from './commands/MiscCommands'

import WABExtension from './other/wab/WABExtension'

const loadExtensions = () => async (dispatch, getState) => {
  dispatch(addRuntimeMessage('Loading extensions'))
  registerExtension(DevModeExtension)
  registerExtension(ADIFExtension)
  registerExtension(CountryFilesExtension)
  registerExtension(POTAExtension)
  registerExtension(SOTAExtension)
  registerExtension(GMAExtension)
  registerExtension(WWFFExtension)
  registerExtension(CustomExtension)
  registerExtension(WFDExtension)
  registerExtension(FDExtension)
  registerExtension(WWBOTAExtension)
  registerExtension(ECAExtension)
  registerExtension(ELAExtension)
  registerExtension(SiOTAExtentsion)

  registerExtension(NYQPExtension)

  registerExtension(RadioCommands)
  registerExtension(TimeCommands)
  registerExtension(DebuggingCommands)
  registerExtension(OperatorCommands)
  registerExtension(MiscCommands)

  registerExtension(CallNotesExtension)
  registerExtension(CallHistoryExtension)

  registerExtension(QRZExtension)
  registerExtension(HamDBExtension)
  registerExtension(HamQTHExtension)

  registerExtension(SatellitesExtension)

  registerExtension(WABExtension)

  await activateEnabledExtensions(dispatch, getState)
}

export default loadExtensions
