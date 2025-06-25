/**
 * Echo Robot Character Configuration with LangChain Integration
 * This is the main configuration file that imports the clean enhanced Echo character
 */

import { echoRobotCharacter as echoRobotCleanCharacter } from './echo-robot-clean.config';

// Export the clean enhanced character as the default Echo robot configuration
// This provides a good balance of LangChain capabilities without overwhelming complexity
export const echoRobotCharacter = echoRobotCleanCharacter;

// Also export with the original name for backward compatibility
export default echoRobotCharacter;