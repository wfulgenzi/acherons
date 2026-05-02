/**
 * MV3 service worker entry: wires push handling + runtime message routing.
 */
import { registerPushListeners } from "./listenWebPush";
import { registerRuntimeMessageHandlers } from "./listenMessages";

registerPushListeners();
registerRuntimeMessageHandlers();
