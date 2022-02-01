import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import { isSalesForce } from './helpers/salesforce';
import { loadScript } from './helpers/load-script';

import reducers, { namespace } from './states';

const PLUGIN_NAME = 'SfdcClassicPlugin';

export default class SfdcClassicPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  get sfApiClassic() {
    return window.sforce.interaction;
  }
  cases = {};

  logEvent(payload) {

    // Examples
    // this.sfApiClassic.saveLog('Case','CaseNumber=00014706&Subject=cool&Status=Resolved');
    // this.sfApiClassic.saveLog('Account','Name=NewAccountName&Phone=4155551212');
 
      let taskDetailsObj = {CaseNumber: '00014706','Subject':"nice",Stats:"Resolved"}

      const logDetails = Object.keys(taskDetailsObj)
      .map(key => `${key}=${taskDetailsObj[key]}`)
      .join('&');
    
      this.sfApiClassic.saveLog('Case',logDetails);

      console.log(logDetails);
  } 


  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  async init(flex, manager) {
    this.registerReducers(manager);
    const sfdcBaseUrl = window.location.ancestorOrigins[0];
    if (!isSalesForce(sfdcBaseUrl)) {
      // Continue as usual
      console.log('Not initializing Salesforce since this instance has been launched independently.');
      return;
    }

    const sfApiUrl = `${sfdcBaseUrl}/support/api/53.0/interaction.js`;

    await loadScript(sfApiUrl);

    if (!window.sforce) {
        console.log('Saleforce cannot be found');
        return;
    }

    flex.Actions.addListener("afterHangupCall", (payload, abortFunction) => {
        this.logEvent(payload);
  });

    flex.Actions.addListener("afterCompleteTask", (payload, abortFunction) => {
      this.logEvent(payload); 
    });
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint-disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
