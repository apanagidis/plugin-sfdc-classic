import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
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
  caseID;

  async createSfdcCase(){
   
  }

  updateCaseDisposition(disposition){
    console.log("SFDC plugin: updating case disposition", disposition);
  }
 
  logEvent(payload) {
    // Examples on how to leverage the OpenCTI to create a Case/Account
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

    // COMMENT THIS SECTION WHEN TESTING IN STANDALONE FLEX INSTANCE (NOT EMBEDDED IN SFDC)
    // const sfdcBaseUrl = window.location.ancestorOrigins[0];
    // if (!isSalesForce(sfdcBaseUrl)) {
    //   // Continue as usual
    //   console.log('SFDC plugin: Not initializing Salesforce since this instance has been launched independently.');
    //   return;
    // }

    // const sfApiUrl = `${sfdcBaseUrl}/support/api/53.0/interaction.js`;

    // await loadScript(sfApiUrl);

    // if (!window.sforce) {
    //     console.log('SFDC plugin: Saleforce cannot be found');
    //     return;
    // }
   ////////////////////////////////////////////////////////////////////////
    
    flex.Actions.addListener("afterAcceptTask", (payload, abortFunction) => {
        console.log("SFDC plugin: afterAcceptTask", payload);
        let disposition = "call answered";
        // update case disposition
    });
    
    
    flex.Actions.addListener("beforeTransferTask", async (payload, abortFunction) => {
      console.log("SFDC plugin:beforeTransferTask" , payload)

      const { attributes } = payload.task;
      let task = payload.task;
      const newAttributes = { ...attributes }

      // caseID =createSfdcCase()
      // newsfdcUrl= sfdcBaseUrl + "/"+caseID;
      newAttributes.sfdcUrl = "https://twilio-cc-dev-ed.my.salesforce.com/5005j00000H18qR";
      
      // Updating task attributes with the new SFDC URL
      await task.setAttributes(newAttributes);
      let disposition = "transfer";
      // update case disposition
   });

   flex.Actions.addListener("afterTransferTask", async (payload, abortFunction) => {
     console.log("SFDC plugin:afterTransferTask" , Date.now(), payload)

    });

   flex.Actions.addListener('beforeStartOutboundCall', async (payload) => {
     if(payload?.isClickToDial){
       console.log("The call was started from Salesforce");
     }
    console.log(PLUGIN_NAME, 'SFDC plugin: StartOutboundCall payload:');
  });


    let currentReservation;
    let isVoice;
    manager.workerClient.on('reservationCreated',async reservation => {
      isVoice = reservation.task.taskChannelUniqueName === 'voice';
      if(isVoice){
        currentReservation = reservation;
        console.log("SFDC plugin: ", currentReservation);
        if(currentReservation) {
          !('conversations' in currentReservation.task.attributes) && (currentReservation.task.attributes.conversations = {});
          if(currentReservation.task.attributes.conversations.hang_up_by === undefined){
              currentReservation.task.attributes.conversations.hang_up_by = 'Customer';
              await currentReservation.task.setAttributes(currentReservation.task.attributes);
          }
          currentReservation = null;
        }
      }
    });
          
    flex.Actions.addListener("afterHangupCall", async (payload) => {
      if(isVoice && !payload.task?.outgoingTransferObject){
        console.log("SFDC plugin: afterHangupCall ",payload.task, payload.task.outgoingTransferObject);
        !('conversations' in payload.task.attributes) && (payload.task.attributes.conversations = {});
        payload.task.attributes.conversations.hang_up_by = 'Agent';
        await payload.task.setAttributes(payload.task.attributes);
        currentReservation = null;
      }
    });


    flex.Notifications.addListener("beforeAddNotification", (payload) => {

      // Worker does not have capacity, delete the case that was created in beforeTransferTask
      console.log("SFDC plugin: notification capture", payload?.id === "TransferFailed");

      // Failed outbound call. Todo, delete the case that was previosuly created. 
      const notifys = ["OutboundCallCanceledGeneric", "OutboundCallCanceledInvalidNumber", "OutboundCallCanceledNoAnswer","OutboundCallCanceledBusy"];
      if(notifys.includes(payload.id))
      { 
      }

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
